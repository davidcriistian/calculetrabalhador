const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
const CONTRACT_CONSUMERS = [
  'data/blueprints/calculator/index.json',
  'data/blueprints/contracts/calculator-experience.contract.json',
  'data/blueprints/contracts/calculator-migration.contract.json',
  'data/blueprints/registry/index.json',
  'data/blueprints/versioning/index.json',
  'data/blueprints/history/index.json',
  'data/gold-standards/calculator/index.json',
  'data/gold-standards/registry/index.json',
  'data/gold-standards/history/index.json',
  'data/references/calculators/index.json',
  'data/references/versioning/index.json',
  'data/manifests/operations/asset/index.json',
  'data/manifests/operations/end-to-end/index.json',
  'data/operations/workflows/asset/index.json',
  'data/operations/workflows/end-to-end/index.json',
  'data/operations/playbooks/asset/index.json',
  'data/operations/playbooks/end-to-end/index.json',
  'data/operations/checklists/end-to-end/index.json',
  'data/pos/contracts/calculator.contract.json',
  'data/pos/contracts/testing.contract.json',
  'data/pos/contracts/validation.contract.json',
  'data/core/update/governed-propagation.contract.json'
];

const REPORT_DECLARATIONS = [
  'REPORT_INPUT_FIELDS',
  'REPORT_PRIMARY_RESULT',
  'REPORT_SECONDARY_RESULTS',
  'REPORT_MEMORY_SECTIONS',
  'REPORT_INTERPRETATION',
  'REPORT_LIMITATIONS',
  'REPORT_OPTIONAL_SECTIONS'
];
const NEW_GATES = [
  'BRAND_THEME_RESOLVED',
  'VISIBLE_UPDATED_AT_RESOLVED',
  'EDITORIAL_DEPTH_RESOLVED',
  'RECOMMENDATION_SLOT_RESOLVED',
  'ADAPTIVE_REPORT_CONTRACT_RESOLVED',
  'REPORT_RENDER_VALIDATED'
];
const REPORT_ANTI_PATTERNS = ['SCREENSHOT_REPORT', 'FULL_PAGE_CAPTURE_REPORT', 'VIEWPORT_DEPENDENT_REPORT', 'RASTER_ONLY_REPORT'];
const EDITORIAL_ANTI_PATTERNS = ['EDITORIAL_CONTENT_TOO_SHORT', 'EDITORIAL_CONTENT_GENERIC', 'EDITORIAL_CONTENT_PADDED'];
const CANONICAL_RECOMMENDATION_STATES = ['NOT_CONFIGURED', 'CONFIGURED_NOT_ELIGIBLE', 'CONFIGURED_ELIGIBLE', 'HIDDEN_BY_POLICY'];

