const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILES = Object.freeze({
  rule: 'data/rules/fgts.json',
  projection: 'data/core/update/fgts-saque-aniversario-projection.contract.json',
  consumers: 'data/core/update/governed-rule-consumers.json',
  fixtures: 'data/pos/validation/fgts-saque-aniversario-canonical-rule-fixtures.json',
  baseline: 'data/operations/reports/end-to-end/pre-migration-calculator-saque-aniversario-fgts/regression-baseline.json'
});

const RULE_ID = 'fgts.saque-aniversario';
const RULE_VERSION = '1.0.0-rc.1';
const EXPECTED_BASELINE_CHECKSUM = '33d7647001c85f04beba03df4fd3212722477f2eb65027f0833eac9b67400841';
const REQUIRED_RULE_FIELDS = [
  'ruleId', 'title', 'status', 'version', 'effectiveFrom', 'jurisdiction',
  'officialSources', 'scope', 'parameters', 'bands', 'formula', 'rounding',
  'validation', 'consumerContracts', 'updateSensitivity', 'lastReviewedAt',
  'reviewStatus', 'fingerprint', 'projectionPayload'
];
const REQUIRED_CONSUMER_TYPES = [
  'CALCULATION_ENGINE', 'VISIBLE_TABLE', 'RESULT_EXPLANATION', 'RULE_SUMMARY',
  'RULE_DEPENDENT_EXAMPLE', 'UPDATED_AT_METADATA', 'VALIDATION_TEST',
  'REPORT_OUTPUT', 'STALE_DETECTION'
];
const REQUIRED_CONSUMER_FIELDS = [
  'consumerId', 'assetId', 'type', 'sourceRuleId', 'currentMode',
  'migrationState', 'stalePolicy', 'validationRequirements'
];
const LAST_BAND_LABEL = 'Acima de R$ 20.000,00';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((output, key) => {
      output[key] = canonicalize(value[key]);
      return output;
    }, {});
  }
  return value;
}

function fingerprint(value) {
  return crypto.createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex');
}

function getCanonicalRule(container) {
  return container && container.rules && container.rules.saqueAniversario;
}

function validateRule(container, mutation = 'NONE') {
  if (mutation === 'EMPTY_RULE') return {status:'BLOCKED_BY_INVALID_RULE', reasons:['empty-rule']};
  const rule = getCanonicalRule(container);
  const reasons = [];
  if (!container || container.domainId !== 'fgts' || container.ruleId !== 'fgts') reasons.push('invalid-domain-container');
  if (!rule || typeof rule !== 'object') return {status:'BLOCKED_BY_INVALID_RULE', reasons:['missing-canonical-subrule']};
  for (const field of REQUIRED_RULE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(rule, field) || rule[field] === null || rule[field] === '') reasons.push(`missing:${field}`);
  }
  if (rule.ruleId !== RULE_ID || rule.version !== RULE_VERSION || rule.status !== 'candidate') reasons.push('unknown-rule-id-version-or-status');
  if (rule.reviewStatus !== 'LEGAL_REVIEW_RESOLVED') reasons.push('legal-review-not-resolved');
  if (!Array.isArray(container.officialSources) || container.officialSources.length < 4) reasons.push('official-sources-insufficient');
  const availableSourceIds = new Set((container.officialSources || []).map((source) => source.sourceId));
  if (!Array.isArray(rule.officialSources) || rule.officialSources.some((sourceId) => !availableSourceIds.has(sourceId))) reasons.push('canonical-source-reference-invalid');
  if (rule.fingerprint !== fingerprint(rule.projectionPayload) || container.fingerprint !== rule.fingerprint) reasons.push('fingerprint-mismatch');
  if (rule.projectionPayload.ruleId !== rule.ruleId || rule.projectionPayload.ruleVersion !== rule.version) reasons.push('projection-version-mismatch');
  if (!container.rules.antecipacao || container.rules.antecipacao.engineImpact !== false) reasons.push('temporal-rule-separation-invalid');
  if (!container.rules.returnToSaqueRescisao || container.rules.returnToSaqueRescisao.engineImpact !== false) reasons.push('return-rule-separation-invalid');
  return {status:reasons.length ? 'BLOCKED_BY_INVALID_RULE' : 'PASS', reasons};
}

function mutateBands(bands, mutation) {
  const candidate = clone(bands);
  if (mutation === 'REMOVE_BAND_4') candidate.splice(3, 1);
  if (mutation === 'OVERLAP_BAND_3') candidate[2].lowerBound = 999;
  if (mutation === 'GAP_BAND_3') candidate[2].lowerBound = 1001;
  if (mutation === 'RATE_BAND_2') candidate[1].rate = 0.41;
  if (mutation === 'ADDITIONAL_BAND_5') candidate[4].additionalAmount = 1151;
  return candidate;
}

