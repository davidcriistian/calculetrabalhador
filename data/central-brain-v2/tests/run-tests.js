'use strict';
const assert = require('assert');
const { CentralBrain } = require('../engines/brain');
const { generateProjection, validateProjection, publishProjection, retireProjection } = require('../engines/projection-engine');
const { createAuditEvent, appendAuditEvent, validateAuditChain } = require('../engines/governance-engine');
const { loadDataset } = require('../engines/loader');
const { sha256 } = require('../engines/integrity');
const { preflightBatch, stageBatch } = require('../engines/ingestion-engine');
const now='2026-07-21T12:00:00.000Z';
const source={id:'SRC-TEST-LAW',type:'law',jurisdiction:'BR',title:'Test Law',status:'verified',retrievedAt:now,evidence:[{kind:'citation',value:'test'}],checksum:null};
const version={versionId:'VER-TEST-2026',validFrom:'2026-01-01',validTo:'2026-12-31',recordedAt:'2026-01-01T00:00:00.000Z',recordedUntil:null,status:'approved',sourceIds:[source.id],parameters:{rate:0.1},conditions:[],exceptions:[],approval:{approvedBy:'tester',approvedAt:now,reviewId:'REV-1'},contentFingerprint:'sha256:'+'a'.repeat(64)};
const rule={id:'RULE-TEST',domainId:'test-domain',title:'Test Rule',status:'approved',versions:[version],aliases:[],dependencies:[],consumerIds:['CNS-TEST']};
let projection=generateProjection({rule,version,projectionType:'calculator-parameters',payload:{rate:0.1},generatedAt:now});
assert.equal(projection.status,'draft'); assert(Object.isFrozen(projection));
projection=validateProjection(projection); assert.equal(projection.status,'validated');
projection=publishProjection(projection,now); assert.equal(projection.status,'published');
const dataset={domains:[{id:'test-domain',name:'Test',status:'active',maturity:'READY_FOR_CONSUMERS',consumerReady:true,dependencies:[],aliases:[]}],sources:[source],rules:[rule],projections:[projection],dependencies:[{id:'DEP-TEST',from:'CNS-TEST',fromType:'consumer',to:'RULE-TEST',toType:'rule',relation:'consumes',status:'verified',declaredAt:now,verifiedAt:now,metadata:{}}],consumers:[{id:'test',canonicalId:'CNS-TEST',type:'calculator',path:'/test/',declaredRuleDependencies:['test-domain'],risk:'low',integrationStatus:'SHADOW',authority:'central-brain'}],auditEvents:[],aliases:[]};
const brain=new CentralBrain(dataset);
const response=brain.getProjection({ruleId:'RULE-TEST',referenceDate:'2026-06-01',projectionType:'calculator-parameters',consumerId:'CNS-TEST',asKnownAt:now});
assert.deepEqual(response.payload,{rate:0.1}); assert.equal(response.provenance[0],source.id);
assert(brain.getImpact('RULE-TEST').includes('CNS-TEST'));
assert.throws(()=>brain.getProjection({ruleId:'RULE-TEST',referenceDate:'2027-01-01',projectionType:'calculator-parameters',consumerId:'CNS-TEST',asKnownAt:now}),e=>e.code==='NO_VERSION_FOR_DATE');
const retired=retireProjection(projection,now); assert.equal(retired.status,'retired');
const event=createAuditEvent({actor:'tester',action:'publish',entityType:'projection',entityId:projection.id,before:null,after:projection,reason:'test',correlationId:'CORR-1',occurredAt:now});
const chain=appendAuditEvent([],event); assert.equal(chain.length,1); assert.equal(validateAuditChain(chain),true);
const tampered=[{...chain[0],reason:'changed'}]; assert.throws(()=>validateAuditChain(tampered),e=>e.code==='AUDIT_EVENT_HASH_MISMATCH');
const second=createAuditEvent({actor:'tester-2',action:'validate',entityType:'projection',entityId:projection.id,before:projection,after:projection,reason:'second',correlationId:'CORR-2',occurredAt:now,sequence:2,previousEventHash:chain[0].eventHash});
const chain2=appendAuditEvent(chain,second); assert.equal(validateAuditChain(chain2),true);
assert.throws(()=>validateAuditChain([chain2[1],chain2[0]]),e=>['AUDIT_SEQUENCE_BROKEN','AUDIT_PREVIOUS_HASH_MISMATCH'].includes(e.code));
assert.throws(()=>validateAuditChain([chain2[1]]),e=>['AUDIT_SEQUENCE_BROKEN','AUDIT_PREVIOUS_HASH_MISMATCH'].includes(e.code));
const loaded=loadDataset(require('path').resolve(__dirname,'..')); assert(Object.isFrozen(loaded)); assert(loaded.snapshotFingerprint.startsWith('sha256:'));
const batch={id:'BATCH-TEST',domainId:'test-domain',status:'approved',createdAt:now,createdBy:'tester',correlationId:'CORR-BATCH',sources:[],rules:[],projections:[],dependencies:[],reviews:{legal:{status:'approved',reviewer:'legal',reviewedAt:now,notes:[]},technical:{status:'approved',reviewer:'tech',reviewedAt:now,notes:[]},approval:{status:'approved',reviewer:'owner',reviewedAt:now,notes:[]}},notes:[]};
const preflight=preflightBatch(batch,dataset); assert.equal(preflight.ok,true); assert.equal(preflight.reviewReady,true); assert(Object.isFrozen(preflight));
const staged=stageBatch(batch,dataset); assert.equal(staged.batchId,'BATCH-TEST'); assert(Object.isFrozen(staged)); assert(Object.isFrozen(staged.dataset));
const badBatch={...batch,id:'BATCH-BAD',domainId:'unknown-domain'}; assert.equal(preflightBatch(badBatch,dataset).ok,false);
const unapproved={...batch,id:'BATCH-PENDING',status:'draft',reviews:{...batch.reviews,approval:{status:'pending',reviewer:null,reviewedAt:null,notes:[]}}}; assert.throws(()=>stageBatch(unapproved,dataset),e=>e.code==='BATCH_NOT_APPROVED');
const fs=require('fs');
const domainCatalog=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../knowledge/domains/aviso-previo/sources/index.json'),'utf8'));
const sourceRegistry=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../registries/sources.json'),'utf8'));
assert.equal(domainCatalog.status,'SOURCES_VALIDATED');
assert.equal(domainCatalog.items.length,14);
assert.equal(new Set(domainCatalog.items.map(x=>x.sourceId)).size,14);
assert(domainCatalog.items.some(x=>x.role==='scope-boundary' && x.applicability==='excluded'));
assert(domainCatalog.items.every(x=>sourceRegistry.items.some(s=>s.id===x.sourceId)));
const conceptCatalog=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../knowledge/domains/aviso-previo/concepts/index.json'),'utf8'));
const ontology=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../ontology/relations.json'),'utf8'));
assert.equal(conceptCatalog.status,'CONCEPTS_VALIDATED');
assert.equal(conceptCatalog.items.length,16);
assert.equal(new Set(conceptCatalog.items.map(x=>x.conceptId)).size,16);
assert(ontology.items.length>=15);
assert(ontology.items.every(x=>conceptCatalog.items.some(c=>c.conceptId===x.fromConceptId)));
assert(ontology.items.every(x=>conceptCatalog.items.some(c=>c.conceptId===x.toConceptId)));
const manifest=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../knowledge/domains/aviso-previo/manifest.json'),'utf8'));
assert(['FACTS_LOADED','PROJECTIONS_LOADED','TECHNICALLY_VALIDATED_LEGAL_REVIEW_PENDING'].includes(manifest.stage));
assert.equal(manifest.consumerReady,false);

