'use strict';
const {dateInValidRange,instantInTransactionRange}=require('./temporal');
function policyFor(mode='sandbox'){return mode==='operational'?{allowed:new Set(['approved']),approvalRequired:true}:{allowed:new Set(['approved','review']),approvalRequired:false};}
function approved(version){return Boolean(version.approval&&version.approval.approvedAt&&version.approval.approvedBy);}
function selectRuleVersion(rule,referenceDate,asKnownAt=null,{mode='sandbox'}={}){
  const gate=policyFor(mode);
  const temporal=(rule.versions||[]).filter(v=>dateInValidRange(referenceDate,v.validFrom,v.validTo)&&instantInTransactionRange(asKnownAt,v.recordedAt,v.recordedUntil));
  const eligible=temporal.filter(v=>gate.allowed.has(v.status)&&(!gate.approvalRequired||approved(v)));
  eligible.sort((a,b)=>(b.validFrom||'').localeCompare(a.validFrom||'')||(b.recordedAt||'').localeCompare(a.recordedAt||'')||(b.versionId||'').localeCompare(a.versionId||''));
  if(eligible.length>1){const a=eligible[0],b=eligible[1]; if((a.validFrom||'')===(b.validFrom||'')&&(a.recordedAt||'')===(b.recordedAt||'')) return {version:null,reason:'ambiguous',candidates:eligible.map(x=>x.versionId)};}
  return {version:eligible[0]||null,reason:eligible.length?'selected':(temporal.length?'governance-blocked':'no-temporal-match'),candidates:eligible.map(x=>x.versionId),temporallyMatching:temporal.map(x=>({versionId:x.versionId,status:x.status,approved:approved(x)}))};
}
function selectRules(projection,snapshot,referenceDate,asKnownAt,options={}){
  return projection.ruleRefs.map(ref=>{
    const rule=snapshot.rules[ref.ruleId];
    if(!rule)return {id:ref.ruleId,decision:'unavailable',reason:'Regra não encontrada.',versionId:null,details:{selectionReason:'missing-rule'}};
    const result=selectRuleVersion(rule,referenceDate,asKnownAt,options),v=result.version;
    if(!v)return {id:ref.ruleId,decision:'unavailable',reason:result.reason==='governance-blocked'?'Versão temporal existe, mas não está autorizada para este modo de execução.':result.reason==='ambiguous'?'Seleção temporal ambígua.':'Nenhuma versão vigente na data jurídica de referência.',versionId:null,details:result};
    return {id:ref.ruleId,decision:'selected',reason:v.status==='approved'?'Versão aprovada e vigente.':'Versão em revisão permitida somente no sandbox.',versionId:v.versionId,details:{sourceIds:v.sourceIds||[],status:v.status,approved:approved(v),selectionReason:result.reason,referenceDate,asKnownAt}};
  });
}
module.exports={selectRuleVersion,selectRules};
