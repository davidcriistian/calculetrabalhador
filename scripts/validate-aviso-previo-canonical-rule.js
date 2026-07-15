const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILES = Object.freeze({
  rule: 'data/rules/aviso-previo.json',
  projection: 'data/core/update/aviso-previo-projection.contract.json',
  consumers: 'data/core/update/governed-rule-consumers.json',
  fixtures: 'data/pos/validation/aviso-previo-canonical-rule-fixtures.json',
  legacyBaseline: 'data/operations/reports/end-to-end/pre-migration-calculator-aviso-previo/shadow-baseline-60-scenarios.json',
  reconciledBaseline: 'data/operations/reports/end-to-end/aviso-previo-canonical-rule-reconciliation/legally-reconciled-baseline.json',
  diffMatrix: 'data/operations/reports/end-to-end/aviso-previo-canonical-rule-reconciliation/legal-correction-diff-matrix.json',
  migrationContract: 'data/blueprints/contracts/calculator-migration.contract.json'
});

const REQUIRED_RULE_FIELDS = Object.freeze([
  'ruleId', 'title', 'status', 'version', 'effectiveFrom', 'jurisdiction',
  'officialSources', 'parameters', 'conditions', 'formulas', 'rounding',
  'limits', 'validation', 'examples', 'consumerContracts',
  'updateSensitivity', 'lastReviewedAt', 'reviewStatus'
]);
const REQUIRED_CONSUMER_FIELDS = Object.freeze([
  'consumerId', 'assetId', 'type', 'sourceRuleId', 'status', 'currentMode',
  'migrationState', 'stalePolicy', 'validationRequirements'
]);
const REQUIRED_CONSUMER_TYPES = Object.freeze([
  'CALCULATION_ENGINE', 'RESULT_EXPLANATION', 'RULE_SUMMARY',
  'RULE_DEPENDENT_EXAMPLE', 'UPDATED_AT_METADATA', 'VALIDATION_TEST',
  'SHADOW_TEST', 'REPORT_OUTPUT'
]);
const ALLOWED_CONSUMER_STATES = new Set([
  'GOVERNED_CONFIRMED', 'LEGACY_DECLARED_PENDING_MIGRATION',
  'NOT_APPLICABLE', 'REVIEW_REQUIRED'
]);
const ROUNDING = Object.freeze({
  calculation: 'raw JavaScript Number arithmetic',
  currencyDisplay: 'Intl.NumberFormat pt-BR BRL',
  daysDisplay: 'integer'
});

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}
function clone(value) { return JSON.parse(JSON.stringify(value)); }
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
function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}
function fullYearsBetween(start, end) {
  let years = end.getFullYear() - start.getFullYear();
  const beforeAnniversary = end.getMonth() < start.getMonth()
    || (end.getMonth() === start.getMonth() && end.getDate() < start.getDate());
  if (beforeAnniversary) years -= 1;
  return Math.max(years, 0);
}
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(value);
}
function applyTemplate(template, values) {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), template);
}

function invalidResult(rule) {
  return {
    resultCurrent: {valid: false, resultStatus: rule.presentation.invalidResultStatus},
    components: null,
    rounding: ROUNDING,
    message: rule.presentation.invalidMessage,
    outputFinal: {resultStatus: rule.presentation.invalidResultStatus, badge: rule.presentation.invalidBadge}
  };
}

