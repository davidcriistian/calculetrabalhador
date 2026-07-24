'use strict';
const fs=require('fs');
const path=require('path');

function typeOk(value,type){
  if(type==='null')return value===null;
  if(type==='array')return Array.isArray(value);
  if(type==='object')return value!==null&&typeof value==='object'&&!Array.isArray(value);
  if(type==='integer')return Number.isInteger(value);
  if(type==='number')return typeof value==='number'&&Number.isFinite(value);
  return typeof value===type;
}
function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(`${s}T00:00:00.000Z`);return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===s;}
function validDateTime(s){return typeof s==='string'&&!Number.isNaN(Date.parse(s))&&/T/.test(s);}
function resolveRef(ref,schema,baseDir){
  if(ref.startsWith('#/')){let cur=schema;for(const p of ref.slice(2).split('/'))cur=cur[p.replace(/~1/g,'/').replace(/~0/g,'~')];return {schema:cur,root:schema,baseDir};}
  const [file,frag]=ref.split('#');const loaded=JSON.parse(fs.readFileSync(path.resolve(baseDir,file),'utf8'));let cur=loaded;
  if(frag&&frag.startsWith('/'))for(const p of frag.slice(1).split('/'))cur=cur[p.replace(/~1/g,'/').replace(/~0/g,'~')];
  return {schema:cur,root:loaded,baseDir:path.dirname(path.resolve(baseDir,file))};
}
function validate(value,schema,opts={},loc='$',errors=[],root=schema,baseDir=opts.baseDir||process.cwd()){
  if(schema.$ref){const r=resolveRef(schema.$ref,root,baseDir);return validate(value,r.schema,opts,loc,errors,r.root,r.baseDir);}
  if(schema.oneOf){const matches=schema.oneOf.filter(s=>validate(value,s,opts,loc,[],root,baseDir).valid).length;if(matches!==1)errors.push(`${loc}: deve corresponder a exatamente um schema de oneOf`);return {valid:!errors.length,errors};}
  if(schema.enum&&!schema.enum.some(x=>JSON.stringify(x)===JSON.stringify(value)))errors.push(`${loc}: valor fora do enum`);
  if(schema.type){const types=Array.isArray(schema.type)?schema.type:[schema.type];if(!types.some(t=>typeOk(value,t))){errors.push(`${loc}: tipo inválido; esperado ${types.join('|')}`);return {valid:false,errors};}}
  if(typeof value==='string'){
    if(schema.minLength!==undefined&&value.length<schema.minLength)errors.push(`${loc}: tamanho mínimo ${schema.minLength}`);
    if(schema.pattern&&!new RegExp(schema.pattern).test(value))errors.push(`${loc}: não corresponde ao padrão ${schema.pattern}`);
    if(schema.format==='date'&&!validDate(value))errors.push(`${loc}: data inválida`);
    if(schema.format==='date-time'&&!validDateTime(value))errors.push(`${loc}: date-time inválido`);
  }
  if(Array.isArray(value)){
    if(schema.uniqueItems){const set=new Set(value.map(x=>JSON.stringify(x)));if(set.size!==value.length)errors.push(`${loc}: itens duplicados`);}
    if(schema.items)value.forEach((x,i)=>validate(x,schema.items,opts,`${loc}[${i}]`,errors,root,baseDir));
  }
  if(value!==null&&typeof value==='object'&&!Array.isArray(value)){
    for(const k of schema.required||[])if(!Object.prototype.hasOwnProperty.call(value,k))errors.push(`${loc}.${k}: campo obrigatório ausente`);
    const props=schema.properties||{};const patterns=Object.entries(schema.patternProperties||{});
    for(const [k,v] of Object.entries(value)){
      if(props[k])validate(v,props[k],opts,`${loc}.${k}`,errors,root,baseDir);
      else {const hit=patterns.find(([p])=>new RegExp(p).test(k));if(hit)validate(v,hit[1],opts,`${loc}.${k}`,errors,root,baseDir);else if(schema.additionalProperties===false)errors.push(`${loc}.${k}: propriedade adicional não permitida`);else if(schema.additionalProperties&&typeof schema.additionalProperties==='object')validate(v,schema.additionalProperties,opts,`${loc}.${k}`,errors,root,baseDir);}
    }
  }
  return {valid:errors.length===0,errors};
}
function validateFile(value,schemaPath){const schema=JSON.parse(fs.readFileSync(schemaPath,'utf8'));return validate(value,schema,{baseDir:path.dirname(schemaPath)});}
module.exports={validate,validateFile};
