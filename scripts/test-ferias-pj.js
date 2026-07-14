const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const pagePath = path.join(root, 'calculadora-ferias-pj', 'index.html');
const html = fs.readFileSync(pagePath, 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)).map((match) => match[1]);
const calculatorScript = scripts.find((source) => source.includes('window.calculateFeriasPj'));
if (!calculatorScript) throw new Error('Calculator runtime script not found.');

const element = () => ({
  value: '', textContent: '', innerHTML: '', className: '', style: {},
  classList: { add() {}, remove() {}, toggle() {} },
  addEventListener() {}, setAttribute() {}, focus() {}, scrollIntoView() {}, click() {}, remove() {}, select() {}
});
const elements = new Map();
const document = {
  getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); },
  createElement: element, querySelector() { return element(); }, execCommand() { return true; },
  body: { appendChild() {}, removeChild() {}, insertBefore() {} }
};
const context = {
  console, document, navigator: {}, Intl, Date, Number, Math, Error, Blob, URL,
  Object, String, Array, RegExp, alert() {}, setTimeout() {}, clearTimeout() {}
};
context.window = context;
context.location = { hostname: 'test' };
vm.createContext(context);
vm.runInContext(calculatorScript, context, { filename: pagePath });

const builtIn = context.testarCalculadoraFeriasPj();
const failures = builtIn.results.filter((item) => item.status !== 'PASS');
if (failures.length) throw new Error(`Built-in calculation failures: ${JSON.stringify(failures)}`);

const common = context.calculateFeriasPj({
  diasFerias: 20, mesesAteFerias: 10, rendaPessoal: 6000, custosFixos: 1500,
  receitaRecorrente: 1000, gastosExtras: 3000, reservaAtual: 2000, faturamentoMensal: 12000
});
if (common.selected.metaLiquida !== 7333.33) throw new Error('Unexpected net target.');
if (common.selected.valorFaltante !== 5333.33) throw new Error('Unexpected gap.');
if (common.selected.aporteMensal !== 533.33) throw new Error('Unexpected monthly contribution.');
if (common.cenarios.length !== 4 || common.cenarios[3].metaLiquida !== 9500) throw new Error('Unexpected comparison scenarios.');
if (common.recommendationState !== 'NOT_CONFIGURED') throw new Error('Recommendation state mismatch.');

const report = {
  ...common,
  calculatedAt: '14/07/2026 12:00:00',
  interpretation: 'Cenário de teste para relatório.',
  memory: ['Passo um.', 'Passo dois.']
};
const reportHtml = context.buildFeriasPjReportHtml(report, false);
if (!reportHtml.includes('<!doctype html>') || !reportHtml.includes('Meta líquida') || reportHtml.includes('global-header')) {
  throw new Error('Isolated print report mismatch.');
}
const pdfBlob = context.buildFeriasPjPdfBlob(report);
if (pdfBlob.type !== 'application/pdf' || pdfBlob.size < 500) throw new Error('Structured PDF generation mismatch.');

const jsonLdBlocks = Array.from(html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi));
if (jsonLdBlocks.length !== 1) throw new Error('Expected one JSON-LD graph block.');
const graph = JSON.parse(jsonLdBlocks[0][1]);
const types = graph['@graph'].map((item) => item['@type']);
for (const required of ['BreadcrumbList', 'SoftwareApplication', 'FAQPage']) {
  if (!types.includes(required)) throw new Error(`Missing JSON-LD type: ${required}`);
}

const visibleFaq = Array.from(html.matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>/gi)).map((match) => match[1].replace(/<[^>]+>/g, '').trim());
const schemaFaq = graph['@graph'].find((item) => item['@type'] === 'FAQPage');
const faqNames = schemaFaq.mainEntity.map((item) => item.name);
if (JSON.stringify(visibleFaq) !== JSON.stringify(faqNames)) throw new Error('Visible FAQ questions and FAQPage schema do not match.');