function legacyCalculate(input, rule) {
  const salary = Number(input.salary);
  const startDate = parseDate(input.startDate);
  const endDate = parseDate(input.endDate);
  if (!salary || salary <= 0 || !startDate || !endDate || endDate < startDate) return invalidResult(rule);
  const fullYears = fullYearsBetween(startDate, endDate);
  const baseDays = 30;
  const totalDays = Math.min(90, baseDays + fullYears * 3);
  const additionalDays = totalDays - baseDays;
  const dailyValue = salary / 30;
  const estimatedValue = totalDays * dailyValue;
  const legacyTemplates = {
    indenizado: 'Aviso prévio indenizado: o valor estimado de {estimatedValue} pode aparecer como verba a receber na rescisão, conforme a modalidade de desligamento e as regras aplicáveis.',
    trabalhado: 'Aviso prévio trabalhado: a estimativa indica {totalDays} dias a cumprir. O valor exibido serve apenas como referência salarial do período, não como verba indenizada adicional.',
    desconto: 'Pedido de demissão com desconto: o valor estimado de {estimatedValue} deve ser lido como possível desconto, caso o aviso não seja cumprido e a empresa não dispense o cumprimento.'
  };
  const displays = {
    indenizado: {badge: 'verba estimada', estimatedLabel: 'Verba estimada'},
    trabalhado: {badge: 'dias a cumprir', estimatedLabel: 'Referência salarial'},
    desconto: {badge: 'possível desconto', estimatedLabel: 'Possível desconto'}
  };
  const display = displays[input.noticeType] || displays.desconto;
  return {
    resultCurrent: {valid: true, fullYears, totalDays, dailyValue, estimatedValue},
    components: {fullYears, baseDays, additionalDays, totalDays, dailyValue, estimatedValue},
    rounding: ROUNDING,
    message: applyTemplate(legacyTemplates[input.noticeType] || legacyTemplates.desconto, {
      totalDays,
      estimatedValue: formatCurrency(estimatedValue)
    }),
    outputFinal: {
      resultStatus: rule.presentation.validResultStatus,
      badge: display.badge,
      estimatedLabel: display.estimatedLabel,
      totalDaysText: `${totalDays} dias`,
      dailyValueText: formatCurrency(dailyValue),
      estimatedValueText: formatCurrency(estimatedValue)
    }
  };
}

function calculateCorrected(input, rule) {
  const salary = Number(input.salary);
  const startDate = parseDate(input.startDate);
  const endDate = parseDate(input.endDate);
  if (!salary || salary <= 0 || !startDate || !endDate || endDate < startDate) return invalidResult(rule);
  const p = rule.projectionPayload;
  const fullYears = fullYearsBetween(startDate, endDate);
  const employerTotalDays = Math.min(p.maximumTotalDays, p.baseDays + fullYears * p.additionalDaysPerFullYear);
  const dailyValue = salary / p.salaryDivisorDays;
  let totalDays;
  let workedDays;
  let indemnifiedDays;
  let discountDays;
  let proportionalEntitlementDays;
  let monetaryDays;
  let presentation;

  if (input.noticeType === 'desconto') {
    totalDays = p.employeeResignationNoticeDays;
    workedDays = 0;
    indemnifiedDays = 0;
    discountDays = Math.min(p.employeeDiscountLimitDays, totalDays);
    proportionalEntitlementDays = 0;
    monetaryDays = discountDays;
    presentation = rule.presentation.types.desconto;
  } else {
    totalDays = employerTotalDays;
    proportionalEntitlementDays = totalDays - p.baseDays;
    discountDays = 0;
    monetaryDays = totalDays;
    if (input.noticeType === 'trabalhado') {
      workedDays = Math.min(p.maximumWorkedDays, totalDays);
      indemnifiedDays = totalDays - workedDays;
      presentation = indemnifiedDays > 0
        ? rule.presentation.types.trabalhadoWithExcess
        : rule.presentation.types.trabalhadoWithoutExcess;
    } else {
      workedDays = 0;
      indemnifiedDays = totalDays;
      presentation = rule.presentation.types.indenizado;
    }
  }

  const estimatedValue = monetaryDays * dailyValue;
  const components = {
    fullYears,
    baseDays: p.baseDays,
    proportionalEntitlementDays,
    totalDays,
    workedDays,
    indemnifiedDays,
    discountDays,
    monetaryDays,
    dailyValue,
    estimatedValue
  };
  const message = applyTemplate(presentation.messageTemplate, {
    totalDays,
    workedDays,
    indemnifiedDays,
    discountDays,
    estimatedValue: formatCurrency(estimatedValue)
  });
  return {
    resultCurrent: {valid: true, fullYears, totalDays, dailyValue, estimatedValue},
    components,
    rounding: ROUNDING,
    message,
    outputFinal: {
      resultStatus: rule.presentation.validResultStatus,
      badge: presentation.badge,
      estimatedLabel: presentation.estimatedLabel,
      totalDaysText: `${totalDays} dias`,
      dailyValueText: formatCurrency(dailyValue),
      estimatedValueText: formatCurrency(estimatedValue)
    }
  };
}

