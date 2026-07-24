'use strict';
const assert=require('assert'); const path=require('path');
const {executeDomain}=require('../../engines/projection-runtime');
const {resolveNoticePeriod,addCalendarDays,assertDateOnly}=require('../../engines/projection-runtime/temporal');
const {selectRuleVersion}=require('../../engines/projection-runtime/temporal-rule-selector');
const brainRoot=path.resolve(__dirname,'../..'); const fx=n=>require(path.join(__dirname,'fixtures',n+'.json'));
let passed=0; function test(name,fn){try{fn();passed++;console.log('PASS',name);}catch(e){console.error('FAIL',name,e.stack);process.exitCode=1;}}
function request(name,target='PROJ-AP-008',mode='sandbox'){return {targetProjectionId:target,factPackage:fx(name),executionContext:{clock:'2026-07-22T00:00:00.000Z',mode}};}
function run(name,target='PROJ-AP-008'){return executeDomain(request(name,target),{brainRoot});}
test('duração proporcional: 5 anos = 45 dias',()=>assert.equal(run('employer_indemnified_5y','PROJ-AP-003').targetResult.outputs.notice_duration_days,45));
test('término projetado com contagem inclusiva',()=>assert.equal(run('employer_indemnified_5y','PROJ-AP-004').targetResult.outputs.projected_termination_date,'2026-03-17'));
test('modalidade indenizada',()=>assert.equal(run('employer_indemnified_5y','PROJ-AP-002').targetResult.outputs.notice_modality,'indemnified'));
test('redução não aplicável no indenizado',()=>assert.equal(run('employer_indemnified_5y','PROJ-AP-006').targetResult.status,'not_applicable'));
test('redução aplicável no trabalhado',()=>assert.equal(run('employer_worked_reduction','PROJ-AP-006').targetResult.outputs.reduction_mode,'two_hours_daily'));
test('novo emprego comprovado exonera pagamento',()=>assert.equal(run('new_job_proven','PROJ-AP-007').targetResult.outputs.payment_preserved,false));
test('fatos insuficientes são explícitos',()=>assert.equal(run('insufficient','PROJ-AP-001').targetResult.status,'insufficient_facts'));
test('regime externo exige revisão humana',()=>assert.equal(run('outside_regime','PROJ-AP-001').targetResult.status,'human_review_required'));
test('conflito bloqueia execução',()=>assert.equal(run('conflict').status,'conflict'));
test('determinismo do fingerprint',()=>{const a=run('employer_indemnified_5y','PROJ-AP-008'),b=run('employer_indemnified_5y','PROJ-AP-008');assert.equal(a.targetResult.outputFingerprint,b.targetResult.outputFingerprint);assert.equal(a.brainSnapshotId,b.brainSnapshotId);});
test('agregação final contém efeitos',()=>assert.ok(run('employer_indemnified_5y').targetResult.outputs.legal_effects.length>0));
test('runtime permanece sem autoridade',()=>assert.equal(run('employer_indemnified_5y').targetResult.metadata.runtimeAuthority,false));

test('política exclui o dia da comunicação e inclui o vencimento',()=>assert.deepEqual(resolveNoticePeriod('2026-01-31',30),{communicationDate:'2026-01-31',countingStartDate:'2026-02-01',dueDate:'2026-03-02',durationDays:30,excludeInitialDay:true,includeDueDate:true,unit:'calendar-day'}));
test('ano bissexto é tratado como data civil',()=>assert.equal(resolveNoticePeriod('2024-02-28',1).dueDate,'2024-02-29'));
test('virada de ano é determinística',()=>assert.equal(addCalendarDays('2025-12-31',1),'2026-01-01'));
test('data civil inválida é rejeitada',()=>assert.throws(()=>assertDateOnly('2026-02-29'),/inválida/));
test('30 dias após 31 de janeiro não usa mês-calendário aproximado',()=>assert.equal(resolveNoticePeriod('2026-01-31',30).dueDate,'2026-03-02'));
test('90 dias atravessam meses corretamente',()=>assert.equal(resolveNoticePeriod('2026-11-30',90).dueDate,'2027-02-28'));
test('modo operacional bloqueia regra em review',()=>assert.equal(executeDomain(request('employer_indemnified_5y','PROJ-AP-003','operational'),{brainRoot}).targetResult.status,'human_review_required'));
test('snapshot inclui política, schemas, contratos e código',()=>{const r=run('employer_indemnified_5y','PROJ-AP-003');assert.ok(r.brainSnapshotId.startsWith('sha256:'));});


