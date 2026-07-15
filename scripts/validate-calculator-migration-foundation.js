const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILES = Object.freeze({
  migrationContract: 'data/blueprints/contracts/calculator-migration.contract.json',
  propagationContract: 'data/core/update/governed-propagation.contract.json',
  typedConsumers: 'data/core/update/governed-rule-consumers.json',
  sensitivity: 'data/core/update/calculator-legal-sensitivity.json',
  fixtures: 'data/pos/validation/calculator-migration-foundation-fixtures.json'
});

const REQUIRED_PRINCIPLES = Object.freeze([
  'PRESERVE_EXISTING_SEO',
  'PRESERVE_EXISTING_EDITORIAL_CONTENT',
  'PRESERVE_EXISTING_INTERNAL_LINKS',
  'PRESERVE_EXISTING_URL',
  'PRESERVE_EXISTING_CANONICAL',
  'PRESERVE_VALID_SCHEMA',
  'PRESERVE_STATIC_VALID_INFORMATION',
  'PRESERVE_CALCULATION_BEHAVIOR_UNTIL_BASELINE_PROVES_CHANGE',
  'LEGAL_CORRECTNESS_OVERRIDES_LEGACY_EQUIVALENCE',
  'MIGRATE_CALCULATOR_EXPERIENCE',
  'MIGRATE_RESULT_EXPERIENCE',
  'CONNECT_LEGAL_DEPENDENCIES_WHEN_REQUIRED',
  'DO_NOT_CONNECT_NON_LEGAL_CALCULATORS_UNNECESSARILY'
]);

const REQUIRED_CONSUMER_TYPES = Object.freeze([
  'CALCULATION_ENGINE',
  'VISIBLE_TABLE',
  'VISIBLE_RULE_CARD',
  'RESULT_EXPLANATION',
  'RULE_SUMMARY',
  'RULE_DEPENDENT_EXAMPLE',
  'UPDATED_AT_METADATA',
  'VALIDATION_TEST',
  'SHADOW_TEST',
  'REPORT_OUTPUT'
]);

const REQUIRED_ANTI_PATTERNS = Object.freeze([
  'EDITORIAL_REWRITE_DURING_TECHNICAL_MIGRATION',
  'SEO_REWRITE_WITHOUT_EXPLICIT_SCOPE',
  'INTERNAL_LINK_LOSS',
  'CANONICAL_CHANGE_WITHOUT_EXPLICIT_SCOPE',
  'URL_CHANGE_WITHOUT_EXPLICIT_SCOPE',
  'CALCULATION_CHANGE_WITHOUT_BASELINE',
  'LEGAL_RULE_HARDCODE_REINTRODUCTION',
  'GOVERNED_ENGINE_WITH_STALE_VISIBLE_RULE',
  'VISIBLE_TABLE_WITHOUT_DECLARED_RULE_DEPENDENCY',
  'RULE_DEPENDENT_EXAMPLE_MARKED_AS_EVERGREEN',
  'UNDECLARED_RULE_CONSUMER',
  'HEURISTIC_DEPENDENCY_TREATED_AS_GOVERNED',
  'NON_LEGAL_CALCULATOR_FORCED_INTO_LEGAL_UPDATE_SYSTEM',
  'MIGRATION_WITHOUT_REGRESSION_BASELINE',
  'SPECIALIZED_EXCEPTION_AUTO_MIGRATED',
  'PUBLIC_MUTATION_DURING_FOUNDATION_PHASE'
]);