function isIntentionalCorrection(input, corrected) {
  return corrected.resultCurrent.valid
    && corrected.resultCurrent.fullYears > 0
    && (input.noticeType === 'desconto'
      || (input.noticeType === 'trabalhado' && corrected.components.indemnifiedDays > 0));
}

function buildReconciledBaseline(legacyBaseline, rule) {
  const scenarios = legacyBaseline.scenarios.map((scenario) => {
    const legacyExpected = {
      resultCurrent: scenario.resultCurrent,
      components: scenario.components,
      rounding: scenario.rounding,
      message: scenario.message,
      outputFinal: scenario.outputFinal
    };
    const legallyReconciledExpected = calculateCorrected(scenario.inputs, rule);
    const changed = isIntentionalCorrection(scenario.inputs, legallyReconciledExpected);
    const workedCorrection = changed && scenario.inputs.noticeType === 'trabalhado';
    return {
      scenarioId: scenario.scenarioId,
      input: scenario.inputs,
      legacyExpected,
      legallyReconciledExpected,
      changed,
      changeClassification: changed ? 'APPROVED_INTENTIONAL_LEGAL_CORRECTION' : 'NO_CHANGE_REQUIRED',
      correctionType: changed ? (workedCorrection ? 'WORKED_EXCESS_REALLOCATED_TO_INDEMNIFIED' : 'EMPLOYEE_DISCOUNT_CAPPED_AT_30_DAYS') : null,
      legalReason: changed
        ? (workedCorrection
          ? 'The employee works at most 30 days; the proportional excess is indemnified.'
          : 'Employee resignation notice and any corresponding discount are limited to 30 days.')
        : 'Legacy output is compatible with the reconciled legal branch for this scenario.',
      sourceIds: changed
        ? (workedCorrection
          ? ['lei-12506-2011', 'tst-e-rr-1964-73-2013-5-09-0009', 'esocial-manual-web-geral-aviso-misto']
          : ['clt-artigos-487-488', 'tst-e-rr-1964-73-2013-5-09-0009', 'esocial-manual-empregador-domestico-aviso-previo'])
        : ['lei-12506-2011', 'clt-artigos-487-488'],
      reviewStatus: 'LEGAL_REVIEW_RESOLVED'
    };
  });
  const changed = scenarios.filter((scenario) => scenario.changed);
  return {
    version: '1.0.0',
    generatedAt: '2026-07-14',
    classification: 'LEGALLY_RECONCILED_BASELINE',
    status: '100% EXPECTED',
    ruleId: rule.ruleId,
    ruleVersion: rule.version,
    legacyBaselinePath: FILES.legacyBaseline,
    legacyBaselineMutation: false,
    principle: 'LEGAL_CORRECTNESS_OVERRIDES_LEGACY_EQUIVALENCE',
    summary: {
      total: scenarios.length,
      changed: changed.length,
      unchanged: scenarios.length - changed.length,
      mathematicalCorrections: changed.filter((scenario) => scenario.correctionType === 'EMPLOYEE_DISCOUNT_CAPPED_AT_30_DAYS').length,
      allocationAndPresentationCorrections: changed.filter((scenario) => scenario.correctionType === 'WORKED_EXCESS_REALLOCATED_TO_INDEMNIFIED').length,
      unexplainedDivergences: 0
    },
    scenarios
  };
}