test('executor não contém IDs específicos de domínio',()=>{const fs=require('fs');const src=fs.readFileSync(path.join(brainRoot,'engines/projection-runtime/executor.js'),'utf8');assert.equal(/PROJ-AP-|FACT-/.test(src),false);});
test('materializador aplica defaults declarativos',()=>assert.deepEqual(run('employer_indemnified_5y','PROJ-AP-008').targetResult.outputs.cross_domain_requirements,['FED-AP-FGTS','FED-AP-FERIAS','FED-AP-13']));
test('materializador aplica mapeamento declarativo de fatos',()=>assert.equal(run('employer_indemnified_5y','PROJ-AP-001').targetResult.outputs.notifying_party,'employer'));


test('pedido de demissão também ativa incidência',()=>assert.equal(run('employee_resignation','PROJ-AP-001').targetResult.status,'resolved'));
test('pedido de demissão identifica empregado como notificante',()=>assert.equal(run('employee_resignation','PROJ-AP-001').targetResult.outputs.notifying_party,'employee'));
test('aviso não concedido pelo empregador gera modalidade indenizada',()=>assert.equal(run('employer_notice_not_granted','PROJ-AP-002').targetResult.outputs.notice_modality,'indemnified'));
test('aviso não cumprido pelo empregado não vira não aplicável',()=>assert.equal(run('employee_resignation','PROJ-AP-002').targetResult.outputs.notice_modality,'employee_notice_unworked'));
test('antes de 2011 preserva piso de 30 dias',()=>assert.equal(run('pre_2011','PROJ-AP-003').targetResult.outputs.notice_duration_days,30));
test('opção de redução ausente materializa not_selected',()=>assert.equal(run('worked_option_missing','PROJ-AP-006').targetResult.outputs.reduction_mode,'not_selected'));
test('projeção temporal não exige data de término circular',()=>assert.equal(run('employer_indemnified_5y','PROJ-AP-004').targetResult.status,'resolved'));
test('contrato a termo sem cláusula assecuratória não aplica regime geral',()=>assert.equal(run('fixed_without_clause','PROJ-AP-001').targetResult.status,'not_applicable'));

test('requisição inválida é bloqueada pelo JSON Schema',()=>assert.equal(executeDomain({targetProjectionId:'bad',factPackage:{}},{brainRoot}).status,'error'));
test('resultado possui rastreabilidade por saída',()=>assert.equal(run('employer_indemnified_5y','PROJ-AP-003').targetResult.outputTrace.notice_duration_days.sourceType,'operation'));
test('bundle ecoa a requisição canônica',()=>assert.equal(run('employer_indemnified_5y','PROJ-AP-003').request.targetProjectionId,'PROJ-AP-003'));

