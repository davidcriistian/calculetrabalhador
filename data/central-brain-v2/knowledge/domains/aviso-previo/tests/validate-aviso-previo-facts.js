'use strict';
const assert=require('assert'); const fs=require('fs'); const path=require('path');
const base=path.resolve(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(base,'facts/index.json'),'utf8'));
assert.equal(catalog.status,'FACTS_IN_REVIEW'); assert.equal(catalog.items.length,39);
const ids=new Set(), keys=new Set(), records=[];
for(const item of catalog.items){ assert(!ids.has(item.factId)); ids.add(item.factId); const rec=JSON.parse(fs.readFileSync(path.join(base,'facts',item.path),'utf8')); records.push(rec); assert.equal(rec.id,item.factId); assert(!keys.has(rec.key)); keys.add(rec.key); assert(/^sha256:[a-f0-9]{64}$/.test(rec.contentFingerprint)); }
const ruleDir=path.join(base,'rules'); const req=new Set();
for(const name of fs.readdirSync(ruleDir).filter(x=>/^RULE-AP-.*\.json$/.test(x))){ const r=JSON.parse(fs.readFileSync(path.join(ruleDir,name),'utf8')); for(const v of r.versions) for(const f of (v.factsRequired||[])) req.add(f); }
for(const f of req) assert(ids.has(f),`undefined rule fact ${f}`);
for(const rec of records) for(const d of (rec.relationships.dependsOnFactIds||[])) assert(ids.has(d),`undefined dependency ${d}`);
assert(records.some(x=>x.key==='legal_reference_date' && x.temporalSemantics.referenceRole==='legal-reference'));
assert(records.some(x=>x.key==='new_employment_proven' && x.evidencePolicy.humanVerificationRequired===true));
assert(records.some(x=>x.key==='notice_duration_days' && x.constraints.maximum===90));
console.log(JSON.stringify({ok:true,facts:records.length,ruleFacts:[...req].length},null,2));
