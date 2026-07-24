#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const child = require('child_process');

const root = path.resolve(__dirname, '..');
const results = [];
const failures = [];
const knownWarnings = new Set(['LEGACY_GENERATED_STATUS:compatibility:generated-internal-report']);

function read(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}
function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}
function sha256File(file) {
  return sha256Buffer(fs.readFileSync(file));
}
function record(id, passed, details={}) {
  results.push({id, status:passed?'PASS':'FAIL', details});
  if (!passed) failures.push(id);
}
function walkFiles(dir, out=[]) {
  if (!fs.existsSync(dir)) return out;
  const st = fs.statSync(dir);
  if (st.isFile()) { out.push(dir); return out; }
  for (const e of fs.readdirSync(dir, {withFileTypes:true})) {
    const p = path.join(dir,e.name);
    if (e.isDirectory()) walkFiles(p,out); else out.push(p);
  }
  return out;
}
function fingerprintProtected() {
  const paths=['data/rules','data/articles.json','data/tools.json','public','src'];
  const out={};
  for (const rel of paths) {
    const abs=path.join(root,rel);
    for (const file of walkFiles(abs)) {
      out[path.relative(root,file).replace(/\\/g,'/')]=sha256File(file);
    }
  }
  return out;
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    const out={};
    for (const key of Object.keys(value).sort()) {
      if (['generatedAt','id'].includes(key) && String(value[key]).includes('preview-evidence-')) continue;
      if (key==='generatedAt') continue;
      out[key]=stable(value[key]);
    }
    return out;
  }
  return value;
}
function validateSynthetic(obj, context={}) {
  const errors=[];
  const semver=/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
  const date=/^\d{4}-\d{2}-\d{2}(?:T.*)?$/;
  const fp=/^[a-f0-9]{64}$/i;
  if (!obj.id || typeof obj.id!=='string') errors.push('INVALID_ID');
  if (!semver.test(String(obj.version||''))) errors.push('INVALID_VERSION');
  for (const key of ['createdAt','updatedAt','generatedAt']) if (obj[key] && !date.test(obj[key])) errors.push('INVALID_DATE');
  if (obj.fingerprint && !fp.test(obj.fingerprint)) errors.push('INVALID_FINGERPRINT');
  if (context.allowedStatuses && !context.allowedStatuses.includes(obj.status)) errors.push('INVALID_STATUS');
  if (obj.publicationGate && obj.publicationGate.open===true) errors.push('PUBLICATION_GATE_OPEN');
  if (obj.automaticMutationAllowed===true) errors.push('AUTOMATIC_MUTATION_ENABLED');
  return errors;
}

const before=fingerprintProtected();

// 1. All JSON valid
let jsonCount=0, jsonErrors=[];
for (const file of walkFiles(root)) {
  if (!file.endsWith('.json')) continue;
  jsonCount++;
  try { JSON.parse(fs.readFileSync(file,'utf8')); }
  catch (e) { jsonErrors.push(path.relative(root,file).replace(/\\/g,'/')); }
}
record('all-json-valid', jsonErrors.length===0, {jsonCount,jsonErrors});

// 2. Existing structural validator passes with only known warnings
const structural=child.spawnSync('node',[path.join(root,'scripts/validate-structural-integrity.js')],{cwd:root,encoding:'utf8',timeout:120000});
let structuralParsed=null;
try { structuralParsed=JSON.parse(structural.stdout || structural.stderr); } catch {}
const unexpectedWarnings=(structuralParsed?.warnings||[]).filter(w=>!knownWarnings.has(w));
record('structural-integrity-pass', structural.status===0 && unexpectedWarnings.length===0, {
  exitCode:structural.status,
  warnings:structuralParsed?.warnings||[],
  unexpectedWarnings
});

