#!/usr/bin/env python3
"""Siapkan deploy-data/db.json untuk InfinityFree.

Menggabungkan:
  - projects metadata dari data/db.json lokal (hasil edit admin di dashboard lokal)
  - drawings + hps dari sync/drawing_data.json (hasil sync GitHub Actions)

Output: deploy-data/db.json dengan bentuk persis seperti /api/state.
"""
import json
import sys
from pathlib import Path


def main() -> int:
    sync_json, local_db_json, out_path = sys.argv[1:4]

    drawings = json.loads(Path(sync_json).read_text(encoding="utf-8"))
    payload = {
        "generated": drawings.get("generated", ""),
        "drawings": {
            "generated": drawings.get("generated", ""),
            "rows": drawings.get("rows", []),
            "errors": drawings.get("errors", []),
        },
    }
    if "hps" in drawings:
        payload["hps"] = {"generated": drawings.get("generated", ""), "rows": drawings["hps"]}

    local_db = Path(local_db_json)
    if local_db.exists():
        try:
            db = json.loads(local_db.read_text(encoding="utf-8"))
            projects = db.get("projects")
            if isinstance(projects, dict):
                payload["projects"] = projects
            elif isinstance(projects, list):
                # bentuk lama: list of {id,...} -> kembalikan ke map
                payload["projects"] = {p["id"]: {k: v for k, v in p.items() if k != "id"} for p in projects}
        except Exception as e:
            print(f"WARN: Gagal membaca {local_db_json}: {e}")

    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"deploy-data/db.json: {len(payload['drawings']['rows'])} drawing, "
          f"{len(payload.get('hps', {}).get('rows', []))} HPS, "
          f"{len(payload.get('projects', {}))} proyek")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
