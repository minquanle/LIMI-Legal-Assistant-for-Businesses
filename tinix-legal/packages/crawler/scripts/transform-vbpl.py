#!/usr/bin/env python3
"""
Step 2: Transform vbpl parquet → JSONL for DB ingest.
Maps dataset columns to CanonicalDocument + LegalASTNode + DocumentSource.

Usage: python3 scripts/transform-vbpl.py [--shard N]
Output: F:/workspace/tinix-legal/data/vbpl/transform/
"""

import os, sys, json, hashlib, re, math, argparse
from datetime import datetime
from collections import defaultdict

DATA_DIR = "F:/workspace/tinix-legal/data/vbpl"
PARQUET_DIR = os.path.join(DATA_DIR, "parquet")
OUT_DIR = os.path.join(DATA_DIR, "transform")
os.makedirs(OUT_DIR, exist_ok=True)

# ── Mapping dictionaries ──────────────────────────────────────────

DOC_TYPE_MAP = {
    "luat": "LUAT",
    "phap_lenh": "PHAP_LENH",
    "nghi_dinh": "NGHI_DINH",
    "nghi_quyet": "NGHI_QUYET",
    "quyet_dinh": "QUYET_DINH",
    "thong_tu": "THONG_TU",
    "thong_tu_lien_tich": "THONG_TU_LIEN_TICH",
    "chi_thi": "CHI_THI",
    "cong_van": "CONG_VAN",
    "thong_bao": "THONG_BAO",
    "lenh": "LENH",
    "sac_lenh": "KHAC",       # We'll keep as KHAC or could add SAC_LENH
    "quyet_dinh_ca_nhan": "KHAC",
    "thong_tu_lien_bo": "THONG_TU_LIEN_TICH",
    "thong_tu_lich_bo": "THONG_TU_LIEN_TICH",
    "chi_thi_lien_bo": "CHI_THI",  # approximate
    "nghi_dinh_lien_bo": "NGHI_DINH",
    "nghi_quyet_lien_bo": "NGHI_QUYET",
    "dieu_le": "KHAC",
    "quy_che": "KHAC",
    "quy_dinh": "KHAC",
    "ban_ghi_nho": "KHAC",
    "hiep_dinh": "KHAC",
    "hiep_dinh_quoc_te": "KHAC",
    "hiep_dinh_vay_nuoc_ngoai": "KHAC",
    "cong_uoc": "KHAC",
    "nghi_dinh_thu": "KHAC",
}

SOURCE_SITE_MAP = {
    "vbpl.vn": "VBPL",
    "vbpl": "VBPL",
}

def map_doc_type(v: str) -> str:
    if not v: return "KHAC"
    v = v.strip().lower().replace(" ", "_")
    return DOC_TYPE_MAP.get(v, "KHAC")

def map_site(v: str) -> str:
    if not v: return "VBPL"
    return SOURCE_SITE_MAP.get(v.strip().lower(), "VBPL")

def normalize_number(doc_number_list, doc_type_str, doc_name, title):
    """Build normalizedNumber from doc_number or fallback."""
    if doc_number_list and isinstance(doc_number_list, list) and doc_number_list[0]:
        raw = str(doc_number_list[0]).strip()
        if raw and raw != "Không số" and raw != "null":
            return raw[:200]
    # Fallback: use doc_name (the ID)
    return doc_name[:200] if doc_name else "unknown"

def build_issuing_body_code(name: str) -> str:
    if not name: return ""
    # Simple normalization: uppercase, remove diacritics approximate
    # Just keep first letters of each word
    words = name.strip().upper().split()
    code = "".join(w[0] for w in words if w)[:10]
    return code if code else name[:10].upper()