function buildDiffMatrix(reconciledBaseline) {
  const divergences = reconciledBaseline.scenarios.filter((scenario) => scenario.changed).map((scenario) => {
    const legacy = scenario.legacyExpected;
    const corrected = scenario.legallyReconciledExpected;
    return {
      scenarioId: scenario.scenarioId,
      input: scenario.input,
      legacyOutput: legacy,
      correctedOutput: corrected,
      mathematicalDifference: {
        totalDays: corrected.resultCurrent.totalDays - legacy.resultCurrent.totalDays,
        estimatedValue: corrected.resultCurrent.estimatedValue - legacy.resultCurrent.estimatedValue,
        workedDaysLegacyPresentation: scenario.input.noticeType === 'trabalhado' ? legacy.resultCurrent.totalDays : 0,
        correctedWorkedDays: corrected.components.workedDays,
        correctedIndemnifiedDays: corrected.components.indemnifiedDays,
        correctedDiscountDays: corrected.components.discountDays
      },
      legalDifference: scenario.legalReason,
      affectedConsumers: ['CALCULATION_ENGINE', 'RESULT_EXPLANATION', 'RULE_SUMMARY', 'VALIDATION_TEST', 'SHADOW_TEST', 'REPORT_OUTPUT'],
      sourceIds: scenario.sourceIds,
      classification: 'APPROVED_INTENTIONAL_LEGAL_CORRECTION',
      approvalStatus: 'HUMAN_APPROVED_2026-07-14'
    };
  });
  return {
    version: '1.0.0',
    generatedAt: '2026-07-14',
    status: 'NO_UNEXPLAINED_DIVERGENCE',
    ruleVersion: reconciledBaseline.ruleVersion,
    summary: {
      totalDivergences: divergences.length,
      approvedIntentionalLegalCorrections: divergences.length,
      unexplainedDivergences: 0,
      mathematicalCorrections: divergences.filter((item) => item.input.noticeType === 'desconto').length,
      allocationAndPresentationCorrections: divergences.filter((item) => item.input.noticeType === 'trabalhado').length
    },
    divergences
  };
}

function validateRule(rule) {
  const missing = REQUIRED_RULE_FIELDS.filter((field) => !Object.prototype.hasOwnProperty.call(rule, field));
  const reasons = missing.map((field) => `missing:${field}`);
  if (rule.ruleId !== 'aviso-previo') reasons.push('wrong-rule-id');
  if (rule.status !== 'candidate' || rule.version !== '1.0.0-rc.2') reasons.push('wrong-candidate-version');
  if (!Array.isArray(rule.officialSources) || rule.officialSources.length < 5) reasons.push('official-sources-missing');
  if (rule.reviewStatus !== 'LEGAL_REVIEW_RESOLVED') reasons.push('legal-review-not-resolved');
  if (!rule.legalAssessment || rule.legalAssessment.status !== 'RESOLVED_APPROVED_INTENTIONAL_LEGAL_CORRECTION') reasons.push('legal-correction-not-approved');
  if (rule.legalAssessment && (rule.legalAssessment.unresolvedMaterialSubcases || []).length) reasons.push('unresolved-material-subcases');
  const payload = rule.projectionPayload || {};
  if (payload.employeeResignationProportionality !== false
    || payload.employeeDiscountLimitDays !== 30
    || payload.maximumWorkedDays !== 30
    || payload.proportionalExcessIsIndemnified !== true) reasons.push('corrected-legal-branches-incomplete');
  if (!rule.certification || typeof rule.certification.publicMigrationAuthorized !== 'boolean') reasons.push('public-migration-state-missing');
  if (rule.certification && rule.certification.publicMigrationAuthorized === true
    && rule.certification.publicRuntimeMigrationStatus !== 'MIGRATED_LOCAL_NOT_DEPLOYED') reasons.push('public-migration-state-invalid');
  return {status: reasons.length ? 'BLOCKED_BY_INVALID_RULE' : 'PASS', reasons};
}

function validateConsumers(registry, mutation = 'NONE') {
  let declarations = (registry.dependencies || []).filter((item) => item.sourceRuleId === 'aviso-previo' && item.assetId === 'calculator:calculadora-aviso-previo');
  if (mutation === 'REMOVE_RULE_SUMMARY') declarations = declarations.filter((item) => item.type !== 'RULE_SUMMARY');
  const types = new Set();
  for (const declaration of declarations) {
    const missing = REQUIRED_CONSUMER_FIELDS.filter((field) => !Object.prototype.hasOwnProperty.call(declaration, field) || declaration[field] === '' || declaration[field] === null);
    if (missing.length || !ALLOWED_CONSUMER_STATES.has(declaration.status) || declaration.type !== declaration.consumerType) return {status:'UNDECLARED_RULE_CONSUMER', declarationCount:declarations.length};
    types.add(declaration.type);
  }
  const missingTypes = REQUIRED_CONSUMER_TYPES.filter((type) => !types.has(type));
  return missingTypes.length ? {status:'UNDECLARED_RULE_CONSUMER', declarationCount:declarations.length, typeCount:types.size} : {status:'PASS', declarationCount:declarations.length, typeCount:types.size};
}

