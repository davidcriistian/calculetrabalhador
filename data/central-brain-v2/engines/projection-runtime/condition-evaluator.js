'use strict';
function evaluateCondition(c, facts){
  const exists=Object.prototype.hasOwnProperty.call(facts,c.factId); const actual=facts[c.factId];
  if(!exists) return {known:false,matched:false,actual:undefined};
  let matched=false;
  switch(c.operator){
    case 'exists': matched=actual!==null&&actual!==undefined; break;
    case 'equals': matched=actual===c.value; break;
    case 'not-equals': matched=actual!==c.value; break;
    case 'on-or-after': matched=typeof actual==='string'&&actual>=c.value; break;
    case 'on-or-before': matched=typeof actual==='string'&&actual<=c.value; break;
    case 'in': { const values=Array.isArray(c.values)?c.values:c.value; matched=Array.isArray(values)&&values.includes(actual); break; }
    case 'not-in': { const values=Array.isArray(c.values)?c.values:c.value; matched=Array.isArray(values)&&!values.includes(actual); break; }
    default: throw new Error(`Operador não suportado: ${c.operator}`);
  }
  return {known:true,matched,actual};
}
function evaluateGroup(group,facts){
  const results=(group.conditions||[]).map(c=>({condition:c,result:evaluateCondition(c,facts)}));
  const unknown=results.filter(x=>!x.result.known);
  if(group.logic==='all'){
    if(results.some(x=>x.result.known&&!x.result.matched))return {status:'not-matched',results,missingFacts:[]};
    if(unknown.length)return {status:'unknown',results,missingFacts:[...new Set(unknown.map(x=>x.condition.factId))]};
    return {status:'matched',results,missingFacts:[]};
  }
  if(group.logic==='any'){
    if(results.some(x=>x.result.known&&x.result.matched))return {status:'matched',results,missingFacts:[]};
    if(unknown.length)return {status:'unknown',results,missingFacts:[...new Set(unknown.map(x=>x.condition.factId))]};
    return {status:'not-matched',results,missingFacts:[]};
  }
  throw new Error(`Lógica de grupo não suportada: ${group.logic}`);
}
module.exports={evaluateCondition,evaluateGroup};
