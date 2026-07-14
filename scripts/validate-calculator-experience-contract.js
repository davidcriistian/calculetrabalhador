const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
const CONTRACT_CONSUMERS = [
  'data/blueprints/calculator/index.json',
  'data/blueprints/contracts/calculator-experience.contract.json',
  'data/gold-standards/calculator/index.json',
  'data/references/calculators/index.json',
  'data/manifests/operations/asset/index.json',
  'data/manifests/operations/end-to-end/index.json',
  'data/operations/workflows/asset/index.json',
  'data/operations/workflows/end-to-end/index.json',
  'data/operations/playbooks/asset/index.json',
  'data/operations/playbooks/end-to-end/index.json',
  'data/operations/checklists/end-to-end/index.json',
  'data/pos/contracts/calculator.contract.json',
  'data/pos/contracts/testing.contract.json',
  'data/pos/contracts/validation.contract.json'
];

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
    checked.push({ source, reference, resolved });
    if (!resolved) unresolved.push({ source, reference });
  };
  files.forEach((file) => visit(readJson(file), file));
  if (unresolved.length) throw new Error(`Unresolved internal references: ${JSON.stringify(unresolved)}`);
  return checked;
}

function validateContract(contract) {
  const required = [
    'calculatorExperienceContractVersion', 'canonicalReference', 'requiredCoreModules',
    'conditionalModules', 'formJourneyContract', 'resultExperienceContract',
    'calculationMemoryContract', 'postResultActionsContract', 'contentDepthContract',
    'resultRecommendationsContract', 'visualSystemContract', 'prohibitedAntiPatterns',
    'validationGates', 'exceptionRules', 'backwardCompatibility'
  ];
  const missing = required.filter((key) => contract[key] === undefined);
  if (missing.length) throw new Error(`Contract missing keys: ${missing.join(', ')}`);
  if (contract.calculatorExperienceContractVersion !== '1.0.0') throw new Error('Unexpected contract version.');
  if (contract.requiredCoreModules.length < 8) throw new Error('Required core module floor is incomplete.');
  if (contract.prohibitedAntiPatterns.length < 17) throw new Error('Anti-pattern contract is incomplete.');
  if (!contract.canonicalReference.requiredStudyBeforeGeneration) throw new Error('Reference study is not mandatory.');
  if (contract.visualSystemContract.notExecutedCannotBecome !== 'FULL_STANDARD_ACCEPTED') throw new Error('False visual pass guard missing.');
}

function evaluateScenario(scenario) {
  const failures = [];
  if (!scenario.referenceStudyComplete) failures.push('REFERENCE_STUDY_COMPLETE');
  if (!scenario.entry.heroComplete || !scenario.entry.outputPreview || !scenario.entry.dominantCta) failures.push('ENTRY_EXPERIENCE');

  const form = scenario.form;
  const complex = form.class !== 'SIMPLE_SINGLE_STEP';
  if (complex && (!form.journeyAdequate || !form.stepContext)) failures.push('FORM_JOURNEY');
  if (form.class === 'SIMPLE_SINGLE_STEP' && (form.semanticGroupCount > 1 || form.essentialInputCount > 3)) failures.push('FORM_CLASSIFICATION');
  if (form.class === 'GUIDED_MULTI_STEP' && form.essentialInputCount < 8 && form.semanticGroupCount < 4) failures.push('FORM_CLASSIFICATION');

  const reportClass = ['CALCULATION_REPORT', 'DECISION_REPORT', 'COMPARATIVE_REPORT'].includes(scenario.result.class);
  if (reportClass && (scenario.result.onlyNumbers || !scenario.result.interpretation || !scenario.result.nextSteps)) failures.push('RESULT_CONTRACT_RESOLVED');
  if (reportClass && !['STEP_BY_STEP_MEMORY', 'AUDITABLE_MEMORY'].includes(scenario.memory.level)) failures.push('CALCULATION_MEMORY');
  if (reportClass && !scenario.memory.stepByStep) failures.push('CALCULATION_MEMORY');

  if (scenario.visual.status === 'VISUAL_VALIDATION_PASSED' && !scenario.visual.browserExecuted) failures.push('FALSE_VISUAL_PASS');
  if (scenario.visual.status === 'VISUAL_VALIDATION_NOT_EXECUTED') failures.push('VISUAL_VALIDATION_STATUS_RESOLVED');
  if (scenario.visual.status === 'VISUAL_APPROVAL_REQUIRED' && !scenario.visual.manualApprovalResolved) failures.push('VISUAL_APPROVAL_REQUIRED');

  const recommendationRendered = scenario.recommendation.state.startsWith('ELIGIBLE_');
  if (recommendationRendered && !scenario.recommendation.approvedSource) failures.push('UNAPPROVED_RECOMMENDATION');
  return { status: failures.length ? 'FAIL' : 'PASS', failures };
}

function run() {
  const contract = readJson('data/blueprints/contracts/calculator-experience.contract.json');
  const fixtures = readJson('data/pos/validation/calculator-experience-fixtures.json');
  validateContract(contract);
  const references = validateInternalReferences();
  const results = fixtures.scenarios.map((scenario) => ({ id: scenario.id, expected: scenario.expected, ...evaluateScenario(scenario) }));
  const mismatches = results.filter((result) => result.status !== result.expected);
  console.log(`Calculator Experience Contract ${contract.calculatorExperienceContractVersion}`);
  results.forEach((result) => console.log(`${result.id}: ${result.status}${result.failures.length ? ` [${result.failures.join(', ')}]` : ''}`));
  console.log(`Scenarios: ${results.length}; matched: ${results.length - mismatches.length}; mismatches: ${mismatches.length}`);
  console.log(`Internal references: ${references.length}; unresolved: 0`);
  if (mismatches.length) process.exitCode = 1;
  return { contract, results, mismatches };
}

if (require.main === module) run();
module.exports = { validateContract, validateInternalReferences, evaluateScenario, run };
