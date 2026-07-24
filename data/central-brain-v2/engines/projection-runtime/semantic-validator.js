'use strict';
const fs=require('fs'); const path=require('path');
function dateCmp(a,b,op){if(typeof a!=='string'||typeof b!=='string')return true; if(op==='on-or-before')return a<=b; if(op==='on-or-after')return a>=b; return true;}
function expectedModality(v){
  const worked=v['FACT-NOTICE-WORKED'],paid=v['FACT-PAYMENT-SUBSTITUTION'],granted=v['FACT-NOTICE-GRANTED'],party=v['FACT-NOTIFYING-PARTY'];
  if(worked===true&&paid===true)return 'mixed'; if(worked===true)return 'worked'; if(paid===true)return 'indemnified'; if(granted===false&&party==='empregado')return 'employee_notice_unworked'; if(granted===false&&party==='empregador')return 'indemnified'; return null;
}
function validateSemantics(values,assertions,brainRoot){
  const policy=JSON.parse(fs.readFileSync(path.join(brainRoot,'governance/semantic-policy.json'),'utf8'));
  const errors=[],warnings=[],reviews=[];
  const emit=(r,details={})=>{const x={code:r.id,message:r.message,details}; if(r.severity==='error')errors.push(x); else if(r.severity==='review')reviews.push(x); else warnings.push(x);};
  for(const r of policy.rules){
    if(r.whenFactId && values[r.whenFactId]!==r.whenValue)continue;
    switch(r.kind){
      case 'date-order': if(values[r.leftFactId]!==undefined&&values[r.rightFactId]!==undefined&&!dateCmp(values[r.leftFactId],values[r.rightFactId],r.operator))emit(r,{facts:[r.leftFactId,r.rightFactId]}); break;
      case 'mapping': if(values[r.sourceFactId]!==undefined&&values[r.targetFactId]!==undefined&&Object.prototype.hasOwnProperty.call(r.map,values[r.sourceFactId])&&r.map[values[r.sourceFactId]]!==values[r.targetFactId])emit(r,{facts:[r.sourceFactId,r.targetFactId],expected:r.map[values[r.sourceFactId]]}); break;
      case 'derived-origin': for(const id of r.factIds||[]){const a=assertions[id]; if(a&&!r.allowedOrigins.includes(a.origin))emit(r,{factId:id,origin:a.origin});} break;
      case 'modality-consistency': {const e=expectedModality(values),d=values['FACT-NOTICE-MODALITY']; if(e&&d!==undefined&&d!==e)emit(r,{declared:d,derived:e}); break;}
      case 'implication': if(values[r.ifFactId]===r.ifValue&&values[r.thenFactId]!==r.thenValue)emit(r,{facts:[r.ifFactId,r.thenFactId]}); break;
      case 'required-if': if(values[r.ifFactId]===r.ifValue)for(const id of r.requiredFactIds||[])if(values[id]===undefined||values[id]===null)emit(r,{missingFactId:id}); break;
      case 'human-review-if': if(values[r.factId]===r.value)emit(r,{factId:r.factId}); break;
    }
  }
  return {errors,warnings,reviews};
}
module.exports={validateSemantics,expectedModality};
