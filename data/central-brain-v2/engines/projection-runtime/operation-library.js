'use strict';
const { sha256 } = require('./canonical');
const {resolveNoticePeriod,addCalendarDays}=require('./temporal');
function addDays(start,days,policy='exclude-initial-include-due'){
  if(policy!=='exclude-initial-include-due')throw new Error(`Política temporal não autorizada: ${policy}`);
  return resolveNoticePeriod(start,days).dueDate;
}
function stableValue(value){return JSON.stringify(value,Object.keys(value&&typeof value==='object'&&!Array.isArray(value)?value:{}).sort());}
function unresolved(dependencies,ids){
  return (ids||[]).map(id=>dependencies[id]).filter(r=>!r||!['resolved','not_applicable'].includes(r.status));
}
function executeOperation(op,ctx){
  const i=op.inputs||{}; let result,temporalTrace=null;
  switch(op.operationType){
    case 'bounded-linear-duration': { const years=ctx.facts[i.completedYearsFactId]; if(!Number.isInteger(years)||years<0)throw new Error('Anos completos inválidos.'); result=Math.min(i.maximumTotalDays,i.baseDays+i.additionalDaysPerCompletedYear*years); break; }
    case 'effective-bounded-linear-duration': { const date=ctx.facts[i.referenceDateFactId]; const beneficiary=ctx.facts[i.beneficiaryFactId]===true; const proportional=beneficiary&&typeof date==='string'&&date>=i.proportionalEffectiveFrom; const years=proportional?(ctx.facts[i.completedYearsFactId]??0):0; if(!Number.isInteger(years)||years<0)throw new Error('Anos completos inválidos.'); result=Math.min(i.maximumTotalDays,i.baseDays+(proportional?i.additionalDaysPerCompletedYear*years:0)); break; }
    case 'date-add-days': { const start=ctx.facts[i.startDateFactId]; const days=i.days; if(!start||!Number.isInteger(days))throw new Error('Entradas temporais ausentes.'); result=addCalendarDays(start,days); break; }
    case 'calendar-add-days': { const start=ctx.facts[i.startDateFactId]; const [pid,key]=i.durationDependency.split('.'); const days=ctx.dependencies[pid]?.outputs?.[key]; if(!start||!Number.isInteger(days))throw new Error('Entradas temporais ausentes.'); temporalTrace=resolveNoticePeriod(start,days); result=temporalTrace.dueDate; break; }
    case 'map-value': { const worked=ctx.facts[i.workedFactId], paid=ctx.facts[i.paymentFactId], granted=ctx.facts[i.noticeGrantedFactId], party=ctx.facts[i.notifyingPartyFactId]; if(worked===true&&paid===true)result='mixed'; else if(worked===true)result='worked'; else if(paid===true)result='indemnified'; else if(granted===false&&party==='empregado')result='employee_notice_unworked'; else if(granted===false&&party==='empregador')result='indemnified'; else { const declared=ctx.facts['FACT-NOTICE-MODALITY']; if(declared)result=declared; else result='unknown'; } break; }
    case 'aggregate-effects': {
      const byKey=new Map();
      for(const pid of i.projectionIds||[]){
        const r=ctx.dependencies[pid]; if(r?.status!=='resolved')continue;
        for(const [key,value] of Object.entries(r.outputs||{})){
          const sig=stableValue(value), current=byKey.get(key);
          if(!current)byKey.set(key,{projectionId:pid,sourceProjectionIds:[pid],key,value});
          else if(current.signature===sig||stableValue(current.value)===sig){current.sourceProjectionIds.push(pid);}
          else throw new Error(`CONFLICTING_EFFECT:${key}:${current.projectionId}:${pid}`);
        }
      }
      result=[...byKey.values()].map(({signature,...x})=>x); break;
    }
    case 'consolidation-status': {
      const required=new Set(i.requiredProjectionIds||[]);
      const blocked=(i.projectionIds||[]).some(pid=>required.has(pid)&&ctx.dependencies[pid]?.status!=='resolved');
      result=blocked?'blocked':unresolved(ctx.dependencies,i.projectionIds).length?'partial':'complete'; break;
    }
    case 'unresolved-projections': {
      result=(i.projectionIds||[]).map(pid=>ctx.dependencies[pid]).filter(r=>!r||!['resolved','not_applicable'].includes(r.status)).map(r=>r?({projectionId:r.projectionId,status:r.status,missingFacts:r.missingFacts||[]}):({projectionId:null,status:'unavailable',missingFacts:[]})); break;
    }
    default: throw new Error(`Operação não autorizada: ${op.operationType}`);
  }
  return {operationId:op.id,operationType:op.operationType,inputs:i,result,temporalTrace,fingerprint:sha256({id:op.id,inputs:i,result,temporalTrace})};
}
module.exports={executeOperation,addDays,resolveNoticePeriod};