def parse_extracted_json(extracted: any) -> dict:
    """Parse extracted_json for ARTICLE entities and statute_refs."""
    result = {
        "nodes": [],
        "statute_refs": [],
    }
    if not extracted: return result
    
    if isinstance(extracted, str):
        try: extracted = json.loads(extracted)
        except: return result
    if not isinstance(extracted, dict): return result
    
    entities = extracted.get("entities", [])
    if not isinstance(entities, list): entities = []
    
    # Build DIEU nodes from ARTICLE entities
    article_order = 0
    for ent in entities:
        if ent.get("tag") == "ARTICLE":
            article_order += 1
            text = ent.get("text", "")
            if "Điều" in text or "điều" in text:
                result["nodes"].append({
                    "nodeType": "DIEU",
                    "ordinal": text.replace("Điều", "").replace("điều", "").strip(),
                    "heading": "",
                    "content": text,
                    "path": f"dieu-{article_order}",
                    "depth": 0,
                    "orderIndex": article_order,
                })
    
    # Statute references
    statute_refs = extracted.get("statute_refs", [])
    if isinstance(statute_refs, list):
        result["statute_refs"] = [
            {"targetDocNumber": ref.get("text", ""), "relationType": "LIEN_QUAN"}
            for ref in statute_refs if isinstance(ref, dict) and ref.get("text")
        ]
    
    return result


