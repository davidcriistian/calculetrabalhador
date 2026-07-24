'use strict';
const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
function assertDateOnly(value,label='date'){
  if(typeof value!=='string'||!DATE_RE.test(value)) throw new Error(`${label} deve usar YYYY-MM-DD.`);
  const [y,m,d]=value.split('-').map(Number); const dt=new Date(Date.UTC(y,m-1,d));
  if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==m-1||dt.getUTCDate()!==d) throw new Error(`${label} inválida: ${value}.`);
  return value;
}
function toEpochDay(value){assertDateOnly(value); const [y,m,d]=value.split('-').map(Number); return Math.floor(Date.UTC(y,m-1,d)/86400000);}
function fromEpochDay(day){return new Date(day*86400000).toISOString().slice(0,10);}
function addCalendarDays(value,days){assertDateOnly(value); if(!Number.isInteger(days))throw new Error('days deve ser inteiro.'); return fromEpochDay(toEpochDay(value)+days);}
function resolveNoticePeriod(communicationDate,durationDays){
  assertDateOnly(communicationDate,'communicationDate'); if(!Number.isInteger(durationDays)||durationDays<1)throw new Error('durationDays deve ser inteiro positivo.');
  return {communicationDate,countingStartDate:addCalendarDays(communicationDate,1),dueDate:addCalendarDays(communicationDate,durationDays),durationDays,excludeInitialDay:true,includeDueDate:true,unit:'calendar-day'};
}
function dateInValidRange(date,from,to){assertDateOnly(date,'referenceDate'); return (!from||date>=from)&&(!to||date<=to);}
function instantInTransactionRange(instant,from,to){
  if(!instant)return true; const t=Date.parse(instant),f=from?Date.parse(from):-Infinity,u=to?Date.parse(to):Infinity;
  if(Number.isNaN(t)||Number.isNaN(f)||Number.isNaN(u))throw new Error('Intervalo transacional inválido.'); return t>=f&&t<u;
}
function resolveLegalReferenceDate(pkg,facts){
  const candidates=[['FACT-LEGAL-REFERENCE-DATE',facts['FACT-LEGAL-REFERENCE-DATE']],['FACT-NOTICE-COMMUNICATION-DATE',facts['FACT-NOTICE-COMMUNICATION-DATE']],['package.referenceDate',pkg.referenceDate]].filter(x=>x[1]);
  if(!candidates.length)throw new Error('Nenhuma data jurídica de referência disponível.'); assertDateOnly(candidates[0][1],'legalReferenceDate'); return {source:candidates[0][0],value:candidates[0][1],discarded:candidates.slice(1).map(([source,value])=>({source,value}))};
}
module.exports={assertDateOnly,toEpochDay,fromEpochDay,addCalendarDays,resolveNoticePeriod,dateInValidRange,instantInTransactionRange,resolveLegalReferenceDate};
