const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const PAGE_PATH = path.join(ROOT, 'saque-aniversario-fgts', 'index.html');
const RUNTIME_PATH = path.join(ROOT, 'assets', 'js', 'tabelas-trabalhistas.js');
const TABLES_PATH = path.join(ROOT, 'data', 'tabelas-trabalhistas.json');
const OUTPUT_PATH = path.join(__dirname, 'regression-baseline.json');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Function ${name} not found in public page.`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Function ${name} is not balanced.`);
}

function roundForDisplay(value) {
  return Number(Number(value).toFixed(2));
}

const pageSource = fs.readFileSync(PAGE_PATH, 'utf8');
const pageBytes = fs.readFileSync(PAGE_PATH);
const legacyContext = vm.createContext({Intl});
vm.runInContext([
  extractFunction(pageSource, 'parseCurrency'),
  extractFunction(pageSource, 'getRuleLegacy'),
  extractFunction(pageSource, 'rulesAreEquivalent')
].join('\n'), legacyContext);

const runtimeContext = vm.createContext({window: {}, console, fetch: async () => { throw new Error('Network disabled in baseline runner.'); }});
vm.runInContext(fs.readFileSync(RUNTIME_PATH, 'utf8'), runtimeContext);
const runtime = runtimeContext.window.CalculeTrabalhadorTabelas;
const tables = JSON.parse(fs.readFileSync(TABLES_PATH, 'utf8'));

const numericInputs = [];
const addNumeric = (id, balance, coverage) => numericInputs.push({id, balance, coverage});
const boundaries = [0, 500, 1000, 5000, 10000, 15000, 20000];
for (const boundary of boundaries) {
  addNumeric(`boundary-${boundary}-below`, boundary - 0.01, 'immediately-below-boundary');
  addNumeric(`boundary-${boundary}-exact`, boundary, 'exact-boundary');
  addNumeric(`boundary-${boundary}-above`, boundary + 0.01, 'immediately-above-boundary');
}
[
  [250, 'band-1-center'], [750, 'band-2-center'], [3000, 'band-3-center'],
  [7500, 'band-4-center'], [12500, 'band-5-center'], [17500, 'band-6-center'],
  [25000, 'band-7-center'], [123.45, 'cent-value'], [999.99, 'cent-value'],
  [1000.99, 'cent-value'], [20000.99, 'cent-value'], [100000, 'high-value'],
  [1000000, 'very-high-value']
].forEach(([balance, id]) => addNumeric(id, balance, id));

const numericScenarios = numericInputs.map(({id, balance, coverage}, index) => {
  const legacyRule = legacyContext.getRuleLegacy(balance);
  const central = runtime.calcularSaqueAniversarioFGTS(balance, tables);
  const equivalent = legacyContext.rulesAreEquivalent(legacyRule, central);
  const activeRule = equivalent ? {
    percentage: central.percentual,
    additional: central.parcelaAdicional,
    withdrawal: central.saquePermitido,
    remaining: central.saldoRestante
  } : legacyRule;
  const emptyState = balance <= 0;
  const withdrawalRaw = emptyState ? 0 : Number.isFinite(Number(activeRule.withdrawal))
    ? Number(activeRule.withdrawal)
    : balance * (activeRule.percentage / 100) + activeRule.additional;
  const remainingRaw = emptyState ? 0 : Number.isFinite(Number(activeRule.remaining))
    ? Number(activeRule.remaining)
    : Math.max(balance - withdrawalRaw, 0);
  const scenario = {
    scenarioId: `saque-aniversario-${String(index + 1).padStart(3, '0')}`,
    id,
    coverage,
    input: {balance},
    selectedBand: central.faixa ? {
      de: central.faixa.de,
      ate: central.faixa.ate,
      rotulo: central.faixa.rotulo
    } : null,
    percentage: emptyState ? 0 : activeRule.percentage,
    additional: emptyState ? 0 : activeRule.additional,
    output: {
      state: emptyState ? 'EMPTY' : 'RESULT',
      withdrawalRaw,
      withdrawalDisplayed: roundForDisplay(withdrawalRaw),
      remainingRaw,
      remainingDisplayed: roundForDisplay(remainingRaw)
    },
    rounding: equivalent ? 'CENTRAL_ROUND_HALF_AWAY_BY_MATH_ROUND_TO_CENTS' : 'LEGACY_RAW_NUMBER_THEN_INTL_DISPLAY',
    runtimeSource: equivalent ? 'CENTRAL_AGGREGATE_ACCEPTED_AFTER_LEGACY_EQUIVALENCE_GATE' : 'LEGACY_FALLBACK',
    centralVsLegacyEquivalent: equivalent
  };
  scenario.logicalChecksum = sha256(JSON.stringify(scenario));
  return scenario;
});

const parserInputs = ['', 'abc', '1', 'R$ 1.234,56', '-100,00', '500,005', '000', null];
const parserScenarios = parserInputs.map((input, index) => {
  const scenario = {
    scenarioId: `currency-parser-${String(index + 1).padStart(3, '0')}`,
    input,
    parsedBalance: legacyContext.parseCurrency(input),
    behavior: 'Strip every non-digit character and divide remaining integer by 100.'
  };
  scenario.logicalChecksum = sha256(JSON.stringify(scenario));
  return scenario;
});

const baseline = {
  version: '1.0.0',
  generatedAt: '2026-07-15',
  mode: 'READ_ONLY_BASELINE_FREEZE_MIGRATION_PLANNING',
  classification: 'LEGACY_BEHAVIOR_BASELINE',
  normativeAuthority: false,
  assetId: 'calculator:saque-aniversario-fgts',
  status: 'BASELINE_REPRODUCED',
  source: {
    page: 'saque-aniversario-fgts/index.html',
    pageSha256: sha256(pageBytes),
    runtime: 'assets/js/tabelas-trabalhistas.js',
    aggregate: 'data/tabelas-trabalhistas.json#saqueAniversario'
  },
  summary: {
    numericScenarioCount: numericScenarios.length,
    parserScenarioCount: parserScenarios.length,
    totalScenarioCount: numericScenarios.length + parserScenarios.length,
    centralLegacyEquivalentPositiveScenarios: numericScenarios.filter((item) => item.input.balance > 0 && item.centralVsLegacyEquivalent).length,
    unexplainedDivergences: numericScenarios.filter((item) => item.input.balance > 0 && !item.centralVsLegacyEquivalent).length,
    allSevenBandsCovered: new Set(numericScenarios.map((item) => item.selectedBand?.rotulo).filter(Boolean)).size === 7,
    boundariesCovered: boundaries
  },
  numericScenarios,
  parserScenarios
};
baseline.logicalChecksum = sha256(JSON.stringify(baseline));
fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(baseline, null, 2)}\n`);

const reproduced = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
if (reproduced.logicalChecksum !== baseline.logicalChecksum) throw new Error('Baseline write/read checksum mismatch.');
if (!baseline.summary.allSevenBandsCovered || baseline.summary.unexplainedDivergences !== 0) throw new Error('Baseline coverage/equivalence failed.');
console.log(`Saque-Aniversario baseline: ${baseline.summary.totalScenarioCount}/${baseline.summary.totalScenarioCount} reproduced; 7/7 bands; 0 unexplained math divergences; checksum ${baseline.logicalChecksum}`);