const visibleAnswers = Array.from(html.matchAll(/<details[^>]*>[\s\S]*?<summary[^>]*>[\s\S]*?<\/summary><p[^>]*>([\s\S]*?)<\/p><\/details>/gi)).map((match) => match[1].replace(/<[^>]+>/g, '').trim());
const schemaAnswers = schemaFaq.mainEntity.map((item) => item.acceptedAnswer.text);
if (JSON.stringify(visibleAnswers) !== JSON.stringify(schemaAnswers)) throw new Error('Visible FAQ answers and FAQPage schema do not match.');

const editorial = html.match(/<div id="editorial-main"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/section>/i);
if (!editorial) throw new Error('Editorial content block not found.');
const editorialWords = editorial[1].replace(/<[^>]+>/g, ' ').replace(/&[^;]+;/g, ' ').trim().split(/\s+/).filter(Boolean).length;
if (editorialWords < 800 || editorialWords > 1200) throw new Error(`Editorial word count outside contract: ${editorialWords}.`);

const htmlWithoutScripts = html.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi, '');
if ((htmlWithoutScripts.match(/<h1\b/gi) || []).length !== 1) throw new Error('Expected exactly one page H1.');
for (const requiredId of ['ferias-pj-form', 'form-error', 'resultado-vazio', 'resultado', 'CANONICAL_RESULT_RECOMMENDATION_SLOT', 'memoria-lista', 'tabela-cenarios', 'btnCopiar', 'btnImprimir', 'btnBaixar']) {
  if (!html.includes(`id="${requiredId}"`)) throw new Error(`Missing required element: ${requiredId}`);
}
if (!html.includes('Atualizado em julho de 2026') || !html.includes('<meta name="updated_at" content="2026-07-14"')) throw new Error('Governed visible freshness mismatch.');
if (!html.includes("link.download = 'relatorio-ferias-pj.pdf'")) throw new Error('PDF download action not wired.');

const internalLinks = Array.from(html.matchAll(/href="(\/[^"#?]*)"/gi)).map((match) => match[1]);
for (const link of new Set(internalLinks)) {
  const target = link === '/' ? path.join(root, 'index.html') : path.join(root, link.replace(/^\//, ''), link.endsWith('/') ? 'index.html' : '');
  if (!fs.existsSync(target)) throw new Error(`Broken internal link: ${link}`);
}

const tools = JSON.parse(fs.readFileSync(path.join(root, 'data', 'tools.json'), 'utf8'));
const toolsMap = JSON.parse(fs.readFileSync(path.join(root, 'data', 'maps', 'tools-map.json'), 'utf8'));
const registryIndex = JSON.parse(fs.readFileSync(path.join(root, 'data', 'registry', 'by-type', 'index.json'), 'utf8'));
const publishingIndex = JSON.parse(fs.readFileSync(path.join(root, 'data', 'publishing', 'registry', 'index.json'), 'utf8'));
const editorialMetadata = JSON.parse(fs.readFileSync(path.join(root, 'data', 'editorial-metadata.json'), 'utf8'));
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const id = 'calculadora-ferias-pj';
const publicUrl = 'https://calculetrabalhador.com.br/calculadora-ferias-pj/';
if (tools.filter((item) => item.id === id).length !== 1) throw new Error('Tools catalog identity mismatch.');
if (toolsMap.items.filter((item) => item.id === id).length !== 1) throw new Error('Tools map identity mismatch.');
if (registryIndex.entries.filter((item) => item.id === id).length !== 1) throw new Error('Registry index identity mismatch.');
if (publishingIndex.draftEntries.filter((item) => item.assetId === `calculator:${id}`).length !== 1) throw new Error('Publishing index identity mismatch.');
if (sitemap.split(publicUrl).length - 1 !== 1) throw new Error('Sitemap identity mismatch.');
if (editorialMetadata['/calculadora-ferias-pj/'].atualizadoEm !== '2026-07-14') throw new Error('Editorial metadata mismatch.');

console.log(`Férias PJ: ${builtIn.passed}/${builtIn.total} calculation cases PASS`);
console.log(`Férias PJ: editorial depth ${editorialWords} words PASS`);
console.log('Férias PJ: report HTML/PDF, FAQ, links, catalogs and structural checks PASS');
