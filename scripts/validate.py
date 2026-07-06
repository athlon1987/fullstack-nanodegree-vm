#!/usr/bin/env python3
"""Validate every content file against curriculum.schema.json and check that all
prerequisite IDs resolve. Run from the repo root:  python scripts/validate.py
Requires: pip install jsonschema
"""
import json, sys, glob, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
schema_path = os.path.join(ROOT, "curriculum.schema.json")
content_glob = os.path.join(ROOT, "content", "*.json")

try:
    import jsonschema
except ImportError:
    sys.exit("Please: pip install jsonschema")

schema = json.load(open(schema_path))
files = sorted(glob.glob(content_glob))
if not files:
    sys.exit("No content files found.")

# 1) JSON + schema validation
projects = {}
for f in files:
    name = os.path.basename(f)
    try:
        data = json.load(open(f))
    except json.JSONDecodeError as e:
        sys.exit(f"INVALID JSON in {name}: {e}")
    try:
        jsonschema.validate(instance=data, schema=schema)
    except jsonschema.ValidationError as e:
        sys.exit(f"SCHEMA ERROR in {name}: {e.message}")
    projects[data["id"]] = data

# 2) Prerequisite resolution
errors = 0
for pid, d in projects.items():
    for p in d.get("prereq_project_ids", []):
        if p not in projects:
            print(f"MISSING PREREQ: {pid} -> {p}")
            errors += 1
    lesson_ids = {l["id"] for l in d["lessons"]}
    for l in d["lessons"]:
        for lp in l.get("prereq_lesson_ids", []):
            if lp not in lesson_ids:
                print(f"MISSING LESSON PREREQ: {l['id']} -> {lp}")
                errors += 1

lessons = sum(len(d["lessons"]) for d in projects.values())
bands = {}
for d in projects.values():
    bands.setdefault(d["age_band"], 0)
    bands[d["age_band"]] += 1

print(f"\n{len(projects)} projects, {lessons} lessons")
for b in ["9-10", "11-12", "13-14", "15-16"]:
    if b in bands:
        print(f"  {b}: {bands[b]}/16")
if errors:
    sys.exit(f"\n{errors} prerequisite error(s).")
print("\nAll valid. Prereqs resolve.")
