#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const planArg = process.argv.includes('--plan') ? process.argv[process.argv.indexOf('--plan') + 1] : null;
if (!planArg) {
  console.error(JSON.stringify({status:'FAIL', failures:['PLAN_REQUIRED']}, null, 2));
  process.exit(2);
}
const planFile = path.isAbsolute(planArg) ? planArg : path.join(root, planArg.replace(/^\/+/, ''));
const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
const all = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else all.push(path.relative(root, p).replace(/\\/g, '/'));
  }
}
walk(root);
const byBase = new Map(), byStem = new Map();
for (const rel of all) {
  const b = path.basename(rel).toLowerCase();
  const s = path.basename(rel, path.extname(rel)).toLowerCase();
  if (!byBase.has(b)) byBase.set(b, []);
  if (!byStem.has(s)) byStem.set(s, []);
  byBase.get(b).push(rel); byStem.get(s).push(rel);
}
function normalize(v) {
  return String(v || '').replace(/\\/g, '/').replace(/^file:\/\//, '').replace(/^\/+/, '').replace(/\/+/g, '/');
}
function resolve(ref) {
  const n = normalize(ref);
  if (!n) return {original:ref,normalized:n,status:'invalid',resolvedPath:null,method:null,candidates:[]};
  if (fs.existsSync(path.join(root,n)) && fs.statSync(path.join(root,n)).isFile())
    return {original:ref,normalized:n,status:'resolved',resolvedPath:n,method:'exact-path',candidates:[n]};
  const keys = [n];
  for (const pfx of ['article:','tool:','calculator:','cluster:','nucleus:','rule:'])
    if (n.startsWith(pfx)) keys.push(n.slice(pfx.length));
  const candidates = new Set();
  for (const key of keys) {
    for (const c of byBase.get(path.basename(key).toLowerCase()) || []) candidates.add(c);
    for (const c of byStem.get(path.basename(key, path.extname(key)).toLowerCase()) || []) candidates.add(c);
  }
  if (candidates.size === 1) {
    const c = [...candidates][0];
    return {original:ref,normalized:n,status:'resolved',resolvedPath:c,method:'file-index',candidates:[c]};
  }
  if (candidates.size > 1)
    return {original:ref,normalized:n,status:'ambiguous',resolvedPath:null,method:'multiple-candidates',candidates:[...candidates].sort()};
  return {original:ref,normalized:n,status:'unresolved',resolvedPath:null,method:'no-candidate',candidates:[]};
}
const refs = (plan.scope && plan.scope.affectedFiles || []).map(resolve);
const out = {
  id:'canonical-reference-registry',
  version:'1.0.0',
  status:'generated-read-only',
  generatedAt:new Date().toISOString(),
  sourceExecutionPlan:path.relative(root,planFile).replace(/\\/g,'/'),
  ruleId:plan.scope.ruleId,
  summary:{
    references:refs.length,
    resolved:refs.filter(x=>x.status==='resolved').length,
    ambiguous:refs.filter(x=>x.status==='ambiguous').length,
    unresolved:refs.filter(x=>x.status==='unresolved').length,
    invalid:refs.filter(x=>x.status==='invalid').length
  },
  references:refs,
  safety:{legacyFilesModified:false,publicFilesModified:false,ruleFilesModified:false}
};
const output = path.join(root,'data/core/update/canonical-reference-registry.generated.json');
fs.writeFileSync(output, JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',summary:out.summary,output:'/data/core/update/canonical-reference-registry.generated.json'},null,2));