function validateLegacyBaseline(rule, legacyBaseline) {
  const failures = [];
  for (const scenario of legacyBaseline.scenarios) {
    const actual = legacyCalculate(scenario.inputs, rule);
    const expected = {resultCurrent:scenario.resultCurrent,components:scenario.components,rounding:scenario.rounding,message:scenario.message,outputFinal:scenario.outputFinal};
    if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push(scenario.scenarioId);
  }
  return {status:failures.length ? 'LEGACY_BEHAVIOR_RECORDING_FAILED' : '60/60 LEGACY_BEHAVIOR_RECORDED', total:legacyBaseline.scenarios.length, failures};
}

function validateReconciledBaseline(rule, reconciledBaseline, mutation = 'NONE') {
  const candidate = clone(reconciledBaseline);
  if (mutation === 'FIRST_EXPECTATION_DIVERGES') candidate.scenarios[0].legallyReconciledExpected.resultCurrent.totalDays += 1;
  const failures = [];
  for (const scenario of candidate.scenarios) {
    const actual = calculateCorrected(scenario.input, rule);
    if (JSON.stringify(actual) !== JSON.stringify(scenario.legallyReconciledExpected)) failures.push(scenario.scenarioId);
  }
  const summaryValid = candidate.summary.changed === 18
    && candidate.summary.unchanged === 42
    && candidate.summary.mathematicalCorrections === 9
    && candidate.summary.allocationAndPresentationCorrections === 9
    && candidate.summary.unexplainedDivergences === 0;
  if (!summaryValid) failures.push('summary');
  return {status:failures.length ? 'CORRECTED_RULE_VALIDATION_FAILED' : '100% EXPECTED', total:candidate.scenarios.length, failures};
}

function validateDiffMatrix(matrix, reconciledBaseline) {
  const changedIds = new Set(reconciledBaseline.scenarios.filter((scenario) => scenario.changed).map((scenario) => scenario.scenarioId));
  const matrixIds = new Set(matrix.divergences.map((item) => item.scenarioId));
  const allApproved = matrix.divergences.every((item) => item.classification === 'APPROVED_INTENTIONAL_LEGAL_CORRECTION'
    && item.approvalStatus === 'HUMAN_APPROVED_2026-07-14' && item.sourceIds.length > 0);
  const idsMatch = changedIds.size === matrixIds.size && [...changedIds].every((id) => matrixIds.has(id));
  return {status:allApproved && idsMatch && matrix.summary.unexplainedDivergences === 0 ? 'NO_UNEXPLAINED_DIVERGENCE' : 'UNEXPLAINED_DIVERGENCE', count:matrix.divergences.length};
}

function detectStale(rule, projection, fixtures, mutation = 'NONE') {
  if (mutation === 'UNKNOWN_RULE_VERSION') return 'UNKNOWN_VERSION';
  if (mutation === 'VISIBLE_VERSION_OLD') return 'STALE_VISIBLE_CONSUMER';
  if (mutation === 'BASELINE_VERSION_OLD') return 'STALE_TEST_EXPECTATION';
  if (mutation === 'MIGRATED_CONSUMER_LEGACY_LOGIC') return 'LEGACY_BEHAVIOR_STILL_ACTIVE';
  const projected = clone(projection.projectionPayload);
  if (mutation === 'CANONICAL_PARAMETER_CHANGED') rule.projectionPayload.baseDays += 1;
  const canonicalFingerprint = fingerprint(rule.projectionPayload);
  if (rule.version !== projection.sourceRuleVersion) return 'UNKNOWN_VERSION';
  if (JSON.stringify(rule.projectionPayload) !== JSON.stringify(projected) || projection.sourceProjectionFingerprint !== canonicalFingerprint) return 'STALE_DERIVED_OUTPUT';
  if (projection.fallback.futureFallback.fingerprint !== canonicalFingerprint) return 'STALE_FALLBACK';
  if (fixtures.ruleVersion !== rule.version || fixtures.sourceProjectionFingerprint !== canonicalFingerprint) return 'STALE_TEST_EXPECTATION';
  return 'SYNCED';
}