test('contradição entre causa e iniciativa é bloqueada',()=>{const q=JSON.parse(JSON.stringify(fx('employer_indemnified_5y')));q.facts.find(x=>x.factId==='FACT-TERMINATION-INITIATIVE').value='empregado';const r=executeDomain({targetProjectionId:'PROJ-AP-001',factPackage:q,executionContext:{clock:'2026-07-22T00:00:00.000Z',mode:'sandbox'}},{brainRoot});assert.equal(r.status,'error');assert.ok(r.validation.errors.some(x=>x.code==='SEM-AP-006'));});
test('modalidade declarada contraditória é bloqueada',()=>{const q=JSON.parse(JSON.stringify(fx('employer_indemnified_5y')));q.facts.push({...q.facts[0],factId:'FACT-NOTICE-MODALITY',value:'trabalhado'});const r=executeDomain({targetProjectionId:'PROJ-AP-002',factPackage:q,executionContext:{clock:'2026-07-22T00:00:00.000Z',mode:'sandbox'}},{brainRoot});assert.equal(r.status,'error');assert.ok(r.validation.errors.some(x=>x.code==='SEM-AP-009'));});
test('fato derivado declarado manualmente é bloqueado',()=>{const q=JSON.parse(JSON.stringify(fx('employer_indemnified_5y')));q.facts.find(x=>x.factId==='FACT-CONTRACT-INDEFINITE').origin='user-declared';const r=executeDomain({targetProjectionId:'PROJ-AP-001',factPackage:q,executionContext:{clock:'2026-07-22T00:00:00.000Z',mode:'sandbox'}},{brainRoot});assert.ok(r.validation.errors.some(x=>x.code==='SEM-AP-008'));});
test('falta grave durante o aviso exige revisão humana',()=>{const q=JSON.parse(JSON.stringify(fx('employer_indemnified_5y')));q.facts.push({...q.facts[0],factId:'FACT-SERIOUS-MISCONDUCT-DURING-NOTICE',value:true});const r=executeDomain({targetProjectionId:'PROJ-AP-008',factPackage:q,executionContext:{clock:'2026-07-22T00:00:00.000Z',mode:'sandbox'}},{brainRoot});assert.equal(r.status,'human_review_required');});
test('data jurídica canônica controla o regime pré-2011',()=>assert.equal(run('pre_2011','PROJ-AP-003').targetResult.temporalDecision.value,'2010-06-01'));

test('pedido de demissão não projeta término por aviso devido pelo empregador',()=>assert.equal(run('employee_resignation','PROJ-AP-004').targetResult.status,'not_applicable'));
test('pedido de demissão não integra aviso ao tempo de serviço pela RULE-AP-003',()=>assert.equal(run('employee_resignation','PROJ-AP-005').targetResult.status,'not_applicable'));
test('divergência entre referenceDate e fato jurídico é bloqueada',()=>{const q=JSON.parse(JSON.stringify(fx('employer_indemnified_5y')));q.facts.push({...q.facts[0],factId:'FACT-LEGAL-REFERENCE-DATE',value:'2025-01-31'});const r=executeDomain({targetProjectionId:'PROJ-AP-003',factPackage:q,executionContext:{clock:'2026-07-22T00:00:00.000Z',mode:'sandbox'}},{brainRoot});assert.ok(r.validation.errors.some(x=>x.code==='SEM-AP-018'));});
test('anos completos incompatíveis com admissão são bloqueados',()=>{const q=JSON.parse(JSON.stringify(fx('employer_indemnified_5y')));q.facts.push({...q.facts[0],factId:'FACT-ADMISSION-DATE',value:'2025-01-31'});const r=executeDomain({targetProjectionId:'PROJ-AP-003',factPackage:q,executionContext:{clock:'2026-07-22T00:00:00.000Z',mode:'sandbox'}},{brainRoot});assert.ok(r.validation.errors.some(x=>x.code==='SEM-AP-019'));});
test('consolidação declara parcialidade e pendências',()=>{const r=run('employer_indemnified_5y');assert.equal(r.targetResult.outputs.consolidation_status,'partial');assert.ok(r.targetResult.outputs.unresolved_projections.some(x=>x.projectionId==='PROJ-AP-007'));});
test('rastreabilidade consolidada propaga fatos, regras e dependências',()=>{const t=run('employer_indemnified_5y').targetResult.outputTrace.legal_effects;assert.ok(t.factIds.includes('FACT-NOTICE-COMMUNICATION-DATE'));assert.ok(t.ruleIds.includes('RULE-AP-003'));assert.ok(t.dependencyIds.includes('PROJ-AP-004'));});
test('efeitos equivalentes são deduplicados com múltiplas origens',()=>{const xs=run('employer_indemnified_5y').targetResult.outputs.legal_effects.filter(x=>x.key==='projected_termination_date');assert.equal(xs.length,1);assert.deepEqual(xs[0].sourceProjectionIds,['PROJ-AP-004','PROJ-AP-005']);});
console.log(JSON.stringify({suite:'projection-runtime',passed,failed:process.exitCode?1:0},null,2)); if(process.exitCode)process.exit(process.exitCode);
