#!/usr/bin/env python3
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'audit'/'manifest-sha256.generated.json'
EXCLUDED={
 OUT.resolve(),
 (ROOT/'validation'/'validation-report.generated.json').resolve(),
 (ROOT/'audit'/'phase-d-knowledge-consolidation.json').resolve(),
 (ROOT/'docs'/'sprint-5'/'phase-d-consolidation-correction-report.json').resolve(),
 (ROOT/'audit'/'phase-e-internal-consistency.json').resolve(),
 (ROOT/'docs'/'sprint-5'/'phase-e-consistency-correction-report.json').resolve(),
}
files=[]
for p in sorted(x for x in ROOT.rglob('*') if x.is_file() and x.resolve() not in EXCLUDED):
 b=p.read_bytes(); files.append({'path':p.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b)})
root_seed='\n'.join(f"{x['path']}:{x['sha256']}:{x['bytes']}" for x in files)
obj={'algorithm':'sha256','generatedAt':'2026-07-24T00:30:00.000Z','scope':'all immutable package files under central-brain-v2; excludes this manifest, mutable validation report and detached phase evidence files that bind to the manifest root hash','fileCount':len(files),'rootHash':'sha256:'+hashlib.sha256(root_seed.encode()).hexdigest(),'files':files}
OUT.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'ok':True,'fileCount':len(files),'rootHash':obj['rootHash']},indent=2))
