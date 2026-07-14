const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.resolve(ROOT, relativePath), 'utf8'));
const CONTRACT_PATH = 'data/blueprints/article/editorial-automation.contract.json';
const FIXTURES_PATH = 'data/pos/validation/article-automation-fixtures.json';
const GATES = ['SEARCH_INTENT_RESOLVED', 'EDITORIAL_CLARITY_RESOLVED', 'CONTENT_FRESHNESS_RESOLVED', 'OFFICIAL_SOURCES_RESOLVED', 'CLUSTER_POSITION_RESOLVED', 'INTERNAL_LINK_PLAN_RESOLVED', 'BIDIRECTIONAL_CLUSTER_LINKING_RESOLVED'];
const PANEL_FIELDS = ['contentFreshnessStatus', 'lastReviewedAt', 'nextReviewAt', 'updateSensitivity', 'officialSources', 'affectedRules', 'affectedAssets', 'clusterId', 'pillarAssetId', 'validationStatus', 'publicationStatus'];
const LINK_TYPES = ['CONTEXTUAL_LINK', 'CONTINUITY_LINK', 'DISCOVERY_BLOCK_LINK'];
const GENERIC_ANCHORS = ['clique aqui', 'saiba mais', 'veja aqui'];

function deepMerge(base, override) {
  if (Array.isArray(override)) return [...override];
  if (!override || typeof override !== 'object') return override === undefined ? base : override;
  const output = {...(base && typeof base === 'object' ? base : {})};
  Object.entries(override).forEach(([key, value]) => {
    output[key] = value && typeof value === 'object' && !Array.isArray(value) ? deepMerge(output[key], value) : value;
  });
  return output;
}

function validateContract(contract = readJson(CONTRACT_PATH)) {
  const required = ['principle', 'compatibility', 'searchIntent', 'plainLanguage', 'sectionFlow', 'examples', 'repetitionAndDensity', 'freshness', 'sourceTraceability', 'changeImpact', 'panelMetadata', 'clusterPosition', 'internalLinking', 'anchors', 'validation'];
  const missing = required.filter((key) => contract[key] === undefined);
  if (missing.length) throw new Error(`Article contract missing keys: ${missing.join(', ')}`);
  if (contract.version !== '1.0.0') throw new Error(`Unexpected article contract version: ${contract.version}`);
  if (contract.principle !== 'WRITE_FOR_THE_PERSON_LIVING_THE_PROBLEM') throw new Error('Plain-language principle is missing.');
  if (JSON.stringify(contract.validation.gates) !== JSON.stringify(GATES)) throw new Error('Seven article gates are incomplete or unordered.');
  if (JSON.stringify(contract.panelMetadata.minimumFields) !== JSON.stringify(PANEL_FIELDS)) throw new Error('Panel metadata minimum is incomplete or excessive.');
  if (contract.validation.semanticLimit.indexOf('perfect semantic analysis') === -1) throw new Error('Heuristic semantic limitation is not explicit.');
  return contract;
}

function validateInternalReferences() {
  const files = [
    'data/blueprints/article/index.json', CONTRACT_PATH, 'data/gold-standards/article/index.json',
    'data/references/articles/index.json', 'data/manifests/operations/asset/index.json',
    'data/manifests/operations/end-to-end/index.json', 'data/operations/workflows/asset/index.json',
    'data/operations/workflows/end-to-end/index.json', 'data/operations/playbooks/asset/index.json',
    'data/operations/playbooks/end-to-end/index.json', 'data/operations/checklists/end-to-end/index.json',
    'data/pos/contracts/content.contract.json', 'data/pos/contracts/testing.contract.json',
    'data/pos/contracts/validation.contract.json', 'data/pos/validation/index.json',
    'data/pos/testing/index.json'
  ];
  const unresolved = [];
  let checked = 0;
  const visit = (value, source) => {
    if (Array.isArray(value)) return value.forEach((item) => visit(item, source));
    if (value && typeof value === 'object') return Object.values(value).forEach((item) => visit(item, source));
    if (typeof value !== 'string' || (!value.startsWith('/data/') && !value.startsWith('/scripts/'))) return;
    const reference = value.split('#')[0];
    const target = path.resolve(ROOT, reference.replace(/^\/+/, ''));
    checked += 1;
    if (!fs.existsSync(target) && !fs.existsSync(path.join(target, 'index.json'))) unresolved.push({source, reference});
  };
  files.forEach((file) => visit(readJson(file), file));
  if (unresolved.length) throw new Error(`Unresolved article automation references: ${JSON.stringify(unresolved)}`);
  return {checked, unresolved};
}

