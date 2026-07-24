'use strict';
const { sha256 } = require('./canonical');
const { validateSemantics } = require('./semantic-validator');

const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
function isDate(v){ if(typeof v!=='string'||!DATE_RE.test(v)) return false; const d=new Date(v+'T00:00:00Z'); return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===v; }
function assertionRank(a){ return (a.status==='verified'?100:0)+(a.origin==='official-record'?40:a.origin==='system-observed'?30:a.origin==='document-extracted'?20:a.origin==='derived'?10:0)+(a.confidence||0); }
function normalizePackage(pkg){
  const material={...pkg}; delete material.inputFingerprint;
  return {...pkg,inputFingerprint:sha256(material)};
}
function resolveAssertions(pkg){
  const grouped={}; for(const a of pkg.facts||[]) (grouped[a.factId]??=[]).push(a);
  const values={}, assertions={}, conflicts=[];
  for(const [factId, items] of Object.entries(grouped)){
    const live=items.filter(x=>!['superseded'].includes(x.status));
    const unique=[...new Set(live.map(x=>JSON.stringify(x.value)))];
    if(unique.length>1){
      if(pkg.conflictPolicy==='prefer-verified'){
        const sorted=[...live].sort((a,b)=>assertionRank(b)-assertionRank(a));
        if(sorted.length>1 && assertionRank(sorted[0])===assertionRank(sorted[1])) conflicts.push({factId,assertionIds:[],reason:'Afirmações conflitantes com mesma precedência.'});
        else { values[factId]=sorted[0].value; assertions[factId]=sorted[0]; }
      } else conflicts.push({factId,assertionIds:[],reason:'Afirmações ativas possuem valores incompatíveis.'});
    } else if(live.length){ values[factId]=live[0].value; assertions[factId]=live[0]; }
  }
  return {values, assertions, conflicts};
}
function validateFactValue(def,value){
  const t=def.valueType||def.type||def.dataType;
  if(t==='date'&&!isDate(value)) return 'Data inválida; esperado YYYY-MM-DD.';
  if((t==='boolean')&&typeof value!=='boolean') return 'Esperado booleano.';
  if(['integer','duration-days'].includes(t)&&(!Number.isInteger(value))) return 'Esperado inteiro.';
  if(t==='string'&&typeof value!=='string') return 'Esperado texto.';
  const allowed=def.allowedValues||def.validation?.allowedValues||def.valueConstraints?.enum;
  if(Array.isArray(allowed)&&!allowed.includes(value)) return `Valor fora do domínio permitido: ${allowed.join(', ')}.`;
  return null;
}
function completedYears(admission,reference){
  if(!isDate(admission)||!isDate(reference))return null;
  const [ay,am,ad]=admission.split('-').map(Number),[ry,rm,rd]=reference.split('-').map(Number);
  return Math.max(0,ry-ay-((rm<am||(rm===am&&rd<ad))?1:0));
}
function validateFactPackage(pkg,snapshot,brainRoot){
  const errors=[],warnings=[];
  if(!pkg||typeof pkg!=='object') return {valid:false,errors:[{code:'PACKAGE_TYPE',message:'Pacote inválido.',details:{}}],warnings:[],values:{},assertions:{},conflicts:[]};
  for(const key of ['packageId','domainId','caseId','referenceDate','createdAt','facts','conflictPolicy']) if(pkg[key]===undefined) errors.push({code:'PACKAGE_REQUIRED',message:`Campo obrigatório ausente: ${key}.`,details:{key}});
  if(pkg.domainId!==snapshot.domainId) errors.push({code:'DOMAIN_MISMATCH',message:'Domínio do pacote não corresponde ao snapshot.',details:{}});
  if(!isDate(pkg.referenceDate)) errors.push({code:'REFERENCE_DATE_INVALID',message:'referenceDate inválida.',details:{}});
  if(!Array.isArray(pkg.facts)) errors.push({code:'FACTS_INVALID',message:'facts deve ser array.',details:{}});
  const {values,assertions,conflicts}=resolveAssertions(pkg);
  for(const [factId,value] of Object.entries(values)){
    const def=snapshot.facts[factId];
    if(!def){ warnings.push({code:'UNKNOWN_FACT',message:`Fato não catalogado: ${factId}.`,details:{factId}}); continue; }
    const msg=validateFactValue(def,value); if(msg) errors.push({code:'FACT_VALUE_INVALID',message:`${factId}: ${msg}`,details:{factId,value}});
  }
  if(values['FACT-LEGAL-REFERENCE-DATE']===undefined) values['FACT-LEGAL-REFERENCE-DATE']=pkg.referenceDate;
  else if(values['FACT-LEGAL-REFERENCE-DATE']!==pkg.referenceDate) errors.push({code:'SEM-AP-018',message:'A data jurídica do pacote contradiz FACT-LEGAL-REFERENCE-DATE.',details:{packageReferenceDate:pkg.referenceDate,factReferenceDate:values['FACT-LEGAL-REFERENCE-DATE']}});
  const expectedYears=completedYears(values['FACT-ADMISSION-DATE'],values['FACT-LEGAL-REFERENCE-DATE']);
  if(expectedYears!==null){
    if(values['FACT-COMPLETE-SERVICE-YEARS']===undefined) values['FACT-COMPLETE-SERVICE-YEARS']=expectedYears;
    else if(values['FACT-COMPLETE-SERVICE-YEARS']!==expectedYears) errors.push({code:'SEM-AP-019',message:'Os anos completos de serviço contradizem as datas canônicas.',details:{declared:values['FACT-COMPLETE-SERVICE-YEARS'],expected:expectedYears}});
  }
  const sem=validateSemantics(values,assertions,brainRoot,pkg); errors.push(...sem.errors); warnings.push(...sem.warnings);
  return {valid:errors.length===0&&conflicts.length===0&&sem.reviews.length===0,errors,warnings,reviews:sem.reviews,values,assertions,conflicts};
}
module.exports={normalizePackage,validateFactPackage,isDate,completedYears};
