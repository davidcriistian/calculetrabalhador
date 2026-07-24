'use strict';
const fs=require('fs'); const path=require('path'); const assert=require('assert');
const root=path.resolve(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'rules/index.json'),'utf8'));
const sources=JSON.parse(fs.readFileSync(path.resolve(root,'../../../registries/sources.json'),'utf8')).items;
const concepts=JSON.parse(fs.readFileSync(path.join(root,'concepts/index.json'),'utf8')).items;
const sourceIds=new Set(sources.map(x=>x.id)); const conceptIds=new Set(concepts.map(x=>x.conceptId));
assert.equal(catalog.items.length,15); const ruleIds=new Set(catalog.items.map(x=>x.ruleId)); assert.equal(ruleIds.size,15);
let testCount=0;
for(const item of catalog.items){
 const rule=JSON.parse(fs.readFileSync(path.join(root,'rules',path.basename(item.path)),'utf8'));
 assert.equal(rule.id,item.ruleId); assert.equal(rule.domainId,'aviso-previo'); assert.equal(rule.status,'review'); assert(rule.description.length>=40);
 assert(rule.versions.length>=1); const v=rule.versions[0]; assert(v.normativeStatement.length>=40); assert(v.testCases.length>=2); testCount+=v.testCases.length;
 for(const sid of v.sourceIds) assert(sourceIds.has(sid),`broken source ${sid}`);
 for(const cid of v.conceptIds) assert(conceptIds.has(cid),`broken concept ${cid}`);
 for(const dep of rule.dependencies) assert(ruleIds.has(dep),`broken rule dependency ${dep}`);
 assert.equal(v.parameters && Object.keys(v.parameters).length,0); assert(!('formula' in v),`formula forbidden in ${rule.id}`);
}
assert(testCount>=13); console.log(JSON.stringify({ok:true,rules:catalog.items.length,testCases:testCount},null,2));
