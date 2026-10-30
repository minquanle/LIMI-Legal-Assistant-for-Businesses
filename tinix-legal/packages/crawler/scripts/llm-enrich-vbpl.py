#!/usr/bin/env python3
"""
Step 2b: LLM Enrich — gọi API localhost:20128/v1 cho docs cần extract structure.
Đọc JSONL từ transform, gọi LLM, update astNodes + ast.

Usage: python3 scripts/llm-enrich-vbpl.py [--shard N] [--limit N]
Output: JSONL cập nhật (ghi đè)
"""

import os, sys, json, time, argparse
from datetime import datetime

API_URL = "http://localhost:20128/v1/chat/completions"
MODEL = "openrouter/nvidia/nemotron-3-nano-30b-a3b:free"
DATA_DIR = "F:/workspace/tinix-legal/data/vbpl"
TRANSFORM_DIR = os.path.join(DATA_DIR, "transform")

SYSTEM_PROMPT = """Bạn là chuyên gia phân tích văn bản pháp luật Việt Nam.
Hãy đọc markdown và trích xuất cấu trúc Phần/Chương/Mục/Điều/Khoản/Điểm.

Trả về JSON array, mỗi phần tử là:
{"nodeType": "DIEU"|"KHOAN"|"DIEM"|"CHUONG"|"MUC"|"PHAN",
 "ordinal": "số thứ tự",
 "heading": "tiêu đề (nếu có)",
 "content": "nội dung", 
 "depth": độ sâu 0-based,
 "orderIndex": thứ tự hiển thị}

Output ONLY the JSON array, không thêm text khác."""

def call_llm(markdown: str, max_retries=1) -> list:
    """Call LLM API to extract structure from markdown."""
    import urllib.request
    import concurrent.futures
    
    if len(markdown) > 40000:
        markdown = markdown[:20000] + "\n...[MIDDLE TRUNCATED]...\n" + markdown[-20000:]
    
    prompt = markdown[:50000]
    if not prompt.strip():
        return []
    
    for attempt in range(max_retries + 1):
        try:
            body = json.dumps({
                "model": MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.1,
                "max_tokens": 4000,
            })
            
            req = urllib.request.Request(
                API_URL,
                data=body.encode(),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            
            with urllib.request.urlopen(req, timeout=60) as resp:
                result = json.loads(resp.read().decode())
                content = result["choices"][0]["message"]["content"]
                
                content = content.strip()
                if content.startswith("```json"):
                    content = content[7:]
                if content.startswith("```"):
                    content = content[3:]
                if content.endswith("```"):
                    content = content[:-3]
                
                nodes = json.loads(content)
                if isinstance(nodes, list) and len(nodes) > 0:
                    return nodes
                return []
        except Exception as e:
            if attempt < max_retries:
                time.sleep(3)
            else:
                return []
    return []


def call_llm_batch(docs: list, max_workers: int = 5) -> list:
    """Call LLM for multiple docs concurrently."""
    results = []
    
    def process_doc(doc):
        md = doc.get("fullText", "") or ""
        if len(md.strip()) < 200:
            return (doc, False, [])
        nodes = call_llm(md)
        if nodes:
            doc["astNodes"] = nodes
            doc["ast"] = json.dumps(nodes, ensure_ascii=False)
            doc["_needs_llm"] = False
            return (doc, True, nodes)
        return (doc, False, [])
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(process_doc, doc) for doc in docs]
        for i, future in enumerate(concurrent.futures.as_completed(futures)):
            doc, ok, nodes = future.result()
            results.append((doc, ok, nodes))
            if (i + 1) % 10 == 0:
                print(f"      [{i+1}/{len(docs)}] LLM: {sum(1 for _,ok,_ in results if ok)} OK / {i+1} done")
    
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--shard", type=int, help="Process only one shard")
    parser.add_argument("--limit", type=int, help="Max docs to process")
    parser.add_argument("--concurrency", type=int, default=3, help="LLM concurrency")
    args = parser.parse_args()
    
    import concurrent.futures
    
    shards = [args.shard] if args.shard is not None else range(32)
    total_enriched = 0
    total_docs = 0
    total_cost = 0  # in chars processed
    
    for shard_idx in shards:
        jsonl_path = os.path.join(TRANSFORM_DIR, f"documents-{shard_idx:05d}.jsonl")
        if not os.path.exists(jsonl_path):
            print(f"  [{shard_idx}/32] No JSONL found, skip")
            continue
        
        # Read all docs, find ones needing LLM
        docs = []
        with open(jsonl_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line: continue
                doc = json.loads(line)
                docs.append(doc)
        
        needs_llm = [d for d in docs if d.get("_needs_llm") and d.get("fullText") and len(d["fullText"]) > 200]
        if not needs_llm:
            print(f"  [{shard_idx}/32] {len(docs)} docs, none need LLM, skip")
            total_docs += len(docs)
            continue
        
        if args.limit:
            needs_llm = needs_llm[:args.limit]
        
        print(f"  [{shard_idx}/32] {len(docs)} docs, {len(needs_llm)} need LLM extract...")
        
        enriched = 0
        failed = 0
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrency) as pool:
            futures = {}
            for doc in needs_llm:
                future = pool.submit(call_llm, doc["fullText"])
                futures[future] = doc
            
            for future in concurrent.futures.as_completed(futures):
                doc = futures[future]
                try:
                    nodes = future.result()
                    if nodes:
                        # Update astNodes
                        doc["astNodes"] = nodes
                        doc["ast"] = json.dumps(nodes, ensure_ascii=False)
                        doc["_needs_llm"] = False
                        enriched += 1
                        total_cost += len(doc["fullText"])
                    else:
                        doc["_needs_llm"] = True  # keep flag
                        failed += 1
                except Exception as e:
                    print(f"    LLM error: {e}")
                    failed += 1
                
                total_enriched += 1
                if (enriched + failed) % 10 == 0 or (enriched + failed) == len(needs_llm):
                    print(f"    LLM progress: {enriched} enriched, {failed} failed / {len(needs_llm)}")
        
        # Write back updated JSONL
        with open(jsonl_path, "w", encoding="utf-8") as f:
            for doc in docs:
                f.write(json.dumps(doc, ensure_ascii=False, default=str) + "\n")
        
        total_docs += len(docs)
        print(f"  [{shard_idx}/32] Done: {enriched} enriched, {failed} failed in shard")
    
    print(f"\n=== LLM Enrich Complete ===")
    print(f"Total docs: {total_docs}")
    print(f"Total enriched: {total_enriched}")
    print(f"Total chars sent to LLM: {total_cost:,}")
    print(f"Estimated cost: ~{total_cost / 1000000:.2f}M chars (free model)")

if __name__ == "__main__":
    main()
