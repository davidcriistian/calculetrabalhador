const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const pagePath = path.join(root, 'calculadora-reserva-financeira-pj', 'index.html');
const html = fs.readFileSync(pagePath, 'utf8');
const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)).map((match) => match[1]);
const calculatorScript = scripts.find((source) => source.includes('window.calculateReservaFinanceiraPj'));

if (!calculatorScript) throw new Error('Calculator runtime script not found.');

const element = () => ({
  value: '',
  textContent: '',
  innerHTML: '',
  className: '',
  style: {},
  classList: { add() {}, remove() {}, toggle() {} },
  addEventListener() {},
  setAttribute() {},
  focus() {},
  scrollIntoView() {},
  click() {},
  remove() {},
  select() {}
});

const elements = new Map();
const document = {
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, element());
    return elements.get(id);
  },
  createElement: element,
  execCommand() { return true; },
  body: { appendChild() {} }
};

const context = {
  console,
  document,
  navigator: {},
  Intl,
  Date,
  Number,
  Math,
  Error,
  Blob,
  URL,
  alert() {},
  setTimeout() {},
  clearTimeout() {}
};
context.window = context;
vm.createContext(context);
vm.runInContext(calculatorScript, context, { filename: pagePath });

const builtIn = context.testarCalculadoraReservaFinanceiraPj();
const failures = builtIn.results.filter((item) => item.status !== 'PASS');
if (failures.length) throw new Error(`Built-in calculation failures: ${JSON.stringify(failures)}`);

const common = context.calculateReservaFinanceiraPj({
  custosEmpresa: 1200,
  despesasPessoais: 4500,
  tributosMensais: 800,
  outrosEssenciais: 500,
  mesesCobertura: 6,
  pausaPlanejada: 4500,
  custosAnuais: 1200,
  reservaAtual: 5000,
  aporteMensal: 1000
});

if (common.baseMensal !== 7000) throw new Error('Unexpected monthly base.');
if (common.reservaSeguranca !== 42000) throw new Error('Unexpected security reserve.');
if (common.metaTotal !== 47700) throw new Error('Unexpected total target.');
if (common.valorFaltante !== 42700) throw new Error('Unexpected gap.');
if (common.mesesPrazo !== 43) throw new Error('Unexpected projected duration.');
if (common.cenarios.reduce((sum, scenario) => sum + scenario.meta, 0) !== 232800) throw new Error('Unexpected scenario comparison.');

const jsonLdBlocks = Array.from(html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi));
if (jsonLdBlocks.length !== 1) throw new Error('Expected one JSON-LD graph block.');
const graph = JSON.parse(jsonLdBlocks[0][1]);
const types = graph['@graph'].map((item) => item['@type']);
for (const required of ['BreadcrumbList', 'SoftwareApplication', 'FAQPage']) {
  if (!types.includes(required)) throw new Error(`Missing JSON-LD type: ${required}`);
}

const h1Count = (html.match(/<h1\b/gi) || []).length;
if (h1Count !== 1) throw new Error(`Expected exactly one H1, found ${h1Count}.`);
for (const requiredId of ['reserva-form', 'form-error', 'resultado-vazio', 'resultado', 'memoria-lista', 'tabela-cenarios', 'btnCopiar', 'btnImprimir', 'btnBaixar']) {
  if (!html.includes(`id="${requiredId}"`)) throw new Error(`Missing required element: ${requiredId}`);
}
if (!html.includes("$('btnImprimir').addEventListener('click', () => { if (ensureReport()) window.print(); });")) throw new Error('Print action is not wired to the report guard.');

const visibleFaq = Array.from(html.matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>/gi)).map((match) => match[1].replace(/<[^>]+>/g, '').trim());
const faqSchema = graph['@graph'].find((item) => item['@type'] === 'FAQPage').mainEntity.map((item) => item.name);
if (JSON.stringify(visibleFaq) !== JSON.stringify(faqSchema)) throw new Error('Visible FAQ and FAQPage schema do not match.');

const internalLinks = Array.from(html.matchAll(/href="(\/[^"#?]*)"/gi)).map((match) => match[1]);
for (const link of new Set(internalLinks)) {
  const target = link === '/' ? path.join(root, 'index.html') : path.join(root, link.replace(/^\//, ''), link.endsWith('/') ? 'index.html' : '');
  if (!fs.existsSync(target)) throw new Error(`Broken internal link: ${link}`);
}

const tools = JSON.parse(fs.readFileSync(path.join(root, 'data', 'tools.json'), 'utf8'));
const toolsMap = JSON.parse(fs.readFileSync(path.join(root, 'data', 'maps', 'tools-map.json'), 'utf8'));
const registryIndex = JSON.parse(fs.readFileSync(path.join(root, 'data', 'registry', 'by-type', 'index.json'), 'utf8'));
const publishingIndex = JSON.parse(fs.readFileSync(path.join(root, 'data', 'publishing', 'registry', 'index.json'), 'utf8'));
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const assetId = 'calculadora-reserva-financeira-pj';
const publicUrl = 'https://calculetrabalhador.com.br/calculadora-reserva-financeira-pj/';
if (tools.filter((item) => item.id === assetId).length !== 1) throw new Error('Tools catalog identity mismatch.');
if (toolsMap.items.filter((item) => item.id === assetId).length !== 1) throw new Error('Tools map identity mismatch.');
if (registryIndex.entries.filter((item) => item.id === assetId).length !== 1) throw new Error('Registry index identity mismatch.');
if (publishingIndex.draftEntries.filter((item) => item.assetId === `calculator:${assetId}`).length !== 1) throw new Error('Publishing index identity mismatch.');
if (sitemap.split(publicUrl).length - 1 !== 1) throw new Error('Sitemap identity mismatch.');

console.log(`Reserva Financeira PJ: ${builtIn.passed}/${builtIn.total} calculation cases PASS`);
console.log('Reserva Financeira PJ: common scenario PASS');
console.log('Reserva Financeira PJ: JSON-LD, links, catalogs and structural checks PASS');
