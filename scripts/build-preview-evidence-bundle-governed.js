#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const child=require('child_process');
const root=path.resolve(__dirname,'..');

const regPath=path.join(root,'data/core/update/canonical-reference-registry.generated.json');
const valPath=path.join(root,'data/core/update/validator-invocation-registry.generated.json');
if (!fs.existsSync(regPath) || !fs.existsSync(valPath)) {
  console.error(JSON.stringify({status:'FAIL',failures:['CANONICAL_REGISTRIES_MISSING']},null,2));
  process.exit(2);
}
const refs=JSON.parse(fs.readFileSync(regPath,'utf8'));
const vals=JSON.parse(fs.readFileSync(valPath,'utf8'));
const unresolved=refs.references.filter(x=>x.status!=='resolved');
const unresolvedValidators=vals.validators.filter(x=>x.resolution.status!=='resolved');
if (unresolved.length || unresolvedValidators.length) {
  console.error(JSON.stringify({
    status:'BLOCKED',
    failures:['CANONICAL_REFERENCE_RESOLUTION_INCOMPLETE'],
    unresolvedReferences:unresolved,
    unresolvedValidators
  },null,2));
  process.exit(3);
}
const original=path.join(root,'scripts/build-preview-evidence-bundle.js');
const run=child.spawnSync('node',[original,...process.argv.slice(2)],{cwd:root,encoding:'utf8',timeout:120000});
process.stdout.write(run.stdout || '');
process.stderr.write(run.stderr || '');
process.exit(run.status === null ? 1 : run.status);
