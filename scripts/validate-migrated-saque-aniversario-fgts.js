const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const RULE_ID = 'fgts.saque-aniversario';
const RULE_VERSION = '1.0.0-rc.1';
const FINGERPRINT = '966ea90005f500f2d462844680860fc548755271e26f51f8688e5889efd620bd';
const BASELINE_CHECKSUM = '33d7647001c85f04beba03df4fd3212722477f2eb65027f0833eac9b67400841';

function read(relativePath) { return fs.readFileSync(path.join(ROOT, relativePath), 'utf8'); }
function json(relativePath) { return JSON.parse(read(relativePath)); }
function assert(condition, message) { if (!condition) throw new Error(message); }
function round(value) { return Math.round((Number(value) + Number.EPSILON) * 100) / 100; }
function calculate(balance, projection) {
  if (!Number.isFinite(balance) || balance <= 0) return {state:'EMPTY',percentage:0,additional:0,withdrawal:0,remaining:0,band:null};
  const band = projection.faixas.find((item) => item.ate === null || balance <= item.ate);
  assert(band, `No band for ${balance}`);
  const withdrawal = round(balance * band.aliquota + band.parcelaAdicional);
  return {state:'RESULT',percentage:band.percentual,additional:band.parcelaAdicional,withdrawal,remaining:round(Math.max(balance-withdrawal,0)),band};
}
function parseLegacyCurrency(value) { const digits=String(value || '').replace(/\D/g,''); return digits ? Number(digits)/100 : 0; }
function text(value) { return String(value).replace(/<[^>]+>/g,' ').replace(/&aacute;/g,'a').replace(/&atilde;/g,'a').replace(/&ccedil;/g,'c').replace(/&eacute;/g,'e').replace(/&iacute;/g,'i').replace(/&oacute;/g,'o').replace(/&uacute;/g,'u').replace(/&ordm;/g,'o').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim(); }

function loadHelper() {
  const sandbox = {window:{},Intl,fetch:async()=>{throw new Error('disabled');},console};
  vm.runInNewContext(read('assets/js/tabelas-trabalhistas.js'),sandbox,{filename:'tabelas-trabalhistas.js'});
  return sandbox.window.CalculeTrabalhadorTabelas;
}