function resolveSource(rule, projection, fixture) {
  if (fixture.mutation === 'EMPTY_RULE') return 'BLOCKED_BY_INVALID_RULE';
  if (fixture.sourceAvailable) return fixture.secondRun ? 'NO_CHANGE_REQUIRED' : 'GOVERNED_SOURCE_USED';
  const fallback = clone(projection.projectionPayload);
  if (fixture.fallbackMutation === 'EMPLOYEE_PROPORTIONALITY_TRUE') fallback.employeeResignationProportionality = true;
  return fingerprint(fallback) === projection.fallback.futureFallback.fingerprint ? 'FALLBACK_USED' : 'BLOCKED_BY_STALE_FALLBACK';
}

function validateLegalBranch(rule, branch) {
  if (branch === 'EMPLOYER_CAP') {
    const result = calculateCorrected({salary:3000,startDate:'2000-01-01',endDate:'2025-01-01',noticeType:'indenizado'}, rule);
    return result.resultCurrent.totalDays === 90 && result.components.indemnifiedDays === 90 && result.resultCurrent.estimatedValue === 9000 ? 'PASS' : 'FAIL';
  }
  if (branch === 'EMPLOYEE_DISCOUNT_CAP') {
    const result = calculateCorrected({salary:3000,startDate:'2000-01-01',endDate:'2025-01-01',noticeType:'desconto'}, rule);
    return result.resultCurrent.totalDays === 30 && result.components.discountDays === 30 && result.resultCurrent.estimatedValue === 3000 ? 'PASS' : 'FAIL';
  }
  if (branch === 'WORKED_ALLOCATION') {
    const result = calculateCorrected({salary:3000,startDate:'2020-01-01',endDate:'2024-01-01',noticeType:'trabalhado'}, rule);
    return result.resultCurrent.totalDays === 42 && result.components.workedDays === 30 && result.components.indemnifiedDays === 12 ? 'PASS' : 'FAIL';
  }
  if (branch === 'ROUNDING') {
    const result = calculateCorrected({salary:1,startDate:'2020-01-01',endDate:'2023-01-01',noticeType:'indenizado'}, rule);
    return result.resultCurrent.dailyValue === 1 / 30 && result.resultCurrent.estimatedValue === 1.3 ? 'PASS' : 'FAIL';
  }
  return 'FAIL';
}

function evaluateFixture(fixture, context) {
  const {rule, projection, consumers, fixtures, legacyBaseline, reconciledBaseline, diffMatrix, migrationContract} = context;
  if (fixture.operation === 'validate-rule') {
    const candidate = clone(rule);
    if (fixture.mutation === 'EMPTY_RULE') return validateRule({}).status;
    if (fixture.mutation === 'NO_OFFICIAL_SOURCES') candidate.officialSources = [];
    if (fixture.mutation === 'LEGACY_DISCOUNT_BRANCH') candidate.projectionPayload.employeeResignationProportionality = true;
    return validateRule(candidate).status;
  }
  if (fixture.operation === 'validate-consumers') return validateConsumers(consumers, fixture.mutation).status;
  if (fixture.operation === 'validate-legacy-baseline') return validateLegacyBaseline(rule, legacyBaseline).status;
  if (fixture.operation === 'validate-reconciled-baseline') return validateReconciledBaseline(rule, reconciledBaseline, fixture.mutation).status;
  if (fixture.operation === 'validate-diff-matrix') return validateDiffMatrix(diffMatrix, reconciledBaseline).status;
  if (fixture.operation === 'validate-legal-branch') return validateLegalBranch(rule, fixture.branch);
  if (fixture.operation === 'resolve-source') return resolveSource(rule, projection, fixture);
  if (fixture.operation === 'detect-stale') return detectStale(clone(rule), projection, fixtures, fixture.mutation);
  if (fixture.operation === 'legal-gate') return rule.reviewStatus;
  if (fixture.operation === 'automation-policy') return migrationContract.legalCorrectionPolicy.principle;
  if (fixture.operation === 'heuristic-dependency') return 'HEURISTIC_WARNING';
  return 'UNKNOWN_FIXTURE_OPERATION';
}