// Sprint 5.2: schemas and contracts
const s5Schemas=['legal-fact','fact-package','canonical-projection','projection-result','projection-catalog'];
const schemaIndex=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../schemas/index.json'),'utf8'));
for (const id of s5Schemas) assert(schemaIndex.items.some(x=>x.id===id),`missing schema ${id}`);
const contractIndex=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../contracts/index.json'),'utf8'));
for (const id of ['projection-engine','projection-result']) assert(contractIndex.items.some(x=>x.id===id),`missing contract ${id}`);
const engineContract=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../contracts/projection-engine.contract.json'),'utf8'));
assert.equal(engineContract.runtimeAuthority,false);
assert.equal(engineContract.consumerReady,false);
assert(engineContract.statusModel.includes('insufficient_facts'));
assert(engineContract.statusModel.includes('human_review_required'));
const canonicalProjectionSchema=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../schemas/canonical-projection.schema.json'),'utf8'));
assert.equal(canonicalProjectionSchema.properties.id.pattern,'^PROJ-[A-Z0-9-]+$');
const legacyProjectionSchema=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../schemas/projection.schema.json'),'utf8'));
assert.equal(legacyProjectionSchema.properties.id.pattern,'^PRJ-[A-Z0-9-]+$');


// Sprint 5.3: canonical legal facts
const factCatalog=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../knowledge/domains/aviso-previo/facts/index.json'),'utf8'));
assert.equal(factCatalog.status,'FACTS_IN_REVIEW');
assert.equal(factCatalog.items.length,39);
assert.equal(new Set(factCatalog.items.map(x=>x.factId)).size,39);
const factIds=new Set(factCatalog.items.map(x=>x.factId));
for (const item of factCatalog.items) {
  const rec=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../knowledge/domains/aviso-previo/facts',item.path),'utf8'));
  assert.equal(rec.id,item.factId); assert(/^sha256:[a-f0-9]{64}$/.test(rec.contentFingerprint));
  for (const dep of (rec.relationships.dependsOnFactIds||[])) assert(factIds.has(dep),`missing fact dependency ${dep}`);
}
for (const name of fs.readdirSync(require('path').resolve(__dirname,'../knowledge/domains/aviso-previo/rules')).filter(x=>/^RULE-AP-.*\.json$/.test(x))) {
 const r=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../knowledge/domains/aviso-previo/rules',name),'utf8'));
 for (const v of r.versions) for (const fid of (v.factsRequired||[])) assert(factIds.has(fid),`undefined canonical fact ${fid}`);
}
const factsRegistry=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../registries/facts.json'),'utf8'));
assert.equal(factsRegistry.items.length,39);
assert(['FACTS_LOADED','PROJECTIONS_LOADED','TECHNICALLY_VALIDATED_LEGAL_REVIEW_PENDING'].includes(manifest.stage));