function run() {
  const page = read('saque-aniversario-fgts/index.html');
  const runtime = read('assets/js/saque-aniversario-fgts.js');
  const helperSource = read('assets/js/tabelas-trabalhistas.js');
  const aggregate = json('data/tabelas-trabalhistas.json');
  const ruleContainer = json('data/rules/fgts.json');
  const baseline = json('data/operations/reports/end-to-end/pre-migration-calculator-saque-aniversario-fgts/regression-baseline.json');
  const consumers = json('data/core/update/governed-rule-consumers.json');
  const registry = json('data/registry/by-type/calculator-saque-aniversario-fgts.json');
  const registryIndex = json('data/registry/by-type/index.json');
  const publishing = json('data/publishing/registry/calculator-saque-aniversario-fgts-published.json');
  const publishingIndex = json('data/publishing/registry/index.json');
  const projection = aggregate.saqueAniversario;
  const canonical = ruleContainer.rules.saqueAniversario;
  const helper = loadHelper();
  const visualFamily = require('./validate-canonical-visual-family-conformance.js').run();
  const checks = [];
  const check = (id, condition, detail='') => { assert(condition, `${id}${detail ? `: ${detail}` : ''}`); checks.push({id,status:'PASS',detail}); };

  check('canonical-rule-unchanged',canonical.ruleId===RULE_ID&&canonical.version===RULE_VERSION&&canonical.fingerprint===FINGERPRINT);
  check('public-projection-identity',projection.ruleId===RULE_ID&&projection.ruleVersion===RULE_VERSION&&projection.sourceProjectionFingerprint===FINGERPRINT);
  check('public-projection-synced',helper.diagnosticarProjecaoSaqueAniversario(projection)==='SYNCED');
  check('derived-fallback-synced',helper.diagnosticarProjecaoSaqueAniversario(helper.obterFallbackSaqueAniversario())==='SYNCED');
  check('legacy-fallback-inactive',!page.includes('getRuleLegacy')&&!runtime.includes('getRuleLegacy')&&!helperSource.includes('getRuleLegacy'));
  check('single-source-runtime',runtime.includes('renderRatesTable(governedProjection)')&&runtime.includes('calcularSaqueAniversarioFGTS(balance,{saqueAniversario:governedProjection})'));
  check('seven-public-bands',projection.faixas.length===7&&projection.faixas[6].rotulo==='Acima de R$ 20.000,00');

  const baselineFailures=[];
  for(const scenario of baseline.numericScenarios){const actual=calculate(scenario.input.balance,projection);if(actual.state!==scenario.output.state||actual.percentage!==scenario.percentage||actual.additional!==scenario.additional||actual.withdrawal!==scenario.output.withdrawalDisplayed||actual.remaining!==scenario.output.remainingDisplayed)baselineFailures.push(scenario.scenarioId);}
  for(const scenario of baseline.parserScenarios){if(parseLegacyCurrency(scenario.input)!==scenario.parsedBalance)baselineFailures.push(scenario.scenarioId);}
  check('baseline-42-of-42',baseline.logicalChecksum===BASELINE_CHECKSUM&&baselineFailures.length===0,baselineFailures.join(','));
  const boundaries=[[-1,null],[0,null],[0.01,1],[500,1],[500.01,2],[1000,2],[1000.01,3],[5000,3],[5000.01,4],[10000,4],[10000.01,5],[15000,5],[15000.01,6],[20000,6],[20000.01,7],[123.45,1],[1000000,7]];
  const boundaryFailures=boundaries.filter(([balance,order])=>{const result=calculate(balance,projection);return (result.band?projection.faixas.indexOf(result.band)+1:null)!==order;});
  check('boundaries-17-of-17',boundaryFailures.length===0,JSON.stringify(boundaryFailures));

  check('seo-title-preserved',page.includes('<title>Calculadora de Saque Anivers&aacute;rio FGTS 2026</title>'));
  check('seo-description-preserved',page.includes('Calcule o valor do seu saque anivers&aacute;rio FGTS 2026 com base nas al&iacute;quotas oficiais da Lei 8.036/90. Simule quanto voc&ecirc; pode sacar do seu FGTS.'));
  check('canonical-preserved',page.includes('<link rel="canonical" href="https://calculetrabalhador.com.br/saque-aniversario-fgts/"'));
  check('h1-preserved',/<h1[^>]*>Calculadora de Saque Anivers&aacute;rio FGTS 2026<\/h1>/.test(page));
  check('canonical-experience-modules',['calculator-form','form-error','result-content','interpretation-text','memory-list','result-table','btn-copy','btn-print','btn-download','CANONICAL_RESULT_RECOMMENDATION_SLOT'].every((id)=>page.includes(`id="${id}"`)));
  check('adaptive-report-contract',runtime.includes('buildReportHtml')&&runtime.includes('buildPdfBlob')&&runtime.includes('@page')&&!runtime.includes('captureScreenshot'));
  check('file-and-http-paths',page.includes('../assets/js/tabelas-trabalhistas.js')&&runtime.includes("governed-derived-fallback")&&runtime.includes("governed-aggregate-json"));

  const schemaMatch=page.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
  assert(schemaMatch,'FAQPage schema missing');
  const faqSchema=JSON.parse(schemaMatch[1]);
  const visibleFaq=[...page.matchAll(/<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/details>/g)].map((item)=>({name:text(item[1]),answer:text(item[2])}));
  const schemaFaq=faqSchema.mainEntity.map((item)=>({name:text(item.name),answer:text(item.acceptedAnswer.text)}));
  check('faq-visible-schema-exact',visibleFaq.length===5&&JSON.stringify(visibleFaq)===JSON.stringify(schemaFaq));
  const links=[...page.matchAll(/<a\s+[^>]*href="(\/[^"]+)"/g)].map((item)=>item[1]);
  const missingLinks=links.filter((href)=>!fs.existsSync(path.join(ROOT,href.replace(/^\//,'').replace(/\/$/,'/index.html'))));
  check('internal-links-valid',links.length>=6&&missingLinks.length===0,`links=${links.length}${missingLinks.length?`; missing=${missingLinks.join(',')}`:''}`);
  const publicText=text(page.replace(/<style>[\s\S]*?<\/style>/g,'').replace(/<script[\s\S]*?<\/script>/g,''));
  const words=publicText.split(/\s+/).filter(Boolean).length;
  check('editorial-depth-preserved',words>=700,`words=${words}`);
  check('internal-governance-metadata-not-visible',!/(fingerprint|stale state|Registry|Publishing|projecao governada|regra canonica|fixtures|cenarios reconciliados)/i.test(publicText));
  check('canonical-visual-family-conformance',visualFamily.status==='PASS'&&visualFamily.humanVisualReviewReady===true);

  const targetConsumers=consumers.dependencies.filter((item)=>item.sourceRuleId===RULE_ID&&item.assetId==='calculator:saque-aniversario-fgts');
  const connected=['CALCULATION_ENGINE','VISIBLE_TABLE','RESULT_EXPLANATION','RULE_SUMMARY','UPDATED_AT_METADATA'];
  check('typed-public-consumers-connected',connected.every((type)=>targetConsumers.some((item)=>item.type===type&&item.confirmationStatus==='CONFIRMED_GOVERNED_CONSUMER'&&item.migrationState==='MIGRATED_GOVERNED_PUBLIC')));
  check('registry-entry',registry.status==='published'&&registry.runtimeStatus==='governed-public-consumer'&&registry.governedRule===`${RULE_ID}@${RULE_VERSION}`&&registryIndex.entries.some((item)=>item.assetId===registry.assetId));
  check('publishing-entry',publishing.status==='published'&&publishing.actions.publishes===false&&publishing.actions.deploys===false&&publishing.actions.callsIndexNow===false&&publishingIndex.draftEntries.some((item)=>item.assetId===publishing.assetId));
  const sitemap=read('sitemap.xml');
  check('sitemap-single-current',(sitemap.match(/https:\/\/calculetrabalhador\.com\.br\/saque-aniversario-fgts\//g)||[]).length===1&&sitemap.includes('<lastmod>2026-07-15</lastmod>'));
  check('rollback-surface-known',page.includes('../assets/js/saque-aniversario-fgts.js')&&fs.existsSync(path.join(ROOT,'scripts/migrate-saque-aniversario-fgts-public-runtime.js')));

  checks.forEach((item)=>console.log(`${item.id}: PASS${item.detail ? ` (${item.detail})` : ''}`));
  console.log(`Checks: ${checks.length}/${checks.length}`);
  console.log('Outcome: MIGRATED_SAQUE_ANIVERSARIO_FGTS_VALIDATED');
  return {checks,words,baseline:'42/42',boundaries:'17/17',outcome:'MIGRATED_SAQUE_ANIVERSARIO_FGTS_VALIDATED'};
}

if(require.main===module)run();
module.exports={run,calculate};