function evaluateArticle(article, contract = readJson(CONTRACT_PATH)) {
  if (article.compatibilityClass === 'LEGACY_ARTICLE' && !article.migrationRequested) {
    return {status: 'LEGACY_ACCEPTED_PENDING_MIGRATION', findings: [], gates: Object.fromEntries(GATES.map((gate) => [gate, 'NOT_APPLICABLE_LEGACY'])), checkSummary: {DETERMINISTIC: 1, HEURISTIC: 0, HUMAN_REVIEW_REQUIRED: 1}};
  }

  const findings = [];
  const add = (id, severity, checkType, gate) => {
    if (!findings.some((item) => item.id === id)) findings.push({id, severity, checkType, gate});
  };
  const intent = article.intent || {};
  if (!contract.searchIntent.classes.includes(intent.primarySearchIntent) || !intent.primaryQuestion || !Array.isArray(intent.secondaryQuestions) || !intent.readerActionAfterReading || intent.topicOnly) add('TOPIC_COVERED_BUT_INTENT_NOT_RESOLVED', 'blocker', 'DETERMINISTIC', 'SEARCH_INTENT_RESOLVED');

  const content = article.content || {};
  if (!content.directAnswerNearBeginning) add('PRIMARY_ANSWER_NOT_NEAR_BEGINNING', 'major', 'HUMAN_REVIEW_REQUIRED', 'EDITORIAL_CLARITY_RESOLVED');
  for (const term of content.technicalTerms || []) if (!term.firstOccurrenceExplained) add('UNEXPLAINED_TECHNICAL_TERM', 'blocker', 'DETERMINISTIC', 'EDITORIAL_CLARITY_RESOLVED');
  for (const paragraph of content.paragraphs || []) {
    if ((paragraph.wordCount || 0) > contract.plainLanguage.observableThresholds.denseParagraphWords || (paragraph.mainIdeaCount || 1) > 2) add('DENSE_MULTI_CONCEPT_PARAGRAPH', 'major', 'HEURISTIC', 'EDITORIAL_CLARITY_RESOLVED');
    if ((paragraph.maxSentenceWords || 0) > contract.plainLanguage.observableThresholds.veryLongSentenceWords) add('EXCESSIVELY_LONG_SENTENCE', 'warning', 'HEURISTIC', 'EDITORIAL_CLARITY_RESOLVED');
    if ((paragraph.averageSentenceWords || 0) > contract.plainLanguage.observableThresholds.averageSentenceWarningWords) add('HIGH_AVERAGE_SENTENCE_LENGTH', 'warning', 'HEURISTIC', 'EDITORIAL_CLARITY_RESOLVED');
  }
  if (content.bureaucraticToneDetected) add('BUREAUCRATIC_TONE', 'warning', 'HEURISTIC', 'EDITORIAL_CLARITY_RESOLVED');

  const sections = content.sections || [];
  const dependent = sections.slice(1).filter((section) => section.dependsOnPrevious);
  const disconnected = dependent.filter((section) => !section.transitionFromPrevious || section.transitionFromPrevious.trim().length < 20);
  if (disconnected.length) add('DISCONNECTED_SECTION_SEQUENCE', 'blocker', 'DETERMINISTIC', 'EDITORIAL_CLARITY_RESOLVED');
  if (sections.length >= 10 && dependent.length >= 8 && disconnected.length >= 8) add('H2_STACK_WITHOUT_LOGICAL_FLOW', 'blocker', 'HEURISTIC', 'EDITORIAL_CLARITY_RESOLVED');
  for (const concept of content.concepts || []) {
    if (concept.complex && !concept.exampleType) add('ABSTRACT_CONCEPT_WITHOUT_EXAMPLE', concept.critical ? 'blocker' : 'warning', 'HUMAN_REVIEW_REQUIRED', 'EDITORIAL_CLARITY_RESOLVED');
    if (concept.exampleType && !contract.examples.types.includes(concept.exampleType)) add('INVALID_EXAMPLE_TYPE', 'major', 'DETERMINISTIC', 'EDITORIAL_CLARITY_RESOLVED');
  }
  if ((content.keywordDensity || 0) > contract.repetitionAndDensity.heuristicThresholds.keywordDensityBlocker) add('KEYWORD_REPETITION', 'blocker', 'HEURISTIC', 'EDITORIAL_CLARITY_RESOLVED');
  if ((content.duplicatedConclusionCount || 0) > contract.repetitionAndDensity.heuristicThresholds.duplicatedConclusionCount) add('DUPLICATED_CONCLUSION', 'blocker', 'HEURISTIC', 'EDITORIAL_CLARITY_RESOLVED');
  if ((content.repeatedParagraphRatio || 0) > 0.3 || (content.pedagogicalReinforcement && content.pedagogicalReinforcement.used && !content.pedagogicalReinforcement.addsNewValue)) add('REPETITION_WITHOUT_NEW_VALUE', 'blocker', 'HEURISTIC', 'EDITORIAL_CLARITY_RESOLVED');

  const freshness = article.freshness || {};
  if (!contract.freshness.classes.includes(freshness.updateSensitivity)) add('UPDATE_SENSITIVITY_UNRESOLVED', 'blocker', 'DETERMINISTIC', 'CONTENT_FRESHNESS_RESOLVED');
  if (freshness.updateSensitivity === 'MIXED' && !(freshness.mutableContentSections || []).length) add('MUTABLE_CONTENT_SECTIONS_MISSING', 'blocker', 'DETERMINISTIC', 'CONTENT_FRESHNESS_RESOLVED');
  const sensitive = freshness.updateSensitivity && freshness.updateSensitivity !== 'EVERGREEN';
  if (sensitive && (!freshness.lastReviewedAt || !freshness.nextReviewAt || !freshness.reviewEvidence)) add('FRESHNESS_REVIEW_EVIDENCE_MISSING', 'blocker', 'DETERMINISTIC', 'CONTENT_FRESHNESS_RESOLVED');
  if (freshness.reviewEvidence === false && (freshness.lastReviewedAt || freshness.nextReviewAt)) add('INVENTED_REVIEW_DATE_RISK', 'blocker', 'HUMAN_REVIEW_REQUIRED', 'CONTENT_FRESHNESS_RESOLVED');

  const sources = freshness.officialSources || [];
  if ((article.sourcePolicy || {}).officialSourceRequired && !sources.some((source) => source.official && source.status === 'SOURCE_VERIFIED')) add('MISSING_MANDATORY_OFFICIAL_SOURCE', 'blocker', 'DETERMINISTIC', 'OFFICIAL_SOURCES_RESOLVED');
  for (const source of sources) {
    const complete = source.sourceId && source.sourceType && /^https:\/\//.test(source.sourceUrl || '') && source.authority && (source.supportsSections || []).length && source.lastVerifiedAt && source.updateRisk && contract.sourceTraceability.statuses.includes(source.status);
    if (!complete || source.reachable === false) add('SOURCE_TRACEABILITY_INCOMPLETE', 'blocker', 'DETERMINISTIC', 'OFFICIAL_SOURCES_RESOLVED');
  }

  const relationships = article.relationships || {};
  const requiredRelationships = ['domainId', 'nucleusId', 'clusterId', 'pillarAssetId', 'articleRole'];
  if (requiredRelationships.some((field) => !relationships[field]) || relationships.clusterExists === false) add('CLUSTER_POSITION_UNRESOLVED', 'manual', 'HUMAN_REVIEW_REQUIRED', 'CLUSTER_POSITION_RESOLVED');
  else if (!contract.clusterPosition.roles.includes(relationships.articleRole)) add('ARTICLE_ROLE_INVALID', 'blocker', 'DETERMINISTIC', 'CLUSTER_POSITION_RESOLVED');

  const linkPlan = article.internalLinkPlan || {};
  const outbound = linkPlan.outbound || [];
  for (const link of outbound) {
    if (!LINK_TYPES.includes(link.type) || !link.targetAssetId || !link.targetExists || !link.relationshipJustified) add('INTERNAL_LINK_INVALID', 'blocker', 'DETERMINISTIC', 'INTERNAL_LINK_PLAN_RESOLVED');
  }
  const genericCount = outbound.filter((link) => GENERIC_ANCHORS.includes(String(link.anchor || '').trim().toLowerCase())).length;
  if (genericCount) add('GENERIC_ANCHOR_OVERUSE', 'blocker', 'DETERMINISTIC', 'INTERNAL_LINK_PLAN_RESOLVED');
  if (relationships.articleRole !== 'PILLAR' && relationships.pillarAssetId && !outbound.some((link) => link.targetAssetId === relationships.pillarAssetId)) add('ARTICLE_WITHOUT_PILLAR_LINK', 'blocker', 'DETERMINISTIC', 'INTERNAL_LINK_PLAN_RESOLVED');
  if (!linkPlan.inboundAnalysis || !contract.internalLinking.inboundStates.includes(linkPlan.inboundAnalysis.state)) add('INBOUND_LINK_ANALYSIS_MISSING', 'blocker', 'DETERMINISTIC', 'BIDIRECTIONAL_CLUSTER_LINKING_RESOLVED');
  if (!contract.internalLinking.healthStates.includes(linkPlan.orphanRisk)) add('ORPHAN_RISK_UNRESOLVED', 'blocker', 'DETERMINISTIC', 'BIDIRECTIONAL_CLUSTER_LINKING_RESOLVED');

  const faq = article.faq || {};
  if (faq.visibleCount !== faq.schemaCount || !faq.exactMatch) add('FAQ_SCHEMA_MISMATCH', 'blocker', 'DETERMINISTIC', 'EDITORIAL_CLARITY_RESOLVED');
  if (!(article.cta || {}).resolved) add('CTA_PLAN_UNRESOLVED', 'major', 'DETERMINISTIC', 'INTERNAL_LINK_PLAN_RESOLVED');
  const panel = article.panelMetadata || {};
  if (PANEL_FIELDS.some((field) => !Object.prototype.hasOwnProperty.call(panel, field))) add('PANEL_METADATA_MINIMUM_INCOMPLETE', 'major', 'DETERMINISTIC', 'CONTENT_FRESHNESS_RESOLVED');

  findings.sort((a, b) => a.id.localeCompare(b.id));
  const gates = Object.fromEntries(GATES.map((gate) => [gate, findings.some((item) => item.gate === gate) ? 'UNRESOLVED' : 'RESOLVED']));
  const status = findings.some((item) => ['blocker', 'major'].includes(item.severity)) ? 'FAIL' : findings.some((item) => item.severity === 'manual') ? 'MANUAL_DECISION_REQUIRED' : findings.some((item) => item.severity === 'warning') ? 'WARNING' : 'PASS';
  const checkSummary = {DETERMINISTIC: 0, HEURISTIC: 0, HUMAN_REVIEW_REQUIRED: 0};
  findings.forEach((item) => { checkSummary[item.checkType] += 1; });
  return {status, findings, gates, checkSummary};
}