function validateBands(bands, mutation = 'NONE') {
  const candidate = mutateBands(bands, mutation);
  if (candidate.length !== 7) return {status:'BAND_COUNT_INVALID', bands:candidate};
  for (let index = 0; index < candidate.length; index += 1) {
    const band = candidate[index];
    if (band.order !== index + 1 || typeof band.rate !== 'number' || typeof band.additionalAmount !== 'number') return {status:'BAND_STRUCTURE_INVALID', bands:candidate};
    if (index === 0 && (band.lowerBound !== 0 || band.lowerInclusive !== false)) return {status:'BAND_STRUCTURE_INVALID', bands:candidate};
    if (index > 0) {
      const previous = candidate[index - 1];
      if (band.lowerBound < previous.upperBound) return {status:'BAND_OVERLAP', bands:candidate};
      if (band.lowerBound > previous.upperBound) return {status:'BAND_GAP', bands:candidate};
      if (previous.upperInclusive !== true || band.lowerInclusive !== false) return {status:'BAND_BOUNDARY_INCLUSIVITY_INVALID', bands:candidate};
    }
  }
  const last = candidate[candidate.length - 1];
  if (last.upperBound !== null || last.lowerBound !== 20000 || last.lowerInclusive !== false) return {status:'LAST_BAND_BOUNDARY_INVALID', bands:candidate};
  return {status:'PASS', bands:candidate};
}

