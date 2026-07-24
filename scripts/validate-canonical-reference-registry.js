#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const child = require('child_process');
const root = path.resolve(__dirname, '..');
function read(rel){return JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));}
const failures=[];
const refs=read('data/core/update/canonical-reference-registry.generated.json');
const vals=read('data/core/update/validator-invocation-registry.generated.json');
if (!Array.isArray(refs.references)) failures.push('REFERENCE_LIST_INVALID');
if (!Array.isArray(vals.validators)) failures.push('VALIDATOR_LIST_INVALID');
for (const item of refs.references || []) {
  if (item.status==='resolved') {
    if (!item.resolvedPath || !fs.existsSync(path.join(root,item.resolvedPath))) failures.push(`RESOLVED_PATH_MISSING:${item.original}`);
  }
  if (item.status==='ambiguous' && (!Array.isArray(item.candidates) || item.candidates.length<2)) failures.push(`AMBIGUITY_NOT_PRESERVED:${item.original}`);
}
const evidence=[];
for (const spec of vals.validators || []) {
  const res=spec.resolution || {};
  if (res.status!=='resolved') {
    evidence.push({reference:spec.reference,status:'unresolved',exitCode:null});
    continue;
  }
  const file=path.join(root,res.resolvedPath);
  const args=(spec.invocation && spec.invocation.arguments) || [];
  const run=child.spawnSync('node',[file,...args],{cwd:root,encoding:'utf8',timeout:120000});
  evidence.push({
    reference:spec.reference,
    resolvedPath:res.resolvedPath,
    args,
    status:run.status===0?'pass':'fail',
    exitCode:run.status,
    stdout:run.stdout || '',
    stderr:run.stderr || ''
  });
}
if (evidence.some(x=>x.status==='unresolved')) failures.push('VALIDATOR_UNRESOLVED');
if (evidence.some(x=>x.status==='fail')) failures.push('VALIDATOR_EXECUTION_FAILED');
if (refs.safety.publicFilesModified!==false || refs.safety.ruleFilesModified!==false) failures.push('SAFETY_FLAGS_INVALID');
const result={status:failures.length?'FAIL':'PASS',referenceSummary:refs.summary,validatorEvidence:evidence,failures};
if (failures.length){console.error(JSON.stringify(result,null,2));process.exit(1);}
console.log(JSON.stringify(result,null,2));