function auditHtml(relativePath) {
  const html = fs.readFileSync(path.resolve(ROOT, relativePath), 'utf8');
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const paragraphs = [...withoutScripts.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi)].map((match) => match[1].replace(/<[^>]+>/g, ' ').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim());
  const wordCounts = paragraphs.map((text) => (text.match(/[A-Za-zÀ-ÿ0-9]+/g) || []).length);
  const links = [...html.matchAll(/href="(\/[^"#?]+)"/g)].map((match) => match[1]);
  return {
    compatibilityClass: 'LEGACY_ARTICLE',
    compatibilityResult: 'LEGACY_ACCEPTED_PENDING_MIGRATION',
    readOnly: true,
    h1Count: (html.match(/<h1\b/gi) || []).length,
    h2Count: (html.match(/<h2\b/gi) || []).length,
    paragraphCount: paragraphs.length,
    averageParagraphWords: wordCounts.length ? Math.round(wordCounts.reduce((sum, count) => sum + count, 0) / wordCounts.length) : 0,
    denseParagraphCount: wordCounts.filter((count) => count > 120).length,
    maximumParagraphWords: Math.max(0, ...wordCounts),
    faqCount: (html.match(/<details\b/gi) || []).length,
    ctaMarkerCount: (html.match(/CTA_CARD_V1_/g) || []).length,
    officialSourceLinkCount: (html.match(/target="_blank"/g) || []).length,
    internalLinkCount: links.length,
    uniqueInternalLinkCount: new Set(links).size,
    mutableContentMarkers: (html.match(/2026|percentual|alíquota|prazo|tribut/gi) || []).length,
    semanticReviewRequired: true,
    note: 'Metrics are structural heuristics; they do not claim perfect semantic analysis.'
  };
}

function runFixtures() {
  const contract = validateContract();
  const refs = validateInternalReferences();
  const fixtures = readJson(FIXTURES_PATH);
  const results = fixtures.scenarios.map((scenario) => {
    const evaluated = evaluateArticle(deepMerge(fixtures.defaults, scenario.overrides || {}), contract);
    const actualFindings = evaluated.findings.map((item) => item.id).sort();
    const expectedFindings = [...scenario.expectedFindings].sort();
    return {...evaluated, id: scenario.id, expectedStatus: scenario.expectedStatus, expectedFindings, matched: evaluated.status === scenario.expectedStatus && JSON.stringify(actualFindings) === JSON.stringify(expectedFindings)};
  });
  const mismatches = results.filter((result) => !result.matched);
  console.log(`Article Editorial Automation Contract ${contract.version}`);
  results.forEach((result) => console.log(`${result.id}: ${result.status} [${result.findings.map((item) => item.id).join(', ')}]${result.matched ? '' : ' MISMATCH'}`));
  console.log(`Scenarios: ${results.length}; matched: ${results.length - mismatches.length}; mismatches: ${mismatches.length}`);
  console.log(`Internal references: ${refs.checked}; unresolved: ${refs.unresolved.length}`);
  if (mismatches.length) process.exitCode = 1;
  return {results, mismatches, refs};
}

function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--input' && args[1]) {
    validateContract(); validateInternalReferences();
    const result = evaluateArticle(readJson(args[1]));
    console.log(JSON.stringify(result, null, 2));
    if (!['PASS', 'WARNING', 'LEGACY_ACCEPTED_PENDING_MIGRATION'].includes(result.status)) process.exitCode = 1;
    return;
  }
  if (args[0] === '--audit-html' && args[1]) {
    validateContract();
    console.log(JSON.stringify(auditHtml(args[1]), null, 2));
    return;
  }
  runFixtures();
}

if (require.main === module) main();
module.exports = {deepMerge, validateContract, validateInternalReferences, evaluateArticle, auditHtml, runFixtures};
