#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const root=path.resolve(__dirname,'..');
const ledgerFile=path.join(root,'data/core/update/audit/governance-audit-ledger.generated.jsonl');
const summaryFile=path.join(root,'data/core/update/audit/governance-audit-summary.generated.json');
const failures=[];
const warnings=[];
const allowedTypes=new Set([
  'IMPACT_ANALYSIS_CREATED','APPROVAL_ARTIFACT_RECORDED','EXECUTION_PLAN_CREATED',
  'PREVIEW_EVIDENCE_CREATED','REFERENCE_REGISTRY_GENERATED',
  'STRUCTURAL_INTEGRITY_VALIDATED','REGRESSION_SUITE_EXECUTED','PUBLICATION_GATE_EVALUATED'
]);
const fp=/^[a-f0-9]{64}$/;
function sha(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}

if(!fs.existsSync(ledgerFile)) failures.push('AUDIT_LEDGER_MISSING');
if(!fs.existsSync(summaryFile)) failures.push('AUDIT_SUMMARY_MISSING');

const events=[];
if(fs.existsSync(ledgerFile)){
  const lines=fs.readFileSync(ledgerFile,'utf8').split(/\r?\n/).filter(Boolean);
  for(let i=0;i<lines.length;i++){
    try{events.push(JSON.parse(lines[i]));}
    catch(e){failures.push(`INVALID_JSONL_LINE:${i+1}`);}
  }
}
const ids=new Set();
let previous=null;
for(const e of events){
  for(const key of ['eventId','correlationId','eventType','timestamp','actor','sourceArtifact','sourceFingerprint','result','safety']){
    if(e[key]===undefined || e[key]===null || e[key]==='') failures.push(`MISSING_FIELD:${e.eventId||'unknown'}:${key}`);
  }
  if(ids.has(e.eventId)) failures.push(`DUPLICATE_EVENT_ID:${e.eventId}`);
  ids.add(e.eventId);
  if(!allowedTypes.has(e.eventType)) failures.push(`INVALID_EVENT_TYPE:${e.eventType}`);
  if(!fp.test(String(e.sourceFingerprint||''))) failures.push(`INVALID_SOURCE_FINGERPRINT:${e.eventId}`);
  const source=path.join(root,String(e.sourceArtifact||'').replace(/^\/+/,''));
  if(!fs.existsSync(source)) failures.push(`SOURCE_ARTIFACT_MISSING:${e.eventId}:${e.sourceArtifact}`);
  else if(sha(source)!==e.sourceFingerprint) failures.push(`SOURCE_FINGERPRINT_MISMATCH:${e.eventId}`);
  if(e.outputArtifact && (!e.outputFingerprint || !fp.test(e.outputFingerprint))) failures.push(`OUTPUT_FINGERPRINT_REQUIRED:${e.eventId}`);
  if(previous && (e.timestamp<previous.timestamp || (e.timestamp===previous.timestamp && e.eventId<previous.eventId))){
    failures.push(`EVENT_ORDER_INVALID:${e.eventId}`);
  }
  previous=e;
  const s=e.safety||{};
  for(const key of ['sourceMutation','publicMutation','commit','push','deploy','publication']){
    if(s[key]!==false) failures.push(`SAFETY_FLAG_INVALID:${e.eventId}:${key}`);
  }
  const serialized=JSON.stringify(e).toLowerCase();
  for(const forbidden of ['password','secretkey','access_token','refresh_token','authorization: bearer']){
    if(serialized.includes(forbidden)) failures.push(`POTENTIAL_SECRET_MATERIAL:${e.eventId}:${forbidden}`);
  }
}
let summary=null;
if(fs.existsSync(summaryFile)){
  try{summary=JSON.parse(fs.readFileSync(summaryFile,'utf8'));}catch(e){failures.push('AUDIT_SUMMARY_INVALID_JSON');}
}
if(summary){
  if(summary.status!=='generated-read-only') failures.push('AUDIT_SUMMARY_NOT_READ_ONLY');
  if(summary.summary?.events!==events.length) failures.push(`EVENT_COUNT_MISMATCH:${summary.summary?.events}:${events.length}`);
  if(summary.ledgerFingerprint!==sha(ledgerFile)) failures.push('LEDGER_FINGERPRINT_MISMATCH');
}
const result={status:failures.length?'FAIL':'PASS',failures,warnings,summary:summary?.summary||null};
if(failures.length){console.error(JSON.stringify(result,null,2));process.exit(1);}
console.log(JSON.stringify(result,null,2));
