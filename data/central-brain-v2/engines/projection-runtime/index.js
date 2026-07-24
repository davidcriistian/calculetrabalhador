'use strict';
const path=require('path');
const {loadSnapshot}=require('./snapshot-loader');
const {normalizePackage,validateFactPackage}=require('./fact-validator');
const {executeProjection}=require('./executor');
const {sha256}=require('./canonical');
const {validateFile}=require('./schema-validator');
const ENGINE_VERSION='1.4.0';

function executeDomain(request,{brainRoot}={}){
  if(!brainRoot)throw new Error('brainRoot é configuração obrigatória do host.');
  const requestSchema=path.join(brainRoot,'schemas/projection-execution-request.schema.json');
  const requestCheck=validateFile(request,requestSchema);
  if(!requestCheck.valid)return {request,status:'error',brainSnapshotId:null,engineVersion:ENGINE_VERSION,inputFingerprint:null,validation:{valid:false,errors:requestCheck.errors,conflicts:[]},results:{},targetResult:null};
  const {targetProjectionId,factPackage,executionContext}=request;
  const snapshot=loadSnapshot(brainRoot,factPackage.domainId);
  const pkg=normalizePackage(factPackage);
  const validation=validateFactPackage(pkg,snapshot,brainRoot);
  const caseToken=sha256({caseId:pkg.caseId,inputFingerprint:pkg.inputFingerprint}).slice(7,19).toUpperCase();
  if(!validation.valid){
    const bundle={request,status:validation.conflicts.length?'conflict':validation.reviews?.length?'human_review_required':'error',brainSnapshotId:snapshot.snapshotId,engineVersion:ENGINE_VERSION,inputFingerprint:pkg.inputFingerprint,validation,results:{},targetResult:null};
    return bundle;
  }
  const results={};
  for(const pid of snapshot.graph.topologicalOrder){
    const p=snapshot.projections[pid];
    results[pid]=executeProjection(p,{snapshot,pkg,facts:validation.values,dependencies:results,engineVersion:ENGINE_VERSION,now:executionContext.clock,caseToken,executionMode:executionContext.mode,brainRoot});
    if(pid===targetProjectionId)break;
  }
  const bundle={request,status:results[targetProjectionId]?.status||'error',brainSnapshotId:snapshot.snapshotId,engineVersion:ENGINE_VERSION,inputFingerprint:pkg.inputFingerprint,validation,results,targetResult:results[targetProjectionId]||null};
  const bundleCheck=validateFile(bundle,path.join(brainRoot,'schemas/projection-execution-bundle.schema.json'));
  if(!bundleCheck.valid)throw new Error(`Bundle inválido: ${bundleCheck.errors.join('; ')}`);
  return bundle;
}
module.exports={executeDomain,ENGINE_VERSION};
if(require.main===module){
  const [brainRoot,input]=process.argv.slice(2);
  if(!brainRoot||!input){console.error('Uso: node index.js <brainRoot> <projection-execution-request.json>');process.exit(2);}
  const request=require(path.resolve(input));console.log(JSON.stringify(executeDomain(request,{brainRoot:path.resolve(brainRoot)}),null,2));
}
