'use strict';
const { BrainError, invariant } = require('./errors');
const { clone, deepFreeze, sha256 } = require('./integrity');

const FINAL_APPROVAL = 'approved';
function ids(items, key='id') { return new Set((items || []).map(x => x[key])); }
function duplicates(items, key='id') {
  const seen=new Set(), dup=new Set();
  for (const item of items || []) { const value=item[key]; if (seen.has(value)) dup.add(value); seen.add(value); }
  return [...dup];
}
function preflightBatch(batch, dataset) {
  invariant(batch && typeof batch === 'object', 'INVALID_BATCH', 'Batch is required');
  const errors=[];
  const domainIds=ids(dataset.domains);
  if (!domainIds.has(batch.domainId)) errors.push({code:'UNKNOWN_DOMAIN',entityId:batch.domainId});
  for (const [kind,key] of [['sources','id'],['rules','id'],['projections','id'],['dependencies','id']]) {
    for (const id of duplicates(batch[kind],key)) errors.push({code:'DUPLICATE_BATCH_ID',kind,id});
    const existing=ids(dataset[kind]);
    for (const item of batch[kind] || []) if (existing.has(item[key])) errors.push({code:'CANONICAL_ID_ALREADY_EXISTS',kind,id:item[key]});
  }
  const sourceIds=new Set([...ids(dataset.sources),...ids(batch.sources)]);
  const ruleIds=new Set([...ids(dataset.rules),...ids(batch.rules)]);
  const versionIds=new Set([...(dataset.rules||[]).flatMap(r=>(r.versions||[]).map(v=>v.versionId)),...(batch.rules||[]).flatMap(r=>(r.versions||[]).map(v=>v.versionId))]);
  for (const rule of batch.rules || []) {
    if (rule.domainId !== batch.domainId) errors.push({code:'CROSS_DOMAIN_RULE',ruleId:rule.id,domainId:rule.domainId});
    for (const version of rule.versions || []) for (const sourceId of version.sourceIds || []) if (!sourceIds.has(sourceId)) errors.push({code:'UNKNOWN_SOURCE_REFERENCE',versionId:version.versionId,sourceId});
  }
  for (const projection of batch.projections || []) {
    if (!ruleIds.has(projection.ruleId)) errors.push({code:'UNKNOWN_RULE_REFERENCE',projectionId:projection.id,ruleId:projection.ruleId});
    if (!versionIds.has(projection.ruleVersionId)) errors.push({code:'UNKNOWN_VERSION_REFERENCE',projectionId:projection.id,ruleVersionId:projection.ruleVersionId});
    for (const sourceId of projection.provenance || []) if (!sourceIds.has(sourceId)) errors.push({code:'UNKNOWN_PROVENANCE',projectionId:projection.id,sourceId});
  }
  const reviewReady=['legal','technical','approval'].every(k=>batch.reviews && batch.reviews[k] && batch.reviews[k].status===FINAL_APPROVAL);
  return deepFreeze({ok:errors.length===0,reviewReady,errors,batchFingerprint:sha256(batch)});
}
function stageBatch(batch, dataset) {
  const result=preflightBatch(batch,dataset);
  if (!result.ok) throw new BrainError('BATCH_PREFLIGHT_FAILED','Ingestion batch failed preflight',{errors:result.errors});
  invariant(result.reviewReady,'BATCH_NOT_APPROVED','All legal, technical and approval reviews must be approved');
  invariant(batch.status==='approved','INVALID_BATCH_STATUS','Only approved batches can be staged',{status:batch.status});
  const next=clone(dataset);
  for (const kind of ['sources','rules','projections','dependencies']) next[kind]=[...(next[kind]||[]),...clone(batch[kind]||[])];
  next.snapshotFingerprint=sha256({domains:next.domains,sources:next.sources,rules:next.rules,projections:next.projections,dependencies:next.dependencies,consumers:next.consumers,auditEvents:next.auditEvents,aliases:next.aliases});
  return deepFreeze({dataset:next,batchId:batch.id,batchFingerprint:result.batchFingerprint,snapshotFingerprint:next.snapshotFingerprint});
}
module.exports={preflightBatch,stageBatch};