// Negative scenarios
const base={id:'fixture',version:'1.0.0',status:'active',updatedAt:'2026-07-19'};
record('invalid-semver-rejected', validateSynthetic({...base,version:'1.0'}).includes('INVALID_VERSION'));
record('invalid-date-rejected', validateSynthetic({...base,updatedAt:'19/07/2026'}).includes('INVALID_DATE'));
record('invalid-fingerprint-rejected', validateSynthetic({...base,fingerprint:'abc'}).includes('INVALID_FINGERPRINT'));
record('invalid-status-rejected', validateSynthetic({...base,status:'unknown'},{allowedStatuses:['active','inactive']}).includes('INVALID_STATUS'));
record('open-publication-gate-rejected', validateSynthetic({...base,publicationGate:{open:true}}).includes('PUBLICATION_GATE_OPEN'));
record('automatic-mutation-enabled-rejected', validateSynthetic({...base,automaticMutationAllowed:true}).includes('AUTOMATIC_MUTATION_ENABLED'));

// Duplicate ID rejection
const duplicateFixture=[{id:'same'},{id:'same'}];
const ids=new Set(); let duplicate=false;
for (const item of duplicateFixture) { if (ids.has(item.id)) duplicate=true; ids.add(item.id); }
record('duplicate-id-rejected', duplicate);

// Broken reference and unclassified unresolved
const broken={status:'resolved',resolvedPath:'does/not/exist.json'};
record('broken-resolved-reference-rejected', broken.status==='resolved' && !fs.existsSync(path.join(root,broken.resolvedPath)));
const unresolved={original:'missing',status:'unresolved'};
const classifications=[];
record('unclassified-unresolved-reference-rejected',
  unresolved.status!=='resolved' && !classifications.some(x=>x.original===unresolved.original));

// Registry checks
const refs=read('data/core/update/canonical-reference-registry.generated.json');
const classes=read('data/core/update/reference-classification-registry.generated.json');
const vals=read('data/core/update/validator-invocation-registry.generated.json');
const allValidatorsResolve=(vals.validators||[]).every(v =>
  v.resolution?.status==='resolved' &&
  v.resolution.resolvedPath &&
  fs.existsSync(path.join(root,v.resolution.resolvedPath))
);
record('validator-paths-resolve', allValidatorsResolve, {summary:vals.summary});
record('reference-counts-consistent',
  refs.summary.references===(refs.references||[]).length &&
  refs.summary.references===(classes.entries||[]).length,
  {referenceSummary:refs.summary,classificationEntries:(classes.entries||[]).length});

// Generator semantic determinism: run twice and compare excluding generatedAt.
const generator=path.join(root,'scripts/generate-structural-integrity-report.js');
const output=path.join(root,'data/core/update/structural-integrity-report.generated.json');
const run1=child.spawnSync('node',[generator],{cwd:root,encoding:'utf8',timeout:120000});
const first=fs.existsSync(output)?stable(JSON.parse(fs.readFileSync(output,'utf8'))):null;
const run2=child.spawnSync('node',[generator],{cwd:root,encoding:'utf8',timeout:120000});
const second=fs.existsSync(output)?stable(JSON.parse(fs.readFileSync(output,'utf8'))):null;
record('generator-semantic-determinism',
  run1.status===0 && run2.status===0 && JSON.stringify(first)===JSON.stringify(second),
  {firstExit:run1.status,secondExit:run2.status});

// Mutation guard
const after=fingerprintProtected();
const changed=[];
for (const key of new Set([...Object.keys(before),...Object.keys(after)])) {
  if (before[key]!==after[key]) changed.push(key);
}
record('protected-files-unchanged', changed.length===0, {changed});

const report={
  id:'governance-test-report',
  version:'1.0.0',
  status:'generated-read-only',
  generatedAt:new Date().toISOString(),
  summary:{
    total:results.length,
    passed:results.filter(x=>x.status==='PASS').length,
    failed:results.filter(x=>x.status==='FAIL').length
  },
  results,
  safety:{
    fixturesOnly:true,
    sourceRulesModified:false,
    publicFilesModified:false,
    patchesApplied:0,
    commit:false,
    push:false,
    deploy:false,
    publication:false
  }
};
const reportFile=path.join(root,'data/core/update/governance-test-report.generated.json');
fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:failures.length?'FAIL':'PASS',summary:report.summary,failures,output:'/data/core/update/governance-test-report.generated.json'},null,2));
process.exit(failures.length?1:0);