const REQUIRED_DECLARATION_FIELDS = Object.freeze([
  'ruleId',
  'sourcePath',
  'transformedDataPath',
  'consumerId',
  'consumerType',
  'consumerPath',
  'confirmationStatus',
  'evidence'
]);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function deepMerge(base, override) {
  if (Array.isArray(override)) return [...override];
  if (!override || typeof override !== 'object') return override === undefined ? base : override;
  const output = {...(base && typeof base === 'object' ? base : {})};
  for (const [key, value] of Object.entries(override)) {
    output[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? deepMerge(output[key], value)
      : value;
  }
  return output;
}

function assertSetContains(actual, required, label) {
  const values = new Set(actual || []);
  const missing = required.filter((value) => !values.has(value));
  if (missing.length) throw new Error(`${label} missing: ${missing.join(', ')}`);
}

function validateContracts(migration, propagation) {
  if (migration.version !== '1.0.0') throw new Error('Unexpected conservative migration contract version.');
  if (propagation.version !== '1.0.0') throw new Error('Unexpected governed propagation contract version.');
  assertSetContains(migration.principles, REQUIRED_PRINCIPLES, 'Migration principles');
  assertSetContains(migration.blockingAntiPatterns, REQUIRED_ANTI_PATTERNS, 'Blocking anti-patterns');
  assertSetContains(propagation.consumerTypes, REQUIRED_CONSUMER_TYPES, 'Consumer types');
  const handling = migration.contentTaxonomy
    && migration.contentTaxonomy.RULE_DEPENDENT_EXAMPLE
    && migration.contentTaxonomy.RULE_DEPENDENT_EXAMPLE.allowedHandling;
  assertSetContains(handling, ['DYNAMICALLY_DERIVED', 'REVIEW_REQUIRED_ON_DEPENDENCY_CHANGE'], 'Rule-dependent example handling');
  if (migration.contentTaxonomy.RULE_DEPENDENT_EXAMPLE.evergreenAllowed !== false) {
    throw new Error('Rule-dependent examples must not be evergreen.');
  }
  if (propagation.dependencyDeclaration.textSearchMayConfirmDependency !== false) {
    throw new Error('Text search cannot confirm governed dependencies.');
  }
  if (propagation.singleSourcePolicy.certificationBlocker !== 'GOVERNED_ENGINE_WITH_STALE_VISIBLE_RULE') {
    throw new Error('Single-source blocker is missing.');
  }
  const legalPolicy = migration.legalCorrectionPolicy || {};
  if (legalPolicy.principle !== 'LEGAL_CORRECTNESS_OVERRIDES_LEGACY_EQUIVALENCE'
    || legalPolicy.historicalBaselineIsLegalAuthority !== false
    || legalPolicy.confirmedLegalCorrectionMayDifferFromLegacy !== true
    || legalPolicy.approvedDifferenceClassification !== 'APPROVED_INTENTIONAL_LEGAL_CORRECTION'
    || legalPolicy.publicationBeforeValidation !== 'BLOCKED'
    || legalPolicy.rollbackMayRepublishKnownLegalError !== false) {
    throw new Error('Conservative legal correction policy is incomplete.');
  }
  assertSetContains(legalPolicy.requirements, [
    'OFFICIAL_SOURCE',
    'EXPLICIT_LEGAL_REASON',
    'AUDITABLE_DIFF',
    'HUMAN_APPROVAL_WHEN_REQUIRED',
    'SEPARATE_LEGACY_AND_RECONCILED_BASELINES',
    'NO_SILENT_EXPECTATION_REWRITE',
    'NO_UNEXPLAINED_DIVERGENCE'
  ], 'Legal correction requirements');
}

function validateSensitivityRegistry(registry) {
  const calculators = registry.calculators || [];
  if (calculators.length !== 22) throw new Error(`Expected 22 calculator classifications, received ${calculators.length}.`);
  const ids = calculators.map(({calculatorId}) => calculatorId);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate calculator sensitivity classification.');
  const actual = calculators.reduce((counts, item) => {
    counts[item.class] = (counts[item.class] || 0) + 1;
    return counts;
  }, {});
  for (const [key, expected] of Object.entries(registry.counts || {})) {
    if ((actual[key] || 0) !== expected) throw new Error(`Sensitivity count mismatch for ${key}.`);
  }
  return new Map(calculators.map((item) => [item.calculatorId, item.class]));
}

function validateTypedConsumers(registry, propagation, sensitivityByCalculator) {
  const types = new Set(propagation.consumerTypes);
  const statuses = new Set(propagation.dependencyDeclaration.confirmationStatuses);
  const keys = new Set();
  for (const dependency of registry.dependencies || []) {
    const missing = REQUIRED_DECLARATION_FIELDS.filter((field) => !Object.prototype.hasOwnProperty.call(dependency, field) || dependency[field] === '');
    if (missing.length) throw new Error(`Dependency declaration missing ${missing.join(', ')} for ${dependency.ruleId}.`);
    if (!types.has(dependency.consumerType)) throw new Error(`Unknown consumer type: ${dependency.consumerType}.`);
    if (!statuses.has(dependency.confirmationStatus)) throw new Error(`Unknown confirmation status: ${dependency.confirmationStatus}.`);
    for (const fileField of ['sourcePath', 'transformedDataPath', 'consumerPath']) {
      if (!fs.existsSync(path.join(ROOT, dependency[fileField]))) {
        throw new Error(`Declared ${fileField} does not exist: ${dependency[fileField]}.`);
      }
    }
    const key = [dependency.ruleId, dependency.consumerId, dependency.consumerType].join('|');
    if (keys.has(key)) throw new Error(`Duplicate typed dependency: ${key}.`);
    keys.add(key);
    if (dependency.consumerId.startsWith('calculator:')) {
      const sensitivity = sensitivityByCalculator.get(dependency.consumerId);
      if (!sensitivity) throw new Error(`Consumer has no sensitivity classification: ${dependency.consumerId}.`);
      if (sensitivity === 'NO_CENTRAL_LEGAL_RULE_REQUIRED') {
        throw new Error(`Non-legal calculator has a central rule dependency: ${dependency.consumerId}.`);
      }
    }
    if (dependency.confirmationStatus === 'CONFIRMED_GOVERNED_CONSUMER' && dependency.evidence.includes('heuristic')) {
      throw new Error(`Heuristic evidence cannot confirm dependency: ${key}.`);
    }
  }
  return {declarationCount: keys.size, consumerTypesUsed: [...new Set((registry.dependencies || []).map(({consumerType}) => consumerType))].sort()};
}

function evaluateScenario(scenario) {
  const failures = [];
  const fail = (id) => { if (!failures.includes(id)) failures.push(id); };
  const scope = scenario.explicitScope;
  const preserve = scenario.preservation;

  if (scenario.technicalMigration && !preserve.editorialContent) fail('EDITORIAL_REWRITE_DURING_TECHNICAL_MIGRATION');
  if (!preserve.seo && !scope.seoRewrite) fail('SEO_REWRITE_WITHOUT_EXPLICIT_SCOPE');
  if (!preserve.internalLinks) fail('INTERNAL_LINK_LOSS');
  if (!preserve.canonical && !scope.canonicalChange) fail('CANONICAL_CHANGE_WITHOUT_EXPLICIT_SCOPE');
  if (!preserve.url && !scope.urlChange) fail('URL_CHANGE_WITHOUT_EXPLICIT_SCOPE');
  if (scenario.calculationChanged && scenario.baselineStatus !== 'REGRESSION_BASELINE_READY') fail('CALCULATION_CHANGE_WITHOUT_BASELINE');
  if (scenario.baselineStatus === 'REGRESSION_BASELINE_MISSING') fail('MIGRATION_WITHOUT_REGRESSION_BASELINE');

  const coherence = scenario.ruleCoherence;
  if (coherence.engineGoverned && coherence.visibleRulePresent && !coherence.sameGovernedProjection) {
    fail('GOVERNED_ENGINE_WITH_STALE_VISIBLE_RULE');
  }
  if (coherence.visibleRulePresent && !coherence.visibleDependencyDeclared) {
    fail('VISIBLE_TABLE_WITHOUT_DECLARED_RULE_DEPENDENCY');
  }

  if (scenario.example.type === 'RULE_DEPENDENT_EXAMPLE'
    && !['DYNAMICALLY_DERIVED', 'REVIEW_REQUIRED_ON_DEPENDENCY_CHANGE'].includes(scenario.example.handling)) {
    fail('RULE_DEPENDENT_EXAMPLE_MARKED_AS_EVERGREEN');
  }
  if (scenario.legalScopeClass === 'LEGAL_UPDATE_REQUIRED' && !scenario.dependenciesDeclared) fail('UNDECLARED_RULE_CONSUMER');
  if (scenario.dependencyEvidence === 'HEURISTIC_TEXT_MATCH' && scenario.governedDependencyConfirmed) {
    fail('HEURISTIC_DEPENDENCY_TREATED_AS_GOVERNED');
  }
  if (scenario.legalScopeClass === 'NO_CENTRAL_LEGAL_RULE_REQUIRED' && scenario.centralLegalDependencyForced) {
    fail('NON_LEGAL_CALCULATOR_FORCED_INTO_LEGAL_UPDATE_SYSTEM');
  }
  if (scenario.legalScopeClass === 'SPECIALIZED_REVIEW_REQUIRED'
    && (scenario.specialized.automaticMigration || !scenario.specialized.humanReviewRecorded)) {
    fail('SPECIALIZED_EXCEPTION_AUTO_MIGRATED');
  }
  if (scenario.canonicalDiffPatch.componentAlreadyCompliant && !scenario.canonicalDiffPatch.componentPreserved) {
    fail('CANONICAL_DIFF_PATCH_REPLACED_COMPLIANT_COMPONENT');
  }
  if (scenario.publicMutation) fail('PUBLIC_MUTATION_DURING_FOUNDATION_PHASE');

  const invalidTypes = scenario.consumerTypes.filter((type) => !REQUIRED_CONSUMER_TYPES.includes(type));
  if (invalidTypes.length) fail('UNKNOWN_RULE_CONSUMER_TYPE');

  let checkType = 'DETERMINISTIC_CHECK';
  if (scenario.dependencyEvidence === 'HEURISTIC_TEXT_MATCH') checkType = 'HEURISTIC_WARNING';
  if (scenario.legalScopeClass === 'SPECIALIZED_REVIEW_REQUIRED') checkType = 'HUMAN_REVIEW_REQUIRED';
  return {status: failures.length ? 'FAIL' : 'PASS', failures, checkType};
}

function buildImpactAnalysis(change, registry) {
  const dependencies = (registry.dependencies || []).filter((item) => (
    item.ruleId === change.ruleId && item.confirmationStatus === 'CONFIRMED_GOVERNED_CONSUMER'
  ));
  const byType = (type) => dependencies.filter((item) => item.consumerType === type).map((item) => item.consumerId);
  const unique = (values) => [...new Set(values)].sort();
  const calculators = unique(dependencies.filter((item) => item.consumerId.startsWith('calculator:')).map((item) => item.consumerId));
  const affectedExamples = unique(byType('RULE_DEPENDENT_EXAMPLE'));
  const visible = unique([...byType('VISIBLE_TABLE'), ...byType('VISIBLE_RULE_CARD')]);
  const tests = unique(byType('VALIDATION_TEST'));
  const shadows = unique(byType('SHADOW_TEST'));
  const states = [];
  if (!dependencies.length) states.push('NO_CONSUMER_IMPACT');
  else {
    states.push('DETERMINISTIC_UPDATE_READY', 'TESTS_REQUIRED');
    if (visible.length) states.push('VISUAL_VALIDATION_REQUIRED');
    if (affectedExamples.length || byType('RULE_SUMMARY').length || byType('RESULT_EXPLANATION').length) {
      states.push('EDITORIAL_REVIEW_REQUIRED');
    }
  }
  return {
    changedRule: change.ruleId,
    previousVersion: change.previousVersion,
    newVersion: change.newVersion,
    effectiveDate: change.effectiveDate,
    source: change.source,
    consumerCalculators: calculators,
    affectedEngines: unique(byType('CALCULATION_ENGINE')),
    affectedVisibleTables: unique(byType('VISIBLE_TABLE')),
    affectedVisibleCards: unique(byType('VISIBLE_RULE_CARD')),
    affectedExamples,
    affectedReports: unique(byType('REPORT_OUTPUT')),
    requiredTests: tests,
    requiredShadows: shadows,
    humanReviewRequired: states.some((state) => ['EDITORIAL_REVIEW_REQUIRED', 'LEGAL_REVIEW_REQUIRED', 'BLOCKED_BY_AMBIGUITY'].includes(state)),
    states
  };
}

function run() {
  const migration = readJson(FILES.migrationContract);
  const propagation = readJson(FILES.propagationContract);
  const consumers = readJson(FILES.typedConsumers);
  const sensitivity = readJson(FILES.sensitivity);
  const fixtures = readJson(FILES.fixtures);

  validateContracts(migration, propagation);
  const sensitivityByCalculator = validateSensitivityRegistry(sensitivity);
  const registryResult = validateTypedConsumers(consumers, propagation, sensitivityByCalculator);

  const results = fixtures.scenarios.map((fixture) => {
    const scenario = deepMerge(fixtures.defaults, fixture.overrides || {});
    const evaluated = evaluateScenario(scenario);
    const expectedFailures = fixture.expectedFailures || [];
    const failureMatch = JSON.stringify([...evaluated.failures].sort()) === JSON.stringify([...expectedFailures].sort());
    const checkTypeMatch = evaluated.checkType === fixture.expectedCheckType;
    return {id: fixture.id, expected: fixture.expected, expectedFailures, failureMatch, checkTypeMatch, ...evaluated};
  });
  const mismatches = results.filter((item) => item.status !== item.expected || !item.failureMatch || !item.checkTypeMatch);
  const impact = buildImpactAnalysis(fixtures.impactFixture, consumers);
  const requiredImpactFields = propagation.impactAnalysisContract.requiredOutput;
  const missingImpactFields = requiredImpactFields.filter((field) => !Object.prototype.hasOwnProperty.call(impact, field));
  if (missingImpactFields.length) throw new Error(`Impact analysis missing fields: ${missingImpactFields.join(', ')}.`);

  console.log(`Calculator Conservative Migration Contract ${migration.version}`);
  console.log(`Governed Rule Propagation Contract ${propagation.version}`);
  for (const result of results) {
    const details = result.failures.length ? ` [${result.failures.join(', ')}]` : '';
    const mismatch = result.failureMatch && result.checkTypeMatch ? '' : ' [EXPECTATION_MISMATCH]';
    console.log(`${result.id}: ${result.status} ${result.checkType}${details}${mismatch}`);
  }
  const checkTypeCounts = results.reduce((counts, item) => {
    counts[item.checkType] = (counts[item.checkType] || 0) + 1;
    return counts;
  }, {});
  console.log(`Scenarios: ${results.length}; matched: ${results.length - mismatches.length}; mismatches: ${mismatches.length}`);
  console.log(`Typed dependencies: ${registryResult.declarationCount}; consumer types used: ${registryResult.consumerTypesUsed.join(', ')}`);
  console.log(`Calculator sensitivity classifications: ${sensitivityByCalculator.size}`);
  console.log(`Check types: ${JSON.stringify(checkTypeCounts)}`);
  console.log(`Impact fixture: ${impact.changedRule}; consumers: ${impact.consumerCalculators.length}; states: ${impact.states.join(', ')}`);
  if (mismatches.length) process.exitCode = 1;
  return {migration, propagation, results, mismatches, registryResult, sensitivity, impact, checkTypeCounts};
}

if (require.main === module) run();

module.exports = {
  FILES,
  REQUIRED_ANTI_PATTERNS,
  REQUIRED_CONSUMER_TYPES,
  REQUIRED_PRINCIPLES,
  buildImpactAnalysis,
  deepMerge,
  evaluateScenario,
  run,
  validateContracts,
  validateSensitivityRegistry,
  validateTypedConsumers
};