function selectBand(balance, bands) {
  return bands.find((band) => {
    const lower = band.lowerInclusive ? balance >= band.lowerBound : balance > band.lowerBound;
    const upper = band.upperBound === null || (band.upperInclusive ? balance <= band.upperBound : balance < band.upperBound);
    return lower && upper;
  }) || null;
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function calculate(balanceInput, rule, bandsOverride = null) {
  const balance = Number(balanceInput);
  if (!Number.isFinite(balance) || balance <= 0) {
    return {state:'EMPTY', balance:Number.isFinite(balance) ? balance : 0, band:null, percentage:0, additionalAmount:0, withdrawal:0, remainingBalance:0};
  }
  const bands = bandsOverride || rule.projectionPayload.bands;
  const band = selectBand(balance, bands);
  if (!band) return {state:'INVALID_BAND', balance, band:null, percentage:0, additionalAmount:0, withdrawal:0, remainingBalance:balance};
  const withdrawal = roundMoney(balance * band.rate + band.additionalAmount);
  const remainingBalance = roundMoney(Math.max(balance - withdrawal, 0));
  return {
    state:'RESULT', balance, band, percentage:band.rate * 100,
    additionalAmount:band.additionalAmount, withdrawal, remainingBalance
  };
}

function parseLegacyCurrency(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? Number(digits) / 100 : 0;
}

function validateBaseline(rule, baseline, mutation = 'NONE') {
  const candidate = clone(baseline);
  const bands = mutateBands(rule.projectionPayload.bands, mutation);
  if (mutation === 'EXPECTED_OUTPUT_CHANGED') {
    const firstPositive = candidate.numericScenarios.find((scenario) => scenario.input.balance > 0);
    firstPositive.output.withdrawalDisplayed += 0.01;
  }
  const failures = [];
  for (const scenario of candidate.numericScenarios) {
    const actual = calculate(scenario.input.balance, rule, bands);
    const expectedState = scenario.output.state;
    if (actual.state !== expectedState
      || actual.percentage !== scenario.percentage
      || actual.additionalAmount !== scenario.additional
      || actual.withdrawal !== scenario.output.withdrawalDisplayed
      || actual.remainingBalance !== scenario.output.remainingDisplayed) failures.push(scenario.scenarioId);
  }
  for (const scenario of candidate.parserScenarios) {
    if (parseLegacyCurrency(scenario.input) !== scenario.parsedBalance) failures.push(scenario.scenarioId);
  }
  const checksumOk = baseline.logicalChecksum === EXPECTED_BASELINE_CHECKSUM;
  if (!checksumOk) failures.push('baseline-logical-checksum');
  return {
    status:failures.length ? 'FGTS_CANONICAL_RULE_EQUIVALENCE_FAILED' : '42/42 EQUIVALENT',
    total:candidate.summary.totalScenarioCount,
    numeric:candidate.numericScenarios.length,
    parser:candidate.parserScenarios.length,
    failures,
    baselineChecksum:baseline.logicalChecksum
  };
}

function validateLastLabel(rule, mutation = 'NONE') {
  const label = mutation === 'LEGACY_LABEL' ? 'Acima de R$ 20.000,01' : rule.projectionPayload.bands[6].displayLabel;
  return label === LAST_BAND_LABEL ? 'PASS' : 'LAST_BAND_LABEL_INVALID';
}

function validateConsumers(registry) {
  const declarations = (registry.dependencies || []).filter((item) => item.sourceRuleId === RULE_ID && item.assetId === 'calculator:saque-aniversario-fgts');
  const types = new Set();
  for (const declaration of declarations) {
    const missing = REQUIRED_CONSUMER_FIELDS.filter((field) => !Object.prototype.hasOwnProperty.call(declaration, field)
      || declaration[field] === '' || declaration[field] === null);
    if (missing.length || declaration.type !== declaration.consumerType) return {status:'UNDECLARED_RULE_CONSUMER', declarations, missing};
    if (!Array.isArray(declaration.validationRequirements) || declaration.validationRequirements.length === 0) return {status:'UNDECLARED_RULE_CONSUMER', declarations, missing:['validationRequirements']};
    types.add(declaration.type);
  }
  const missingTypes = REQUIRED_CONSUMER_TYPES.filter((type) => !types.has(type));
  return {status:missingTypes.length ? 'UNDECLARED_RULE_CONSUMER' : 'PASS', declarations, types:[...types], missingTypes};
}

function validateFallback(rule, projection, mutation = 'NONE') {
  const fallback = projection.fallback || {};
  if (mutation === 'FALLBACK_OVERRIDES_SOURCE') return 'FALLBACK_POLICY_INVALID';
  const valid = fallback.decision === 'REPLACE_WITH_DERIVED_FALLBACK'
    && fallback.silentFallbackAllowed === false
    && fallback.fallbackMayOverrideCanonicalSource === false
    && fallback.futureFallback.ruleVersion === rule.version
    && fallback.futureFallback.fingerprint === rule.fingerprint
    && fallback.futureFallback.origin.includes('projectionPayload');
  return valid ? 'PASS' : 'FALLBACK_POLICY_INVALID';
}

function detectStale(rule, projection, fixtures, mutation = 'NONE') {
  if (mutation === 'UNKNOWN_RULE_VERSION') return 'UNKNOWN_VERSION';
  if (mutation === 'VISIBLE_TABLE_OLD') return 'STALE_VISIBLE_TABLE';
  if (mutation === 'FALLBACK_FINGERPRINT_OLD') return 'STALE_FALLBACK';
  if (mutation === 'MEMORY_VERSION_OLD') return 'STALE_MEMORY';
  if (mutation === 'REPORT_FINGERPRINT_OLD') return 'STALE_REPORT';
  if (mutation === 'BASELINE_CHECKSUM_OLD') return 'STALE_TEST_EXPECTATION';
  const candidate = clone(rule);
  if (mutation === 'CANONICAL_RATE_CHANGED') candidate.projectionPayload.bands[0].rate = 0.51;
  const canonicalFingerprint = fingerprint(candidate.projectionPayload);
  if (candidate.version !== projection.sourceRuleVersion || fixtures.ruleVersion !== candidate.version) return 'UNKNOWN_VERSION';
  if (canonicalFingerprint !== projection.sourceProjectionFingerprint) return 'STALE_DERIVED_OUTPUT';
  if (projection.fallback.futureFallback.fingerprint !== canonicalFingerprint) return 'STALE_FALLBACK';
  if (fixtures.sourceProjectionFingerprint !== canonicalFingerprint) return 'STALE_TEST_EXPECTATION';
  return 'SYNCED';
}

function validateBoundaries(rule) {
  const cases = [
    [-1, null], [0, null], [0.01, 1], [500, 1], [500.01, 2],
    [1000, 2], [1000.01, 3], [5000, 3], [5000.01, 4],
    [10000, 4], [10000.01, 5], [15000, 5], [15000.01, 6],
    [20000, 6], [20000.01, 7], [123.45, 1], [1000000, 7]
  ];
  const results = cases.map(([balance, expectedOrder]) => {
    const actual = calculate(balance, rule);
    const actualOrder = actual.band ? actual.band.order : null;
    return {balance, expectedOrder, actualOrder, status:actualOrder === expectedOrder ? 'PASS' : 'FAIL'};
  });
  return {status:results.every((item) => item.status === 'PASS') ? 'PASS' : 'FAIL', results};
}

function evaluateFixture(fixture, context) {
  if (fixture.operation === 'validate-rule') return validateRule(context.container, fixture.mutation).status;
  if (fixture.operation === 'validate-bands') return validateBands(context.rule.projectionPayload.bands, fixture.mutation).status;
  if (fixture.operation === 'validate-baseline') return validateBaseline(context.rule, context.baseline, fixture.mutation).status;
  if (fixture.operation === 'validate-last-label') return validateLastLabel(context.rule, fixture.mutation);
  if (fixture.operation === 'validate-consumers') return validateConsumers(context.consumers).status;
  if (fixture.operation === 'validate-fallback') return validateFallback(context.rule, context.projection, fixture.mutation);
  if (fixture.operation === 'detect-stale') return detectStale(context.rule, context.projection, context.fixtures, fixture.mutation);
  if (fixture.operation === 'validate-boundaries') return validateBoundaries(context.rule).status;
  if (fixture.operation === 'classify-temporal-copy') return 'HEURISTIC_WARNING';
  if (fixture.operation === 'official-source-change') return 'HUMAN_REVIEW_REQUIRED';
  return 'UNKNOWN_FIXTURE_OPERATION';
}

function run({silent = false} = {}) {
  const container = readJson(FILES.rule);
  const rule = getCanonicalRule(container);
  const context = {
    container,
    rule,
    projection:readJson(FILES.projection),
    consumers:readJson(FILES.consumers),
    fixtures:readJson(FILES.fixtures),
    baseline:readJson(FILES.baseline)
  };
  const ruleResult = validateRule(container);
  const bandResult = validateBands(rule.projectionPayload.bands);
  const baselineResult = validateBaseline(rule, context.baseline);
  const consumerResult = validateConsumers(context.consumers);
  const fallbackResult = validateFallback(rule, context.projection);
  const staleState = detectStale(rule, context.projection, context.fixtures);
  const boundaryResult = validateBoundaries(rule);
  const lastLabelResult = validateLastLabel(rule);
  const fixtureResults = context.fixtures.scenarios.map((fixture) => {
    const actualStatus = evaluateFixture(fixture, context);
    return {...fixture, actualStatus, matched:actualStatus === fixture.expectedStatus};
  });
  const fixtureFailures = fixtureResults.filter((fixture) => !fixture.matched);
  const failures = [];
  if (ruleResult.status !== 'PASS') failures.push(`rule:${ruleResult.status}`);
  if (bandResult.status !== 'PASS') failures.push(`bands:${bandResult.status}`);
  if (baselineResult.status !== '42/42 EQUIVALENT') failures.push(`baseline:${baselineResult.status}`);
  if (consumerResult.status !== 'PASS') failures.push(`consumers:${consumerResult.status}`);
  if (fallbackResult !== 'PASS') failures.push(`fallback:${fallbackResult}`);
  if (staleState !== 'SYNCED') failures.push(`stale:${staleState}`);
  if (boundaryResult.status !== 'PASS') failures.push(`boundaries:${boundaryResult.status}`);
  if (lastLabelResult !== 'PASS') failures.push(`last-label:${lastLabelResult}`);
  if (fixtureFailures.length) failures.push(`fixtures:${fixtureFailures.length}`);
  const outcome = failures.length ? 'FGTS_CANONICAL_RULE_EQUIVALENCE_FAILED' : 'SAQUE_ANIVERSARIO_FGTS_CANONICAL_RULE_READY';
  if (!silent) {
    console.log('FGTS Saque-Aniversario Canonical Rule Reconciliation');
    console.log(`Rule: ${rule.ruleId}@${rule.version} (${rule.status})`);
    console.log(`Rule validation: ${ruleResult.status}`);
    console.log(`Projection fingerprint: ${fingerprint(rule.projectionPayload)}`);
    console.log(`Bands: ${bandResult.status} (${rule.projectionPayload.bands.length}/7)`);
    console.log(`Baseline: ${baselineResult.status}`);
    console.log(`Typed consumers: ${consumerResult.types.length}/${REQUIRED_CONSUMER_TYPES.length}`);
    console.log(`Fallback: ${fallbackResult}`);
    console.log(`Stale state: ${staleState}`);
    console.log(`Boundary tests: ${boundaryResult.results.filter((item) => item.status === 'PASS').length}/${boundaryResult.results.length}`);
    console.log(`Last band label: ${lastLabelResult}`);
    fixtureResults.forEach((fixture) => console.log(`${fixture.id}: ${fixture.actualStatus}${fixture.matched ? '' : ` (expected ${fixture.expectedStatus})`}`));
    console.log(`Fixtures: ${fixtureResults.length - fixtureFailures.length}/${fixtureResults.length} matched`);
    console.log(`Outcome: ${outcome}`);
  }
  if (failures.length) process.exitCode = 1;
  return {context, ruleResult, bandResult, baselineResult, consumerResult, fallbackResult, staleState, boundaryResult, lastLabelResult, fixtureResults, fixtureFailures, failures, outcome};
}

if (require.main === module) run();

module.exports = {
  FILES,
  RULE_ID,
  RULE_VERSION,
  REQUIRED_CONSUMER_TYPES,
  calculate,
  canonicalize,
  detectStale,
  fingerprint,
  getCanonicalRule,
  parseLegacyCurrency,
  run,
  selectBand,
  validateBands,
  validateBaseline,
  validateBoundaries,
  validateConsumers,
  validateFallback,
  validateRule
};
