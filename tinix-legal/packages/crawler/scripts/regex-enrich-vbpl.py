#!/usr/bin/env python3
"""
Fast regex-based structure extractor for Vietnamese legal markdown.
Extracts Điều, Khoản, Điểm, Chương, Mục, Phần from markdown text.
Updates astNodes and ast in JSONL + DB via Prisma.

Usage: python3 scripts/regex-enrich-vbpl.py [--shard N]
"""

import os, sys, json, re, argparse, math
from datetime import datetime

DATA_DIR = "F:/workspace/tinix-legal/data/vbpl"
TRANSFORM_DIR = os.path.join(DATA_DIR, "transform")

# Điều patterns: "Điều 1.", "Điều 1.", "**Điều 1.**", "### Điều 1"
DIEU_RE = re.compile(
    r'(?:^|\n)\s*(?:\*\*)?(?:Điều|Ðiều|điều|Ðiều)\s+(\d+|[IVXLCDM]+)\s*[\.:;]?\s*(.*?)(?=\n\s*(?:\*\*)?(?:Điều|Ðiều|điều)\s|\Z)',
    re.DOTALL | re.MULTILINE
)

# Khoản patterns: "1.", "1) ", "Khoản 1"
KHOAN_RE = re.compile(r'(?:^|\n)\s*(\d+)\.\s+(.*?)(?=\n\s*\d+\.\s|\Z)', re.DOTALL | re.MULTILINE)

# Điểm patterns: "a)", "a. ", "a, "
DIEM_RE = re.compile(r'(?:^|\n)\s*([a-zđáéóíúýàèòìùỳâêôîûấầếệốồỗỡẫũưựửữ])\s*[\)\.]+\s+(.*?)(?=\n\s*[a-zđáéóíúýàèòìùỳ]\s*[\)\.]|\Z)', re.DOTALL | re.MULTILINE)

# Chương patterns
CHUONG_RE = re.compile(r'(?:^|\n)\s*(?:\*\*)?(?:Chương|CHƯƠNG)\s+(\d+|[IVXLCDM]+)\s*[\.:;]?\s*(.*?)(?=\n\s*(?:\*\*)?(?:Chương|Điều|Ðiều)\s|\Z)', re.DOTALL | re.MULTILINE)

# Mục patterns
MUC_RE = re.compile(r'(?:^|\n)\s*(?:\*\*)?(?:Mục|MUC)\s+(\d+|[IVXLCDM]+)\s*[\.:;]?\s*(.*?)(?=\n\s*(?:\*\*)?(?:Mục|Chương|Điều|Ðiều)\s|\Z)', re.DOTALL | re.MULTILINE)

# Phần patterns
PHAN_RE = re.compile(r'(?:^|\n)\s*(?:\*\*)?(?:Phần|PHẦN)\s+(\d+|[IVXLCDM]+)\s*[\.:;]?\s*(.*?)(?=\n\s*(?:\*\*)?(?:Phần|Mục|Chương|Điều|Ðiều)\s|\Z)', re.DOTALL | re.MULTILINE)


def extract_all(markdown: str) -> list:
    """Extract all structure nodes from markdown, ordered by position."""
    if not markdown or len(markdown.strip()) < 100:
        return []
    
    nodes = []
    
    # Extract Phần
    for m in PHAN_RE.finditer(markdown):
        nodes.append({
            "nodeType": "PHAN",
            "ordinal": m.group(1),
            "heading": m.group(2).strip()[:500] or "",
            "content": markdown[m.start():m.end()][:5000],
            "path": f"phan-{m.group(1)}",
            "depth": 0,
            "orderIndex": len(nodes) + 1,
        })
    
    # Extract Chương
    for m in CHUONG_RE.finditer(markdown):
        nodes.append({
            "nodeType": "CHUONG",
            "ordinal": m.group(1),
            "heading": m.group(2).strip()[:500] or "",
            "content": markdown[m.start():m.end()][:5000],
            "path": f"chuong-{m.group(1)}",
            "depth": 1,
            "orderIndex": len(nodes) + 1,
        })
    
    # Extract Mục
    for m in MUC_RE.finditer(markdown):
        nodes.append({
            "nodeType": "MUC",
            "ordinal": m.group(1),
            "heading": m.group(2).strip()[:500] or "",
            "content": markdown[m.start():m.end()][:5000],
            "path": f"muc-{m.group(1)}",
            "depth": 2,
            "orderIndex": len(nodes) + 1,
        })
    
    # Extract Điều
    for m in DIEU_RE.finditer(markdown):
        content = m.group(2).strip()
        nodes.append({
            "nodeType": "DIEU",
            "ordinal": m.group(1),
            "heading": content[:200] or "",
            "content": content[:5000],
            "path": f"dieu-{m.group(1)}",
            "depth": 3,
            "orderIndex": len(nodes) + 1,
        })
    
    # Sort by position in markdown
    nodes.sort(key=lambda n: markdown.find(n["content"][:50]) if n["content"] else 0)
    
    # Re-assign orderIndex
    for i, n in enumerate(nodes):
        n["orderIndex"] = i + 1
    
    return nodes


