#!/usr/bin/env python3
"""
Step 1: Download vbpl-vn dataset from HuggingFace Hub.
Downloads all 32 parquet shards + reads structure to understand schema.

Usage: python3 scripts/download-vbpl.py
Output: F:/workspace/tinix-legal/data/vbpl/parquet/  (32 shards)
        F:/workspace/tinix-legal/data/vbpl/_schema.json
"""

import os, sys, json, time
from huggingface_hub import hf_hub_download, snapshot_download

DATA_DIR = "F:/workspace/tinix-legal/data/vbpl"
PARQUET_DIR = os.path.join(DATA_DIR, "parquet")
os.makedirs(PARQUET_DIR, exist_ok=True)

REPO_ID = "tmquan/vbpl-vn"
FILENAMES = [f"documents-{i:05d}-of-00032.parquet" for i in range(32)]

print("=== Downloading vbpl-vn parquet shards ===")
print(f"Target: {PARQUET_DIR}")
print(f"Shards: {len(FILENAMES)}")
print()

for i, fname in enumerate(FILENAMES):
    dest = os.path.join(PARQUET_DIR, fname)
    if os.path.exists(dest) and os.path.getsize(dest) > 100_000:
        print(f"  [{i+1}/32] {fname} — already exists ({os.path.getsize(dest) // 1024 // 1024} MB), skip")
        continue
    t0 = time.time()
    try:
        local_path = hf_hub_download(
            repo_id=REPO_ID,
            filename=fname,
            repo_type="dataset",
            cache_dir=os.path.join(DATA_DIR, ".cache")
        )
        # Copy/symlink to parquet dir
        import shutil
        shutil.copy2(local_path, dest)
        mb = os.path.getsize(dest) / 1024 / 1024
        elapsed = time.time() - t0
        print(f"  [{i+1}/32] {fname} — {mb:.0f} MB ({elapsed:.1f}s)")
    except Exception as e:
        print(f"  [{i+1}/32] {fname} — ERROR: {e}")
        sys.exit(1)

# Quick schema inspection on first shard
print("\n=== Schema Inspection (first shard, first 3 rows) ===")
try:
    import pyarrow.parquet as pq
    import pandas as pd

    pf = pq.ParquetFile(os.path.join(PARQUET_DIR, FILENAMES[0]))
    print("\nColumns:")
    for field in pf.schema_arrow:
        print(f"  {field.name:25s} {str(field.type):35s} null={field.nullable}")

    df = pd.read_parquet(os.path.join(PARQUET_DIR, FILENAMES[0]), nrows=3)
    for idx in range(min(3, len(df))):
        row = df.iloc[idx]
        print(f"\n--- Row {idx} ---")
        for col in df.columns:
            val = row[col]
            sval = str(val)
            if col in ("markdown", "body_source"):
                continue  # skip huge fields
            if len(sval) > 500:
                sval = sval[:500] + f"... [{len(sval)} chars]"
            print(f"  {col:20s} = {sval}")

    # Save schema info
    schema_info = {
        "total_shards": 32,
        "shard_files": FILENAMES,
        "first_shard_rows": len(pq.ParquetFile(os.path.join(PARQUET_DIR, FILENAMES[0])).metadata),
        "columns": [{"name": f.name, "type": str(f.type), "nullable": f.nullable} for f in pf.schema_arrow],
        "sample_row": json.loads(df.iloc[0].to_json(force_ascii=False, default_handler=str))
    }
    with open(os.path.join(DATA_DIR, "_schema.json"), "w", encoding="utf-8") as f:
        json.dump(schema_info, f, ensure_ascii=False, indent=2, default=str)
    print(f"\nSchema saved to {DATA_DIR}/_schema.json")
    print(f"Total rows in shard 0: {schema_info['first_shard_rows']}")

except ImportError as e:
    print(f"WARNING: Cannot inspect parquet: {e}")
    print("Install with: pip install pandas pyarrow")

print("\n=== Download complete ===")
