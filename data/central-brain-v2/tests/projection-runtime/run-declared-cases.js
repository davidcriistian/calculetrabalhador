'use strict';
const assert=require('assert'); const fs=require('fs'); const path=require('path');
const {executeDomain}=require('../../engines/projection-runtime');
const brainRoot=path.resolve(__dirname,'../..');
const registry=require('./declared-cases.json');
const projDir=path.join(brainRoot,'knowledge/projections/domains/aviso-previo/records');
const declared=[]; for(const f of fs.readdirSync(projDir).filter(x=>/^PROJ-AP-\d+\.json$/.test(x))){const p=require(path.join(projDir,f)); for(const id of p.testCaseIds||[])declared.push({id,projectionId:p.id});}
assert.equal(new Set(registry.cases.map(x=>x.id)).size,registry.cases.length,'IDs de caso duplicados');
assert.deepEqual([...registry.cases.map(x=>x.id)].sort(),[...declared.map(x=>x.id)].sort(),'Registro não cobre exatamente os IDs declarados');
let passed=0; for(const c of registry.cases){const fixture=require(path.join(__dirname,'fixtures',c.fixture+'.json')); const r=executeDomain({targetProjectionId:c.projectionId,factPackage:fixture,executionContext:{clock:'2026-07-22T16:00:00.000Z',mode:'sandbox'}},{brainRoot}); assert.ok(r&&typeof r.status==='string',c.id+' sem bundle'); assert.notEqual(r.status,'error',c.id+' retornou erro: '+JSON.stringify(r.validation||{})); passed++; console.log('PASS',c.id,c.projectionId,r.targetResult?.status||r.status);}
console.log(JSON.stringify({suite:'declared-projection-cases',declared:declared.length,passed,failed:0},null,2));