// Sprint 5.4: canonical projections
const projectionCatalog=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../knowledge/projections/domains/aviso-previo/index.json'),'utf8'));
assert.equal(projectionCatalog.status,'PROJECTIONS_MODELED');
assert.equal(projectionCatalog.items.length,17);
assert.equal(new Set(projectionCatalog.items.map(x=>x.projectionId)).size,17);
const projectionIds=new Set(projectionCatalog.items.map(x=>x.projectionId));
for (const item of projectionCatalog.items) {
 const rec=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../knowledge/projections/domains/aviso-previo',item.path),'utf8'));
 assert.equal(rec.id,item.projectionId);
 assert(/^sha256:[a-f0-9]{64}$/.test(rec.contentFingerprint));
 for (const d of rec.dependencies) assert(projectionIds.has(d.projectionId));
 for (const f of rec.inputFacts) assert(factIds.has(f.factId));
}
const depGraph=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../knowledge/projections/domains/aviso-previo/traceability/dependency-graph.json'),'utf8'));
assert.equal(depGraph.acyclic,true);
assert(['PROJECTIONS_LOADED','TECHNICALLY_VALIDATED_LEGAL_REVIEW_PENDING'].includes(manifest.stage));
// Sprint 5.6.3 governance integrity
const identityPolicy=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../governance/identity-policy.json'),'utf8'));
assert.equal(identityPolicy.prefixes.projection,'PROJ-'); assert.equal(identityPolicy.prefixes.legacyProjection,'PRJ-');
const approvalSchema=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../schemas/approval-record.schema.json'),'utf8')); assert(approvalSchema.required.includes('contentFingerprint'));
const auditRegistry=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../registries/audit-events.json'),'utf8')); assert.equal(validateAuditChain(auditRegistry.items),true); assert.equal(auditRegistry.chain.eventCount,auditRegistry.items.length);

// Sprint 5.6.6: domain federation and coverage integrity
const globalProjectionRegistry=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../registries/projections.json'),'utf8'));
assert.equal(globalProjectionRegistry.items.length,17);
assert(globalProjectionRegistry.items.every(x=>x.id.startsWith('PROJ-')));
const maturity566=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../knowledge/domains/aviso-previo/governance/maturity.json'),'utf8'));
assert.equal(maturity566.technicalMaturity,'PROJECTIONS_VALIDATED'); assert.equal(maturity566.consumerReady,false);
const sharedVocabulary=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../knowledge/shared/vocabulary.json'),'utf8'));
assert.equal(sharedVocabulary.facts.length,4);
const federationIndex=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../knowledge/federation/index.json'),'utf8'));
assert.equal(federationIndex.items.length,3);
const ap8v566=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../knowledge/projections/domains/aviso-previo/records/PROJ-AP-008.json'),'utf8'));
assert.deepEqual(ap8v566.outputs.find(x=>x.key==='cross_domain_requirements').defaultValue,['FED-AP-FGTS','FED-AP-FERIAS','FED-AP-13']);
const sourceCoverage=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../knowledge/domains/aviso-previo/rules/traceability/source-to-rules.json'),'utf8'));
assert.equal(sourceCoverage.coverageExceptions['SRC-TST-SUMULA-305'].contractId,'FED-AP-FGTS');
assert(sourceRegistry.items.every(x=>/^sha256:[a-f0-9]{64}$/.test(x.checksum)));