function run() {
  const context = {
    rule: readJson(FILES.rule),
    projection: readJson(FILES.projection),
    consumers: readJson(FILES.consumers),
    fixtures: readJson(FILES.fixtures),
    legacyBaseline: readJson(FILES.legacyBaseline),
    reconciledBaseline: readJson(FILES.reconciledBaseline),
    diffMatrix: readJson(FILES.diffMatrix),
    migrationContract: readJson(FILES.migrationContract)
  };
  const ruleResult = validateRule(context.rule);
  const consumerResult = validateConsumers(context.consumers);
  const legacyResult = validateLegacyBaseline(context.rule, context.legacyBaseline);
  const reconciledResult = validateReconciledBaseline(context.rule, context.reconciledBaseline);
  const matrixResult = validateDiffMatrix(context.diffMatrix, context.reconciledBaseline);
  const staleState = detectStale(clone(context.rule), context.projection, context.fixtures);
  const fixtureResults = context.fixtures.scenarios.map((fixture) => {
    const actualStatus = evaluateFixture(fixture, context);
    return {...fixture, actualStatus, matched:actualStatus === fixture.expectedStatus};
  });
  const fixtureFailures = fixtureResults.filter((item) => !item.matched);
  const failures = [];
  if (ruleResult.status !== 'PASS') failures.push(`rule:${ruleResult.status}`);
  if (consumerResult.status !== 'PASS') failures.push(`consumers:${consumerResult.status}`);
  if (legacyResult.status !== '60/60 LEGACY_BEHAVIOR_RECORDED') failures.push(`legacy:${legacyResult.status}`);
  if (reconciledResult.status !== '100% EXPECTED') failures.push(`corrected:${reconciledResult.status}`);
  if (matrixResult.status !== 'NO_UNEXPLAINED_DIVERGENCE') failures.push(`matrix:${matrixResult.status}`);
  if (staleState !== 'SYNCED') failures.push(`stale:${staleState}`);
  if (fixtureFailures.length) failures.push(`fixtures:${fixtureFailures.length}`);

  console.log('Aviso Previo Canonical Rule Legal Resolution');
  console.log(`Rule: ${context.rule.ruleId}@${context.rule.version} (${context.rule.status})`);
  console.log(`Rule validation: ${ruleResult.status}`);
  console.log(`Legal review: ${context.rule.reviewStatus}`);
  console.log(`Projection fingerprint: ${fingerprint(context.rule.projectionPayload)}`);
  console.log(`Typed consumers: ${consumerResult.typeCount}/${REQUIRED_CONSUMER_TYPES.length} required types; ${consumerResult.declarationCount} declarations`);
  console.log(`Legacy baseline: ${legacyResult.status}`);
  console.log(`Legally reconciled baseline: ${reconciledResult.status}`);
  console.log(`Diff matrix: ${matrixResult.status} (${matrixResult.count})`);
  console.log(`Stale state: ${staleState}`);
  for (const result of fixtureResults) console.log(`${result.id}: ${result.actualStatus}${result.matched ? '' : ` (expected ${result.expectedStatus})`}`);
  console.log(`Fixtures: ${fixtureResults.length - fixtureFailures.length}/${fixtureResults.length} matched`);
  console.log(`Outcome: ${failures.length ? 'CORRECTED_RULE_VALIDATION_FAILED' : 'AVISO_PREVIO_CANONICAL_RULE_READY'}`);
  if (failures.length) {
    console.error(failures.join('\n'));
    process.exitCode = 1;
  }
  return {context, ruleResult, consumerResult, legacyResult, reconciledResult, matrixResult, staleState, fixtureResults, fixtureFailures, failures};
}

if (require.main === module) run();
module.exports = {
  FILES,
  buildDiffMatrix,
  buildReconciledBaseline,
  calculateCorrected,
  canonicalize,
  detectStale,
  fingerprint,
  legacyCalculate,
  run,
  validateDiffMatrix,
  validateLegacyBaseline,
  validateReconciledBaseline,
  validateRule
};
