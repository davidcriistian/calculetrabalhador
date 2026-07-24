#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const auditDir = path.join(root, 'data/core/update/audit');
fs.mkdirSync(auditDir, {recursive:true});

function rel(p){ return path.relative(root,p).replace(/\\/g,'/'); }
function sha(file){ return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function read(relPath){ return JSON.parse(fs.readFileSync(path.join(root,relPath),'utf8')); }
function exists(relPath){ return fs.existsSync(path.join(root,relPath)); }
function stableId(type, sourceFingerprint){
  return crypto.createHash('sha256').update(type + ':' + sourceFingerprint).digest('hex').slice(0,24);
}

const candidates = [
  {type:'IMPACT_ANALYSIS_CREATED', pattern:'data/core/update/impact-analysis', suffix:'.impact.json', result:'RECORDED'},
  {type:'APPROVAL_ARTIFACT_RECORDED', pattern:'data/core/update/execution-approvals', suffix:'.json', result:'RECORDED'},
  {type:'EXECUTION_PLAN_CREATED', pattern:'data/core/update/execution-plans', suffix:'.execution-plan.json', result:'RECORDED'},
  {type:'PREVIEW_EVIDENCE_CREATED', pattern:'data/core/update/preview-evidence', suffix:'.preview-evidence.json', result:'RECORDED'},
  {type:'REFERENCE_REGISTRY_GENERATED', file:'data/core/update/canonical-reference-registry.generated.json', result:'PASS'},
  {type:'STRUCTURAL_INTEGRITY_VALIDATED', file:'data/core/update/structural-integrity-report.generated.json', result:'PASS'},
  {type:'REGRESSION_SUITE_EXECUTED', file:'data/core/update/governance-test-report.generated.json', result:'PASS'}
];

function collectFiles(item){
  if (item.file) return exists(item.file) ? [path.join(root,item.file)] : [];
  const dir = path.join(root,item.pattern);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(name => name.endsWith(item.suffix))
    .sort()
    .map(name => path.join(dir,name));
}

const events=[];
for (const item of candidates){
  for (const file of collectFiles(item)){
    const sourceFingerprint=sha(file);
    let data={};
    try { data=JSON.parse(fs.readFileSync(file,'utf8')); } catch {}
    const correlationId =
      data?.input?.impactAnalysisFile ||
      data?.scope?.ruleId ||
      data?.ruleId ||
      data?.id ||
      'governance';
    let result=item.result;
    const status=String(data?.status || '');
    if (status.includes('blocked')) result='BLOCKED';
    if (status==='FAIL') result='FAIL';
    if (data?.summary?.failed > 0) result='FAIL';
    const event={
      eventId:`audit-${stableId(item.type,sourceFingerprint)}`,
      correlationId:String(correlationId),
      eventType:item.type,
      timestamp:new Date(fs.statSync(file).mtimeMs).toISOString(),
      actor:{type:'system',id:'central-brain-governance'},
      sourceArtifact:rel(file),
      sourceFingerprint,
      outputArtifact:null,
      outputFingerprint:null,
      result,
      approvals:[],
      validators:[],
      safety:{
        sourceMutation:false,
        publicMutation:false,
        commit:false,
        push:false,
        deploy:false,
        publication:false
      }
    };
    if (item.type==='EXECUTION_PLAN_CREATED'){
      event.approvals=(data?.approval?.approvals || data?.approvals || []).map(x=>String(x.role || x));
    }
    if (item.type==='PREVIEW_EVIDENCE_CREATED'){
      event.validators=(data?.evidence?.validators || data?.validators || []).map(x=>String(x.validator || x));
    }
    events.push(event);
  }
}
events.sort((a,b)=>a.timestamp.localeCompare(b.timestamp) || a.eventId.localeCompare(b.eventId));

const ledgerFile=path.join(auditDir,'governance-audit-ledger.generated.jsonl');
fs.writeFileSync(ledgerFile, events.map(e=>JSON.stringify(e)).join('\n') + (events.length?'\n':''));

const counts={};
for (const e of events) counts[e.eventType]=(counts[e.eventType]||0)+1;
const summary={
  id:'governance-audit-summary',
  version:'1.0.0',
  status:'generated-read-only',
  generatedAt:new Date().toISOString(),
  ledger:'data/core/update/audit/governance-audit-ledger.generated.jsonl',
  ledgerFingerprint:sha(ledgerFile),
  summary:{
    events:events.length,
    byType:counts,
    pass:events.filter(e=>e.result==='PASS').length,
    blocked:events.filter(e=>e.result==='BLOCKED').length,
    fail:events.filter(e=>e.result==='FAIL').length,
    recorded:events.filter(e=>e.result==='RECORDED').length
  },
  safety:{
    appendOnlyProjection:true,
    sourceMutation:false,
    publicMutation:false,
    publication:false
  }
};
const summaryFile=path.join(auditDir,'governance-audit-summary.generated.json');
fs.writeFileSync(summaryFile,JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',ledger:'/data/core/update/audit/governance-audit-ledger.generated.jsonl',summary:summary.summary},null,2));
