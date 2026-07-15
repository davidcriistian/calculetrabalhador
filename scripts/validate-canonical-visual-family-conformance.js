const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

function run() {
  const reference = read('calculadora-aviso-previo/index.html');
  const target = read('saque-aniversario-fgts/index.html');
  const runtime = read('assets/js/saque-aniversario-fgts.js');
  const checks = [];
  const check = (id, condition, evidence) => checks.push({id,status:condition?'PASS':'FAIL',evidence});
  const both = (token) => reference.includes(token) && target.includes(token);

  check('SHARED_TAILWIND_SYSTEM',both('<script src="https://cdn.tailwindcss.com"></script>'),'Tailwind runtime shared');
  check('SHARED_GLOBAL_LAYOUT',reference.includes('assets/css/global-layout.css')&&target.includes('assets/css/global-layout.css'),'Global identity shared');
  check('CANONICAL_HERO',both('bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600'),'Dark layered hero shared');
  check('BREADCRUMB',both('aria-label="Breadcrumb"'),'Semantic breadcrumb shared');
  check('CONTEXT_BADGE',both('inline-flex rounded-full bg-white/15'),'Context pill shared');
  check('HERO_BENEFITS',both('rounded-xl bg-white/10')&&(target.match(/rounded-xl bg-white\/10/g)||[]).length>=4,'Four target benefit cards');
  check('INITIAL_CTA',reference.includes('href="#simulador"')&&target.includes('href="#simulador"'),'Hero CTA shared');
  check('DISCOVERY_BLOCK',both('O que voc')&&both('rounded-2xl border border-blue-100 bg-white'),'Discovery card shared');
  check('CANONICAL_WIDTH_RHYTHM',both('mx-auto max-w-6xl px-4'),'max-w-6xl shell shared');
  check('SIMULATOR_LAYOUT',both('lg:grid-cols-[minmax(0,1fr)_280px]'),'Guided journey plus aside shared');
  check('NUMBERED_STEP_CARDS',(target.match(/flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700/g)||[]).length===2,'Two FGTS journey steps');
  check('CONFERENCE_CARD',both('border border-blue-100 bg-blue-50')&&target.includes('Confer&ecirc;ncia'),'Canonical review/action card');
  check('PRIMARY_ACTION',both('rounded-xl bg-blue-700 px-6 py-4'),'Canonical primary CTA shared');
  check('EMPTY_STATE',both('border border-dashed border-slate-300 bg-white'),'Canonical report placeholder shared');
  check('RESULT_REPORT_CARD',reference.includes('id="resultado" class="mt-8')&&target.includes('id="result-content" class="mt-8'),'Sequential result report card');
  check('DOMINANT_RESULT',both('rounded-3xl bg-blue-700 p-5 text-white'),'Dominant blue result shared');
  check('SECONDARY_METRICS',target.includes('rounded-2xl bg-emerald-50')&&(target.match(/rounded-xl bg-slate-50 p-4/g)||[]).length>=3,'FGTS secondary hierarchy');
  check('INTERPRETATION',both('Interpreta')&&both('rounded-3xl border border-blue-100 bg-blue-50 p-5'),'Canonical interpretation section');
  check('AUDITABLE_MEMORY',both('Passo a passo audit')&&runtime.includes('rounded-2xl bg-white p-4'),'Canonical stepped memory');
  check('REPRODUCIBLE_SUMMARY',both('Resumo reproduz')&&both('min-w-[560px]'),'Responsive summary table');
  check('LIMITATIONS_AND_NEXT_STEPS',target.includes('Limita&ccedil;&otilde;es')&&target.includes('Pr&oacute;ximos passos'),'Canonical result follow-through');
  check('DISTINCT_ACTIONS',['btn-copy','btn-print','btn-download'].every((id)=>target.includes(`id="${id}"`)),'Copy, print and PDF');
  check('ADAPTIVE_REPORT',runtime.includes('buildReportHtml')&&runtime.includes('@page')&&runtime.includes('buildPdfBlob'),'Adaptive A4/selectable PDF');
  check('EDITORIAL_CARDS',both('id="conteudo-editorial"')&&both('rounded-3xl border border-slate-200 bg-white'),'Canonical editorial container');
  check('FAQ_CARDS',both('id="faq"')&&both('details class="rounded-xl border border-slate-200 p-4"'),'Canonical FAQ container');
  check('RESPONSIVE_LANGUAGE',['sm:py-14','sm:grid-cols-2','sm:flex-row','lg:items-start'].every((token)=>target.includes(token)),'Shared responsive breakpoints');
  check('LEGACY_SHELL_REMOVED',!target.includes('class="hero"')&&!target.includes('class="grid"')&&!target.includes('Dados para c&aacute;lculo')&&!target.includes('Resultado da simula&ccedil;&atilde;o'),'Legacy shell markers absent');
  check('INTERNAL_METADATA_HIDDEN',!/(fingerprint|stale state|Registry|Publishing|projecao governada|regra canonica|fixtures|cenarios reconciliados)/i.test(target.replace(/<script[\s\S]*?<\/script>/g,'')),'No governance metadata in public copy');

  const failed = checks.filter((item)=>item.status==='FAIL');
  checks.forEach((item)=>console.log(`${item.id}: ${item.status} (${item.evidence})`));
  console.log(`Checks: ${checks.length-failed.length}/${checks.length}`);
  console.log(`CANONICAL_VISUAL_FAMILY_CONFORMANCE: ${failed.length?'FAIL':'PASS'}`);
  console.log(`HUMAN_VISUAL_REVIEW_READY: ${failed.length?'false':'true'}`);
  if (failed.length) { process.exitCode=1; }
  return {status:failed.length?'FAIL':'PASS',humanVisualReviewReady:failed.length===0,checks};
}

if(require.main===module)run();
module.exports={run};