def process_row(row, idx: int, shard: int) -> dict:
    """Transform one parquet row → ingest document dict."""
    doc_id = str(row.get("doc_name", "") or row.get("item_id", "") or str(idx))
    
    # Metadata
    doc_number_list = row.get("doc_number") or []
    if isinstance(doc_number_list, str):
        try: doc_number_list = json.loads(doc_number_list)
        except: doc_number_list = [doc_number_list]
    doc_type = row.get("doc_type") or ""
    issuing_authority = str(row.get("issuing_authority") or "")
    
    title = str(row.get("title") or "")
    markdown = str(row.get("markdown") or "")
    summary = str(row.get("summary") or "")
    legal_area = str(row.get("legal_area") or "")
    scope = str(row.get("scope") or "trung_uong")
    source_url = str(row.get("source_url") or "")
    api_url = str(row.get("api_url") or "")
    source = str(row.get("source") or "vbpl.vn")
    year = row.get("year")
    issue_date = row.get("issue_date")
    parsed_at = row.get("parsed_at")
    text_hash = str(row.get("text_hash") or "")
    
    # Parse issue_date
    promulgation_date = None
    if issue_date:
        try:
            if isinstance(issue_date, datetime):
                promulgation_date = issue_date.isoformat()
            else:
                dt = str(issue_date).strip()
                if dt and len(dt) >= 10:
                    promulgation_date = dt[:19].replace(" ", "T")
        except:
            pass
    
    # Parse extracted_json for ARTICLE entities
    extracted = row.get("extracted_json")
    extracted_data = parse_extracted_json(extracted)
    
    # Parse structure_json for meta
    sj = row.get("structure_json")
    if isinstance(sj, str):
        try: sj = json.loads(sj)
        except: sj = {}
    if not isinstance(sj, dict): sj = {}
    sj_meta = sj.get("meta", {})
    
    effective_date = sj_meta.get("effective_date") or sj_meta.get("effect_date")
    expiry_date = sj_meta.get("expiry_date")
    signer = sj_meta.get("signer", "")
    
    # Build normalized number
    norm_number = normalize_number(doc_number_list, doc_type, doc_id, title)
    issuing_body_code = build_issuing_body_code(issuing_authority)
    
    # Document source
    doc_source = {
        "site": map_site(source),
        "url": source_url or api_url,
        "contentHash": text_hash or hashlib.md5(markdown.encode()).hexdigest(),
        "lastCrawledAt": str(parsed_at) if parsed_at else datetime.utcnow().isoformat() + "Z",
    }
    
    # AST nodes from extracted_json ARTICLE entities
    ast_nodes = extracted_data.get("nodes", [])
    ast_json = json.dumps(ast_nodes, ensure_ascii=False)
    
    # Relations from statute_refs
    relations = extracted_data.get("statute_refs", [])
    
    # Determine if LLM enrich needed
    # Need LLM if: markdown has real content (>500 chars) AND no ARTICLE nodes AND no paragraphs
    has_articles = len(ast_nodes) > 0
    needs_llm = bool(markdown and len(markdown) > 500 and not has_articles)
    
    # Build document
    trich_yeu = summary or title[:500]
    if trich_yeu == "nan" or trich_yeu == "NaN" or trich_yeu == "None":
        trich_yeu = title[:500]
    
    doc = {
        "_id": doc_id,
        "_shard": shard,
        "_needs_llm": needs_llm,
        "documentNumber": str(doc_number_list[0]) if doc_number_list else "",
        "normalizedNumber": norm_number,
        "documentType": map_doc_type(doc_type),
        "title": title[:1000],
        "issuingBody": issuing_authority[:500],
        "issuingBodyCode": issuing_body_code[:50],
        "signer": signer[:200],
        "promulgationDate": promulgation_date,
        "effectiveDate": effective_date,
        "expiryDate": expiry_date,
        "field": legal_area[:200],
        "trichYeu": trich_yeu[:2000],
        "fullText": markdown,
        "ast": ast_json,
        "source": doc_source,
        "astNodes": ast_nodes,
        "relations": relations,
        "year": int(year) if year and not (isinstance(year, float) and math.isnan(year)) else None,
        "scope": scope,
    }
    
    return doc


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--shard", type=int, help="Process only one shard (0-31)")
    parser.add_argument("--limit", type=int, help="Rows per shard (for testing)")
    args = parser.parse_args()
    
    import pyarrow.parquet as pq
    import pandas as pd
    
    shards = [args.shard] if args.shard is not None else range(32)
    
    for shard_idx in shards:
        fname = f"documents-{shard_idx:05d}-of-00032.parquet"
        fpath = os.path.join(PARQUET_DIR, fname)
        if not os.path.exists(fpath):
            print(f"  [{shard_idx}/32] {fname} — not found, skip")
            continue
        
        t0 = datetime.utcnow()
        print(f"  [{shard_idx}/32] Reading {fname}...")
        
        # Read in chunks to manage memory
        pf = pq.ParquetFile(fpath)
        num_rows = pf.metadata.num_rows
        chunk_size = min(5000, num_rows)
        
        out_file = os.path.join(OUT_DIR, f"documents-{shard_idx:05d}.jsonl")
        stats_file = os.path.join(OUT_DIR, f"documents-{shard_idx:05d}.stats.json")
        
        docs_written = 0
        needs_llm_count = 0
        
        with open(out_file, "w", encoding="utf-8") as f:
            for batch_idx, batch in enumerate(pf.iter_batches(batch_size=chunk_size)):
                df = batch.to_pandas()
                if args.limit:
                    df = df.head(args.limit)
                
                for idx, (_, row) in enumerate(df.iterrows()):
                    try:
                        doc = process_row(row, idx, shard_idx)
                        f.write(json.dumps(doc, ensure_ascii=False, default=str) + "\n")
                        docs_written += 1
                        if doc["_needs_llm"]:
                            needs_llm_count += 1
                    except Exception as e:
                        print(f"  ERROR row {idx}: {e}")
                        continue
                
                if args.limit and docs_written >= args.limit:
                    break
                
                print(f"    batch {batch_idx+1}: {docs_written}/{num_rows} docs, {needs_llm_count} need LLM")
        
        elapsed = (datetime.utcnow() - t0).total_seconds()
        stats = {
            "shard": shard_idx,
            "file": fname,
            "inputRows": num_rows,
            "docsWritten": docs_written,
            "needsLLM": needs_llm_count,
            "durationSec": round(elapsed, 1),
            "ratePerSec": round(docs_written / elapsed, 1) if elapsed > 0 else 0,
        }
        with open(stats_file, "w") as f:
            json.dump(stats, f, indent=2)
        
        print(f"  [{shard_idx}/32] Done: {docs_written} docs ({needs_llm_count} need LLM) in {elapsed:.1f}s")
    
    # Summary
    print("\n=== Transform Summary ===")
    total_docs = 0
    total_llm = 0
    for shard_idx in range(32):
        sf = os.path.join(OUT_DIR, f"documents-{shard_idx:05d}.stats.json")
        if os.path.exists(sf):
            with open(sf) as f:
                s = json.load(f)
            total_docs += s["docsWritten"]
            total_llm += s["needsLLM"]
    print(f"Total documents: {total_docs}")
    print(f"Need LLM enrich: {total_llm}")
    print(f"Output: {OUT_DIR}/")

if __name__ == "__main__":
    main()
