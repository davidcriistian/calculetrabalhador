const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const rel = (value) => path.join(ROOT, value);
const read = (value) => fs.readFileSync(rel(value), 'utf8');
const json = (value) => JSON.parse(read(value));
const failures = [];
const checks = [];
function check(id, condition, detail = '') { checks.push({id, status:condition ? 'PASS' : 'FAIL', detail}); if (!condition) failures.push(`${id}${detail ? `: ${detail}` : ''}`); }

const html = read('calculadora-aviso-previo/index.html');
const rule = json('data/rules/aviso-previo.json');
const aggregate = json('data/tabelas-trabalhistas.json');
const projection = json('data/core/update/aviso-previo-projection.contract.json');
const baseline = json('data/operations/reports/end-to-end/aviso-previo-canonical-rule-reconciliation/legally-reconciled-baseline.json');
const consumers = json('data/core/update/governed-rule-consumers.json');
const metadata = json('data/editorial-metadata.json');
const tools = json('data/tools.json');
const toolsMap = json('data/maps/tools-map.json');

function getAttr(tag, name) { const match = tag.match(new RegExp(`${name}=["']([^"']+)["']`, 'i')); return match ? match[1] : null; }
function stripTags(value) { return value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ').replace(/\s+/g, ' ').trim(); }
function textWords(value) { return stripTags(value).match(/[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)*/gu) || []; }
function parseDate(value) { if (!value) return null; const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? null : date; }
function fullYearsBetween(start, end) { let years = end.getFullYear() - start.getFullYear(); if (end.getMonth() < start.getMonth() || (end.getMonth() === start.getMonth() && end.getDate() < start.getDate())) years -= 1; return Math.max(years, 0); }

function loadBrowserHelper() {
  const sandbox = {window:{}, console, Intl, Number, Math, Object, Error, fetch:async () => ({ok:true,json:async () => aggregate})};
  vm.createContext(sandbox);
  vm.runInContext(read('assets/js/tabelas-trabalhistas.js'), sandbox, {filename:'tabelas-trabalhistas.js'});
  return sandbox.window.CalculeTrabalhadorTabelas;
}

const helper = loadBrowserHelper();
function runtimeCalculate(input) {
  const salary = Number(input.salary);
  const startDate = parseDate(input.startDate);
  const endDate = parseDate(input.endDate);
  const rounding = {calculation:'raw JavaScript Number arithmetic',currencyDisplay:'Intl.NumberFormat pt-BR BRL',daysDisplay:'integer'};
  if (!salary || salary <= 0 || !startDate || !endDate || endDate < startDate) {
    return {resultCurrent:{valid:false,resultStatus:'Dados incompletos'},components:null,rounding,message:'Informe um salário válido e datas coerentes para calcular o aviso prévio.',outputFinal:{resultStatus:'Dados incompletos',badge:'simulação'}};
  }
  const fullYears = fullYearsBetween(startDate, endDate);
  const result = helper.calcularAvisoPrevio({fullYears,salary,noticeType:input.noticeType}, aggregate);
  const presentation = helper.projetarApresentacaoAvisoPrevio(result, aggregate);
  const brl = (value) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
  return {
    resultCurrent:{valid:true,fullYears,totalDays:result.totalDays,dailyValue:result.dailyValue,estimatedValue:result.estimatedValue},
    components:{fullYears,baseDays:result.baseDays,proportionalEntitlementDays:result.proportionalEntitlementDays,totalDays:result.totalDays,workedDays:result.workedDays,indemnifiedDays:result.indemnifiedDays,discountDays:result.discountDays,monetaryDays:result.monetaryDays,dailyValue:result.dailyValue,estimatedValue:result.estimatedValue},
    rounding,
    message:presentation.message,
    outputFinal:{resultStatus:'Cálculo realizado',badge:presentation.badge,estimatedLabel:presentation.estimatedLabel,totalDaysText:`${result.totalDays} dias`,dailyValueText:brl(result.dailyValue),estimatedValueText:brl(result.estimatedValue)}
  };
}

const scenarioResults = baseline.scenarios.map((scenario) => {
  const actual = runtimeCalculate(scenario.input);
  return {scenarioId:scenario.scenarioId, matched:JSON.stringify(actual) === JSON.stringify(scenario.legallyReconciledExpected), changed:scenario.changed, correctionType:scenario.correctionType};
});
const mismatches = scenarioResults.filter((item) => !item.matched);
check('legally-reconciled-baseline-60-of-60', mismatches.length === 0 && scenarioResults.length === 60, mismatches.map((item) => item.scenarioId).join(','));
check('intentional-corrections-18', scenarioResults.filter((item) => item.changed && item.matched).length === 18);
check('discount-corrections-9', scenarioResults.filter((item) => item.matched && item.correctionType === 'EMPLOYEE_DISCOUNT_CAPPED_AT_30_DAYS').length === 9);
check('worked-allocation-corrections-9', scenarioResults.filter((item) => item.matched && item.correctionType === 'WORKED_EXCESS_REALLOCATED_TO_INDEMNIFIED').length === 9);
check('unexplained-divergences-zero', baseline.summary.unexplainedDivergences === 0 && mismatches.length === 0);

const fallback = helper.obterFallbackAvisoPrevio();
const projectionFields = ['ruleId','ruleVersion','sourceProjectionFingerprint','updatedAt','reviewStatus','legalCorrectionPolicy','baseDays','additionalDaysPerFullYear','maximumAdditionalDays','maximumTotalDays','maximumWorkedDays','salaryDivisorDays','employeeResignationNoticeDays','employeeDiscountLimitDays','employerTerminationProportionality','employeeResignationProportionality','proportionalExcessIsIndemnified','presentation'];
check('derived-fallback-equivalent', projectionFields.every((field) => JSON.stringify(fallback[field]) === JSON.stringify(aggregate.avisoPrevio[field])));
check('canonical-transform-version', aggregate.avisoPrevio.ruleVersion === rule.version && aggregate.avisoPrevio.sourceProjectionFingerprint === projection.sourceProjectionFingerprint);
check('legacy-fallback-not-active', !/fallback legado|return legado|Fallback legado mantido|legacy-runtime/i.test(html));
check('no-local-legal-formula', !/rawAdditionalDays|baseDays\s*=\s*30|Math\.min\(90/i.test(html));
const visibleHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
check('internal-governance-metadata-not-visible', !/Regra ativa|aviso-previo@|projeção governada|revisão jurídica resolvida|cenários reconciliados|fingerprint|stale state|Registry|Publishing/i.test(visibleHtml));
check('internal-version-not-rendered-in-result-or-report', !/result\.ruleVersion|result\.ruleId|Fonte:\s*['"\s]*\+\s*sourceLabel/i.test(html));
check('user-oriented-confirmation-copy', html.includes('Confira seus dados e veja sua estimativa') && html.includes('clique em <strong>Calcular aviso prévio</strong>'));
check('simple-actionable-runtime-error', html.includes('Não foi possível realizar o cálculo agora. Tente novamente em alguns instantes.') && !html.includes('A regra governada não está disponível ou está fora de versão.'));
check('file-and-http-compatible-runtime-path', html.includes('src="../assets/js/tabelas-trabalhistas.js"') && !html.includes('src="/assets/js/tabelas-trabalhistas.js"'));

const title = (html.match(/<title>([^<]+)<\/title>/i) || [])[1];
const descriptionTag = (html.match(/<meta\s+name="description"[^>]*>/i) || [])[0] || '';
const canonicalTag = (html.match(/<link\s+rel="canonical"[^>]*>/i) || [])[0] || '';
const h1 = stripTags((html.match(/<h1[^>]*>[\s\S]*?<\/h1>/i) || [''])[0]);
check('seo-title-preserved', title === 'Calculadora de Aviso Prévio 2026 | Calcule Trabalhador');
check('seo-description-preserved', getAttr(descriptionTag,'content') === 'Calcule aviso prévio trabalhado ou indenizado com base no salário e tempo de empresa conforme a Lei 12.506/2011.');
check('canonical-preserved', getAttr(canonicalTag,'href') === 'https://calculetrabalhador.com.br/calculadora-aviso-previo/');
check('h1-preserved', h1 === 'Calculadora de Aviso Prévio 2026');

const schemas = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map((match) => JSON.parse(match[1]));
const graph = schemas.flatMap((schema) => schema['@graph'] || [schema]);
const faqSchema = graph.find((item) => item['@type'] === 'FAQPage');
check('jsonld-required-types', ['FAQPage','BreadcrumbList','SoftwareApplication'].every((type) => graph.some((item) => item['@type'] === type)));
const details = [...html.matchAll(/<details[^>]*>[\s\S]*?<summary[^>]*>([\s\S]*?)<\/summary>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>[\s\S]*?<\/details>/gi)].map((match) => ({name:stripTags(match[1]),text:stripTags(match[2])}));
const faqEntries = (faqSchema?.mainEntity || []).map((item) => ({name:item.name,text:item.acceptedAnswer.text}));
check('faq-visible-schema-exact', details.length === 5 && JSON.stringify(details) === JSON.stringify(faqEntries));

const inheritedLinks = ['/salario-liquido-clt/','/calculadora-rescisao-clt/','/calculadora-ferias-clt/','/calculadora-13-salario/','/calculadora-horas-extras-clt/','/calculadora-seguro-desemprego/','/saque-aniversario-fgts/','/ferramentas/'];
check('inherited-links-preserved', inheritedLinks.every((href) => html.includes(`href="${href}"`)));
const localLinks = [...html.matchAll(/href="(\/[^"#?]+\/)"/g)].map((match) => match[1]);
const broken = [...new Set(localLinks)].filter((href) => !fs.existsSync(rel(href === '/' ? 'index.html' : `${href.replace(/^\//,'')}index.html`)));
check('internal-links-valid', broken.length === 0, broken.join(','));

const editorial = (html.match(/<section id="conteudo-editorial"[\s\S]*?<\/section>\s*<section id="faq"/i) || [''])[0];
const editorialWords = textWords(editorial.replace(/<section id="faq"[\s\S]*/i,'')).length;
check('editorial-depth-800-1200', editorialWords >= 800 && editorialWords <= 1200, `words=${editorialWords}`);
check('disclaimer-preserved', html.includes('Esta calculadora tem finalidade informativa e educacional. Os valores exibidos são estimativas e não substituem documentos oficiais de rescisão, convenção coletiva, orientação do RH, contador, advogado trabalhista ou sindicato da categoria.'));
check('visible-updated-at', html.includes('data-updated-at="2026-07-14"') && html.includes('Atualizado em julho de 2026') && metadata['/calculadora-aviso-previo/'].atualizadoEm === rule.lastReviewedAt);

const requiredIds = ['calculator-form','form-error','resultado-vazio','resultado','result-context','total-days','dynamic-note','CANONICAL_RESULT_RECOMMENDATION_SLOT','memory-list','result-table','btn-copy','btn-print','btn-download'];
check('canonical-experience-modules', requiredIds.every((id) => html.includes(`id="${id}"`)));
check('recommendation-slot-state-and-order', html.includes('data-state="NOT_CONFIGURED"') && html.indexOf('id="dynamic-note"') < html.indexOf('id="CANONICAL_RESULT_RECOMMENDATION_SLOT"') && html.indexOf('id="CANONICAL_RESULT_RECOMMENDATION_SLOT"') < html.indexOf('id="memory-list"'));
check('adaptive-report-contract', /@page\{size:A4/.test(html) && /application\/pdf/.test(html) && /relatorio-aviso-previo\.pdf/.test(html) && /buildPdfBlob/.test(html));
check('distinct-result-actions', /navigator\.clipboard\.writeText/.test(html) && /window\.open/.test(html) && /URL\.createObjectURL/.test(html));
check('responsive-overflow-guards', /overflow-x:\s*hidden/.test(html) && /overflow-x-auto/.test(html));

const avisoConsumers = consumers.dependencies.filter((item) => item.sourceRuleId === 'aviso-previo' && item.assetId === 'calculator:calculadora-aviso-previo');
const activeTypes = ['CALCULATION_ENGINE','RESULT_EXPLANATION','RULE_SUMMARY','UPDATED_AT_METADATA'];
check('typed-consumers-connected', activeTypes.every((type) => avisoConsumers.some((item) => item.type === type && item.status === 'GOVERNED_CONFIRMED' && item.confirmationStatus === 'CONFIRMED_GOVERNED_CONSUMER')));
check('projection-connected', projection.runtimeStatus === 'public-asset-connected-local-not-deployed' && projection.fallback.currentPublicFallbackStatus === 'REPLACED_BY_CORRECTED_DERIVED_FALLBACK' && projection.legalGate.publicMigrationAuthorized === true);
check('rule-migration-state', rule.certification.publicMigrationAuthorized === true && rule.certification.publicRuntimeMigrationStatus === 'MIGRATED_LOCAL_NOT_DEPLOYED' && rule.legalAssessment.publicBehaviorStillLegacy === false);

const tool = tools.find((item) => item.id === 'calculadora-aviso-previo');
const toolMap = toolsMap.items.find((item) => item.id === 'calculadora-aviso-previo');
check('catalog-preserved-and-updated', tool && tool.slug === '/calculadora-aviso-previo/' && tool.published === true && tool.updatedAt === '2026-07-14');
check('tools-map-governed', toolMap && toolMap.rulesUsed.includes('aviso-previo') && toolMap.reviewFrequency === 'on-rule-change' && toolMap.risk === 'high');
check('registry-entry', fs.existsSync(rel('data/registry/by-type/calculator-calculadora-aviso-previo.json')) && read('data/registry/by-type/index.json').includes('calculator:calculadora-aviso-previo'));
check('publishing-entry', fs.existsSync(rel('data/publishing/registry/calculator-calculadora-aviso-previo-published.json')) && read('data/publishing/registry/index.json').includes('publishing-calculator-calculadora-aviso-previo'));
check('sitemap-single-current', (read('sitemap.xml').match(/https:\/\/calculetrabalhador\.com\.br\/calculadora-aviso-previo\//g) || []).length === 1 && read('sitemap.xml').includes('<lastmod>2026-07-14</lastmod>'));

const inlineScripts = [...html.matchAll(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
let syntaxError = null; try { inlineScripts.forEach((source,index) => new vm.Script(source,{filename:`inline-${index}.js`})); } catch (error) { syntaxError = error.message; }
check('inline-javascript-syntax', syntaxError === null, syntaxError || '');

checks.forEach((item) => console.log(`${item.id}: ${item.status}${item.detail ? ` (${item.detail})` : ''}`));
console.log(`Scenarios: ${scenarioResults.length - mismatches.length}/${scenarioResults.length} reconciled expectations`);
console.log('Intentional legal corrections: 18 (9 discount + 9 worked allocation/presentation)');
console.log(`Editorial words: ${editorialWords}`);
console.log(`Outcome: ${failures.length ? 'MIGRATED_AVISO_PREVIO_VALIDATION_FAILED' : 'MIGRATED_AVISO_PREVIO_VALIDATED'}`);
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
module.exports = {checks, failures, scenarioResults, editorialWords, runtimeCalculate};