def patch_db_update(nodes: list, normalized_number: str, document_type: str, issuing_body_code: str):
    """Build a SQL update via Prisma for this document."""
    # We'll use the JSONL approach instead — update JSONL, then re-ingest only those
    return json.dumps(nodes, ensure_ascii=False)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--shard', type=int, help='Single shard to process')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    
    shards = [args.shard] if args.shard is not None else list(range(32))
    
    total_processed = 0
    total_extracted = 0
    total_skipped_has = 0
    total_skipped_short = 0
    
    for shard_idx in shards:
        padded = os.path.join(TRANSFORM_DIR, f"documents-{shard_idx:05d}.jsonl")
        short = os.path.join(TRANSFORM_DIR, f"documents-{shard_idx}.jsonl")
        jsonl_path = padded if os.path.exists(padded) else short if os.path.exists(short) else None
        if not jsonl_path:
            print(f"  [{shard_idx}/32] No JSONL, skip")
            continue
        
        # Read all docs
        with open(jsonl_path, 'r', encoding='utf-8') as f:
            lines = [l.strip() for l in f if l.strip()]
        
        if not lines:
            print(f"  [{shard_idx}/32] Empty, skip")
            continue
        
        print(f"  [{shard_idx}/32] {len(lines)} docs...")
        
        updated_docs = []
        shard_processed = 0
        shard_extracted = 0
        shard_skipped_has = 0
        shard_skipped_short = 0
        
        for line in lines:
            doc = json.loads(line)
            
            # Skip if already has astNodes from ARTICLE entities
            if doc.get("_needs_llm") == False:
                shard_skipped_has += 1
                updated_docs.append(line)
                continue
            
            # Skip short docs
            markdown = doc.get("fullText", "") or ""
            if len(markdown.strip()) < 200:
                shard_skipped_short += 1
                updated_docs.append(line)
                continue
            
            # Extract nodes via regex
            nodes = extract_all(markdown)
            
            if nodes:
                doc["astNodes"] = nodes
                doc["ast"] = json.dumps(nodes, ensure_ascii=False)
                doc["_needs_llm"] = False
                shard_extracted += 1
            else:
                shard_skipped_short += 1
            
            shard_processed += 1
            updated_docs.append(json.dumps(doc, ensure_ascii=False))
        
        # Write updated JSONL (overwrite)
        if not args.dry_run:
            with open(jsonl_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(updated_docs))
        
        total_processed += shard_processed
        total_extracted += shard_extracted
        total_skipped_has += shard_skipped_has
        total_skipped_short += shard_skipped_short
        
        print(f"    → processed: {shard_processed}, extracted: {shard_extracted}, skip_has: {shard_skipped_has}, skip_short: {shard_skipped_short}")
    
    print(f"\n=== {'DRY RUN' if args.dry_run else 'REGEX ENRICH'} Complete ===")
    print(f"Processed: {total_processed}")
    print(f"Extracted nodes by regex: {total_extracted}")
    print(f"Skipped (already had nodes): {total_skipped_has}")
    print(f"Skipped (short/no nodes found): {total_skipped_short}")
    print(f"Remaining need LLM: {total_skipped_short}")


if __name__ == "__main__":
    main()