// Sprint 5.6.7 Phase 1: legal governance completion
const ruleVersionSchemaPhase1=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../schemas/rule-version.schema.json'),'utf8'));
assert(ruleVersionSchemaPhase1.required.includes('approvalStatus'));
assert(ruleVersionSchemaPhase1.properties.approvalStatus.enum.includes('LEGAL_APPROVED'));
const approvalSchemaPhase1=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../schemas/approval-record.schema.json'),'utf8'));
assert(approvalSchemaPhase1.required.includes('reviewScope'));
assert(approvalSchemaPhase1.properties.decisions.items.properties.decision.enum.includes('submitted'));
for (const name of fs.readdirSync(require('path').resolve(__dirname,'../knowledge/domains/aviso-previo/rules')).filter(x=>/^RULE-AP-.*\.json$/.test(x))) {
 const r=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../knowledge/domains/aviso-previo/rules',name),'utf8'));
 for (const v of r.versions) assert.equal(v.approvalStatus,'UNDER_LEGAL_REVIEW');
}
const maturityPhase1=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../knowledge/domains/aviso-previo/governance/maturity.json'),'utf8'));
assert.equal(maturityPhase1.technicalMaturity,'PROJECTIONS_VALIDATED');
assert.equal(maturityPhase1.legalMaturity,'PENDING_FORMAL_REVIEW');
assert.equal(maturityPhase1.consumerReady,false);
const ruleCatalogPhase1=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../knowledge/domains/aviso-previo/rules/index.json'),'utf8'));
assert.equal(ruleCatalogPhase1.verification.ruleCount,ruleCatalogPhase1.items.length);
assert.equal(ruleCatalogPhase1.verification.verifiedBy,'central-brain-phase-c-correction');
const approvalPolicyPhase1=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../governance/approval-policy.json'),'utf8'));
assert.equal(approvalPolicyPhase1.roles.author.requiredDecision,'submitted');
assert.equal(approvalPolicyPhase1.roles.legalReviewer.requiredDecision,'approved');


// Sprint 5.6.7 Phase 2 legal model expansion
const ruleCatalogPhase2=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../knowledge/domains/aviso-previo/rules/index.json'),'utf8'));
assert.equal(ruleCatalogPhase2.items.length,15);
for (const id of ['RULE-AP-007','RULE-AP-008','RULE-AP-009','RULE-AP-010','RULE-AP-011','RULE-AP-012','RULE-AP-013','RULE-AP-014']) assert(ruleCatalogPhase2.items.some(x=>x.ruleId===id));
for (const id of ['SRC-BR-CLT-ART481','SRC-BR-CLT-ART483','SRC-BR-CLT-ART484','SRC-BR-CLT-ART484A','SRC-BR-CLT-ART489-491','SRC-TST-SUMULA-14']) assert(domainCatalog.items.some(x=>x.sourceId===id));

// Phase E: internal consistency invariants
const phaseEBaseline=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../knowledge/domains/aviso-previo/governance/normative-baseline.json'),'utf8'));
const phaseEMaturity=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../knowledge/domains/aviso-previo/governance/maturity.json'),'utf8'));
const normativeGate=phaseEMaturity.gates.find(x=>x.id==='NORMATIVE_COMPLETENESS');
assert.equal(phaseEBaseline.metrics.coveragePercent,100); assert.equal(normativeGate.status,'PASS'); assert(normativeGate.evidence.includes('governance/normative-baseline.json'));
assert.equal(phaseEMaturity.gates.find(x=>x.id==='LEGAL_REVIEW').status,'PENDING');
assert.equal(phaseEMaturity.gates.find(x=>x.id==='CONSUMER_PROMOTION').status,'PENDING');
const phaseEManifest=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,'../audit/manifest-sha256.generated.json'),'utf8'));
for (const rel of ['../audit/phase-d-knowledge-consolidation.json','../docs/sprint-5/phase-d-consolidation-correction-report.json','../audit/phase-e-internal-consistency.json','../docs/sprint-5/phase-e-consistency-correction-report.json']) { const e=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,rel),'utf8')); assert.equal(e.validation.manifest.rootHash,phaseEManifest.rootHash); }
assert(new Date(phaseEManifest.generatedAt)>=new Date('2026-07-24T00:30:00.000Z'));
const nextSteps=fs.readFileSync(require('path').resolve(__dirname,'../docs/NEXT-STEPS.md'),'utf8').toLowerCase(); assert(nextSteps.includes('shadow validation')); assert(nextSteps.includes('revisão jurídica formal'));
for (const rel of ['../migration/index.json','../contracts/index.json','../engines/index.json','../engines/projection-runtime/index.json','../schemas/index.json','../knowledge/index.json','../registries/index.json','../governance/index.json','../ontology/index.json','../ingestion/index.json','../validation/index.json']) { const idx=JSON.parse(fs.readFileSync(require('path').resolve(__dirname,rel),'utf8')); assert.equal(idx.packageVersion,'2.7.0-sprint5.6.7-phaseE'); assert(idx.componentVersion||idx.catalogVersion); }
assert(schemaIndex.items.some(x=>x.id==='semantic-policy' && x.path==='./semantic-policy.schema.json'));
console.log(JSON.stringify({ok:true,tests:124},null,2));
