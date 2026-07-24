'use strict';
const fs=require('fs'); const path=require('path'); const {sha256,deepFreeze}=require('./canonical');
function readJson(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
function listJson(dir){return fs.existsSync(dir)?fs.readdirSync(dir).filter(x=>x.endsWith('.json')).sort().map(x=>path.join(dir,x)):[];}
function hashTree(dir,filter=()=>true){const out={}; if(!fs.existsSync(dir))return out; const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const f=path.join(d,e.name);if(e.isDirectory())walk(f);else if(filter(f))out[path.relative(dir,f).replaceAll('\\','/')]=sha256(fs.readFileSync(f));}};walk(dir);return out;}
function loadSnapshot(brainRoot,domainId='aviso-previo'){
  const projectionDir=path.join(brainRoot,'knowledge','projections','domains',domainId,'records');
  const ruleDir=path.join(brainRoot,'knowledge','domains',domainId,'rules');
  const factDir=path.join(brainRoot,'knowledge','domains',domainId,'facts','records');
  const projections=Object.fromEntries(listJson(projectionDir).map(f=>{const v=readJson(f);return[v.id,v]}));
  const rules=Object.fromEntries(listJson(ruleDir).filter(f=>path.basename(f).startsWith('RULE-')).map(f=>{const v=readJson(f);return[v.id,v]}));
  const facts=Object.fromEntries(listJson(factDir).map(f=>{const v=readJson(f);return[v.id,v]}));
  const graph=readJson(path.join(brainRoot,'knowledge','projections','domains',domainId,'traceability','dependency-graph.json'));
  const manifest=readJson(path.join(brainRoot,'knowledge','domains',domainId,'manifest.json'));
  const temporalPolicy=readJson(path.join(brainRoot,'governance','temporal-policy.json'));
  const implementationHashes=hashTree(path.join(brainRoot,'engines','projection-runtime'),f=>f.endsWith('.js'));
  const schemaHashes=hashTree(path.join(brainRoot,'schemas'),f=>f.endsWith('.json'));
  const contractHashes=hashTree(path.join(brainRoot,'contracts'),f=>f.endsWith('.json'));
  const governanceHashes=hashTree(path.join(brainRoot,'governance'),f=>f.endsWith('.json'));
  const snapshotMaterial={domainId,projections,rules,facts,graph,manifest,temporalPolicy,implementationHashes,schemaHashes,contractHashes,governanceHashes};
  return deepFreeze({...snapshotMaterial,snapshotId:sha256(snapshotMaterial)});
}
module.exports={loadSnapshot};