function deepMerge(base, override) {
  if (Array.isArray(override)) return [...override];
  if (!override || typeof override !== 'object') return override === undefined ? base : override;
  const output = {...(base && typeof base === 'object' ? base : {})};
  Object.entries(override).forEach(([key, value]) => {
    output[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? deepMerge(output[key], value)
      : value;
  });
  return output;
}

function validateInternalReferences(files = CONTRACT_CONSUMERS) {
  const unresolved = [];
  const checked = [];
  const visit = (value, source) => {
    if (Array.isArray(value)) return value.forEach((item) => visit(item, source));
    if (value && typeof value === 'object') return Object.values(value).forEach((item) => visit(item, source));
    const isGovernedReference = typeof value === 'string' && (
      value.startsWith('/data/') || value === '/calculadora-multa-40-fgts/index.html'
    );
    if (!isGovernedReference) return;
    const reference = value.split('#')[0];
    const target = path.join(ROOT, reference.replace(/^\/+/, ''));
    const resolved = fs.existsSync(target) || fs.existsSync(path.join(target, 'index.json'));
    checked.push({source, reference, resolved});
    if (!resolved) unresolved.push({source, reference});
  };
  files.forEach((file) => visit(readJson(file), file));
  if (unresolved.length) throw new Error(`Unresolved internal references: ${JSON.stringify(unresolved)}`);
  return checked;
}

function validateContract(contract) {
  const required = [
    'calculatorExperienceContractVersion', 'conservativeMigrationContract', 'canonicalReference', 'brandThemeContract',
    'visibleUpdatedAtContract', 'contentLayerContract', 'editorialDepthContract', 'faqContract',
    'requiredCoreModules', 'conditionalModules', 'formJourneyContract', 'resultExperienceContract',
    'calculationMemoryContract', 'adaptiveReportContract', 'postResultActionsContract',
    'contentDepthContract', 'resultRecommendationsContract', 'visualSystemContract',
    'prohibitedAntiPatterns', 'validationGates', 'exceptionRules', 'backwardCompatibility'
  ];
  const missing = required.filter((key) => contract[key] === undefined);
  if (missing.length) throw new Error(`Contract missing keys: ${missing.join(', ')}`);
  if (contract.calculatorExperienceContractVersion !== '1.2.0') throw new Error('Unexpected contract version.');
  if (contract.conservativeMigrationContract.version !== '1.0.0' || !contract.conservativeMigrationContract.regressionBaselineGateRequired) {
    throw new Error('Conservative migration contract is not active.');
  }
  if (contract.requiredCoreModules.length < 8) throw new Error('Required core module floor is incomplete.');
  if (!contract.canonicalReference.requiredStudyBeforeGeneration) throw new Error('Reference study is not mandatory.');
  if (contract.brandThemeContract.defaultPrimaryTheme !== 'INSTITUTIONAL_BLUE') throw new Error('Institutional blue default is missing.');
  if (contract.visibleUpdatedAtContract.metadataField !== 'UPDATED_AT') throw new Error('Governed UPDATED_AT field is missing.');
  if (contract.editorialDepthContract.minimumWords !== 800 || contract.editorialDepthContract.maximumWords !== 1200) throw new Error('Editorial range is invalid.');
  if (JSON.stringify(contract.resultRecommendationsContract.states) !== JSON.stringify(CANONICAL_RECOMMENDATION_STATES)) throw new Error('Recommendation states are not canonical.');
  if (contract.resultRecommendationsContract.slotId !== 'CANONICAL_RESULT_RECOMMENDATION_SLOT') throw new Error('Canonical recommendation slot is missing.');
  if (JSON.stringify(contract.adaptiveReportContract.requiredDeclarations) !== JSON.stringify(REPORT_DECLARATIONS)) throw new Error('Adaptive report declarations are incomplete.');
  const antiPatterns = new Set(contract.prohibitedAntiPatterns.map(({id}) => id));
  [...REPORT_ANTI_PATTERNS, ...EDITORIAL_ANTI_PATTERNS, 'UNAPPROVED_PRIMARY_THEME'].forEach((id) => {
    if (!antiPatterns.has(id)) throw new Error(`Required anti-pattern missing: ${id}`);
  });
  const gates = new Set(contract.validationGates.map(({id}) => id));
  NEW_GATES.forEach((id) => {
    if (!gates.has(id)) throw new Error(`Required gate missing: ${id}`);
  });
  if (contract.visualSystemContract.notExecutedCannotBecome !== 'FULL_STANDARD_ACCEPTED') throw new Error('False visual pass guard missing.');
}

function evaluateScenario(scenario) {
  const failures = [];
  const fail = (id) => { if (!failures.includes(id)) failures.push(id); };
  if (!scenario.referenceStudyComplete) fail('REFERENCE_STUDY_COMPLETE');
  if (!scenario.entry.heroComplete || !scenario.entry.outputPreview || !scenario.entry.dominantCta) fail('ENTRY_EXPERIENCE');

  const form = scenario.form;
  const complex = form.class !== 'SIMPLE_SINGLE_STEP';
  if (complex && (!form.journeyAdequate || !form.stepContext)) fail('FORM_JOURNEY');
  if (form.class === 'SIMPLE_SINGLE_STEP' && (form.semanticGroupCount > 1 || form.essentialInputCount > 3)) fail('FORM_CLASSIFICATION');
  if (form.class === 'GUIDED_MULTI_STEP' && form.essentialInputCount < 8 && form.semanticGroupCount < 4) fail('FORM_CLASSIFICATION');

  const reportClass = ['CALCULATION_REPORT', 'DECISION_REPORT', 'COMPARATIVE_REPORT'].includes(scenario.result.class);
  if (reportClass && (scenario.result.onlyNumbers || !scenario.result.interpretation || !scenario.result.nextSteps)) fail('RESULT_CONTRACT_RESOLVED');
  if (reportClass && (!['STEP_BY_STEP_MEMORY', 'AUDITABLE_MEMORY'].includes(scenario.memory.level) || !scenario.memory.stepByStep)) fail('CALCULATION_MEMORY');

  if (scenario.visual.status === 'VISUAL_VALIDATION_PASSED' && !scenario.visual.browserExecuted) fail('FALSE_VISUAL_PASS');
  if (scenario.visual.status === 'VISUAL_VALIDATION_NOT_EXECUTED') fail('VISUAL_VALIDATION_STATUS_RESOLVED');
  if (scenario.visual.status === 'VISUAL_APPROVAL_REQUIRED' && !scenario.visual.manualApprovalResolved) fail('VISUAL_APPROVAL_REQUIRED');

  if (scenario.brand.primaryTheme !== 'INSTITUTIONAL_BLUE' && !scenario.brand.approvedVariation) {
    fail('BRAND_THEME_RESOLVED');
    fail('UNAPPROVED_PRIMARY_THEME');
  }

  const updatedAtPattern = /^Atualizado em (janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro) de \d{4}$/;
  if (scenario.metadata.field !== 'UPDATED_AT' || !scenario.metadata.governed || !updatedAtPattern.test(scenario.metadata.visibleText) || !scenario.metadata.matches || scenario.metadata.invented) {
    fail('VISIBLE_UPDATED_AT_RESOLVED');
  }

  if (!scenario.permanentContent.methodologyVisibleBeforeCalculation || !scenario.permanentContent.faqVisibleBeforeCalculation) fail('PERMANENT_CONTENT_LAYER');
  if (scenario.faq.schemaUsed && !scenario.faq.visibleSchemaExactMatch) fail('FAQ_CONTRACT');
  if (scenario.editorial.mainWordCount < 800) {
    fail('EDITORIAL_DEPTH_RESOLVED');
    fail('EDITORIAL_CONTENT_TOO_SHORT');
  }
  if (scenario.editorial.mainWordCount > 1200 || !scenario.editorial.useful) fail('EDITORIAL_DEPTH_RESOLVED');
  if (scenario.editorial.generic) {
    fail('EDITORIAL_DEPTH_RESOLVED');
    fail('EDITORIAL_CONTENT_GENERIC');
  }
  if (scenario.editorial.padded) {
    fail('EDITORIAL_DEPTH_RESOLVED');
    fail('EDITORIAL_CONTENT_PADDED');
  }

  const recommendation = scenario.recommendation;
  const slotValid = recommendation.slotPresent && recommendation.slotPosition === 'after-interpretation-before-calculation-memory';
  const stateValid = CANONICAL_RECOMMENDATION_STATES.includes(recommendation.state);
  const eligibleValid = recommendation.state !== 'CONFIGURED_ELIGIBLE' || (recommendation.configured && recommendation.eligible && recommendation.approvedSource && recommendation.visible && recommendation.productRendered);
  const hiddenState = ['NOT_CONFIGURED', 'CONFIGURED_NOT_ELIGIBLE', 'HIDDEN_BY_POLICY'].includes(recommendation.state);
  const hiddenValid = !hiddenState || (!recommendation.visible && !recommendation.productRendered);
  if (!slotValid || !stateValid || !eligibleValid || !hiddenValid) fail('RECOMMENDATION_SLOT_RESOLVED');
  if (recommendation.productRendered && (!recommendation.configured || !recommendation.eligible || !recommendation.approvedSource)) fail('UNAPPROVED_RECOMMENDATION');

  if (reportClass) {
    const declarationsPresent = REPORT_DECLARATIONS.every((key) => Object.prototype.hasOwnProperty.call(scenario.report.declarations, key));
    const reportStructureValid = declarationsPresent && scenario.report.derivedFromContract && !scenario.report.fixedForeignFields && scenario.report.isolatedDocument && scenario.report.a4 && scenario.report.selectableText;
    if (scenario.report.screenshotBased) fail('SCREENSHOT_REPORT');
    if (scenario.report.fullPageCapture) fail('FULL_PAGE_CAPTURE_REPORT');
    if (scenario.report.viewportDependent) fail('VIEWPORT_DEPENDENT_REPORT');
    if (scenario.report.rasterOnly) fail('RASTER_ONLY_REPORT');
    if (!reportStructureValid || scenario.report.screenshotBased || scenario.report.fullPageCapture || scenario.report.viewportDependent || scenario.report.rasterOnly) fail('ADAPTIVE_REPORT_CONTRACT_RESOLVED');

    const actionsValid = scenario.actions.distinct && scenario.actions.copyFunctional && scenario.actions.printFunctional && scenario.actions.downloadFunctional
      && scenario.actions.copyBehavior === 'short-summary'
      && scenario.actions.printBehavior === 'isolated-adaptive-report'
      && scenario.actions.downloadBehavior === 'approved-adaptive-document'
      && !['txt', 'text', 'png', 'jpg', 'jpeg', 'screenshot'].includes(String(scenario.actions.downloadFormat).toLowerCase());
    if (!actionsValid) fail('REPORT_RENDER_VALIDATED');
  }
  return {status: failures.length ? 'FAIL' : 'PASS', failures};
}

function run() {
  const contract = readJson('data/blueprints/contracts/calculator-experience.contract.json');
  const fixtures = readJson('data/pos/validation/calculator-experience-fixtures.json');
  validateContract(contract);
  const references = validateInternalReferences();
  const results = fixtures.scenarios.map((fixture) => {
    const scenario = deepMerge(fixtures.defaults, fixture.overrides || {});
    const evaluated = evaluateScenario(scenario);
    const expectedFailures = fixture.expectedFailures || [];
    const failureMatch = JSON.stringify([...evaluated.failures].sort()) === JSON.stringify([...expectedFailures].sort());
    return {id: fixture.id, expected: fixture.expected, expectedFailures, failureMatch, ...evaluated};
  });
  const mismatches = results.filter((result) => result.status !== result.expected || !result.failureMatch);
  console.log(`Calculator Experience Contract ${contract.calculatorExperienceContractVersion}`);
  results.forEach((result) => console.log(`${result.id}: ${result.status}${result.failures.length ? ` [${result.failures.join(', ')}]` : ''}${result.failureMatch ? '' : ' [FAILURE_SET_MISMATCH]'}`));
  console.log(`Scenarios: ${results.length}; matched: ${results.length - mismatches.length}; mismatches: ${mismatches.length}`);
  console.log(`Internal references: ${references.length}; unresolved: 0`);
  if (mismatches.length) process.exitCode = 1;
  return {contract, results, mismatches, references};
}

if (require.main === module) run();
module.exports = {validateContract, validateInternalReferences, evaluateScenario, deepMerge, run};
