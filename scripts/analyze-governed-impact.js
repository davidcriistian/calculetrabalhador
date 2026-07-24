#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');

function read(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}
function write(rel, data) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}
function list(obj, keys) {
  if (Array.isArray(obj)) return obj;
  for (const key of keys) if (obj && Array.isArray(obj[key])) return obj[key];
  return [];
}
function pick(obj, keys, fallback = null) {
  for (const key of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== null && obj[key] !== '') {
      return obj[key];
    }
  }
  return fallback;
}
function locateRelations(registry) {
  if (Array.isArray(registry)) return registry;
  for (const key of ['dependencies','consumers','relations','entries','items','ruleConsumers']) {
    if (registry && Array.isArray(registry[key])) return registry[key];
  }
  for (const value of Object.values(registry || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const key of ['dependencies','consumers','relations','entries','items','ruleConsumers']) {
        if (Array.isArray(value[key])) return value[key];
      }
    }
  }
  return [];
}
function unique(values) {
  return [...new Set(values.filter(v => v !== null && v !== undefined && v !== ''))];
}
function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
}

const args = process.argv.slice(2);
const input = {};
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--rule') input.ruleId = args[++i];
  else if (arg === '--change-type') input.changeType = args[++i];
  else if (arg === '--effective-from') input.effectiveFrom = args[++i];
  else if (arg === '--source-reference') input.sourceReference = args[++i];
  else if (arg === '--requested-by') input.requestedBy = args[++i];
  else if (arg === '--notes') input.notes = args[++i];
  else if (arg === '--output') input.output = args[++i];
}

if (!input.ruleId) {
  console.error(JSON.stringify({status:'FAIL', failures:['RULE_ID_REQUIRED']}, null, 2));
  process.exit(2);
}
input.changeType = input.changeType || 'UNKNOWN';

const compatibility = read('data/core/update/canonical-rule-compatibility.json');
const registry = read('data/core/update/governed-rule-consumers.json');
const matrix = read('data/core/update/editorial-impact-matrix.generated.json');
const clusters = read('data/brain/editorial-clusters.generated.json');
const nuclei = read('data/brain/editorial-nuclei.generated.json');

const rule = (compatibility.rules || []).find(item =>
  String(item.canonicalRuleIdCandidate) === String(input.ruleId) ||
  path.basename(String(item.file || ''), '.json') === String(input.ruleId)
);

const relations = locateRelations(registry)
  .map((item, index) => ({
    relationId: String(pick(item, ['relationId','id'], `relation-${String(index + 1).padStart(4,'0')}`)),
    ruleId: pick(item, ['ruleId','rule','canonicalRuleId','sourceRule','legalRuleId']),
    consumerId: pick(item, ['consumerId','assetId','toolId','calculatorId','articleId','targetId','id']),
    consumerType: String(pick(item, ['consumerType','assetType','type','targetType'], 'unknown')).toLowerCase(),
    path: pick(item, ['path','file','consumerPath','targetPath']),
    relationType: pick(item, ['relationType','impactType','usage','mode','consumerMode'], 'unspecified'),
    status: String(pick(item, ['status','confirmationStatus','state'], 'declared')).toLowerCase(),
    impactSeverity: pick(item, ['impactSeverity','severity']),
    reviewRequired: pick(item, ['reviewRequired'], true),
    validators: pick(item, ['validators'], [])
  }))
  .filter(item => String(item.ruleId) === String(input.ruleId) && item.status !== 'rejected');

const directTools = relations.filter(r =>
  r.consumerType.includes('tool') || r.consumerType.includes('calculator')
);
const directArticles = relations.filter(r => r.consumerType.includes('article'));
const directOther = relations.filter(r => !directTools.includes(r) && !directArticles.includes(r));

const toolIds = unique(directTools.map(r => r.consumerId));
const inheritedArticles = (matrix.articles || []).filter(article =>
  (article.effectiveRuleDependencies || []).includes(input.ruleId) ||
  (article.primaryToolId && toolIds.includes(article.primaryToolId))
);
const articleIds = unique([
  ...directArticles.map(r => r.consumerId),
  ...inheritedArticles.map(a => a.articleId)
]);

const impactedClusters = (clusters.clusters || []).filter(cluster =>
  (cluster.ruleIds || []).includes(input.ruleId) ||
  (cluster.toolIds || []).some(id => toolIds.includes(id)) ||
  (cluster.articleIds || []).some(id => articleIds.includes(id))
);
const clusterIds = impactedClusters.map(c => c.clusterId);

const impactedNuclei = (nuclei.nuclei || []).filter(nucleus =>
  (nucleus.ruleIds || []).includes(input.ruleId) ||
  (nucleus.toolIds || []).some(id => toolIds.includes(id)) ||
  (nucleus.articleIds || []).some(id => articleIds.includes(id)) ||
  (nucleus.clusterIds || []).some(id => clusterIds.includes(id))
);

const pillarArticles = inheritedArticles.filter(a => a.isPillar);
const confirmedRelations = relations.filter(r => r.status === 'confirmed').length;
const declaredRelations = relations.filter(r => r.status !== 'confirmed').length;

let impactLevel = 'UNRESOLVED';
if (rule) {
  const highRiskChange = ['LEGAL_VALUE_CHANGE','LEGAL_TEXT_CHANGE','EFFECTIVITY_CHANGE','CORRECTION'].includes(input.changeType);
  if (highRiskChange && toolIds.length && articleIds.length) impactLevel = 'CRITICAL';
  else if (relations.length && (confirmedRelations || toolIds.length)) impactLevel = 'HIGH';
  else if (relations.length || articleIds.length) impactLevel = 'MEDIUM';
  else impactLevel = 'LOW';
}

const validators = unique([
  '/scripts/validate-canonical-rule-minimum-contract.js',
  '/scripts/validate-governed-rule-consumer-authority.js',
  '/scripts/validate-editorial-impact-matrix.js',
  ...relations.flatMap(r => Array.isArray(r.validators) ? r.validators : [])
]);

const affectedFiles = unique([
  rule ? rule.file : null,
  ...relations.map(r => r.path),
  ...inheritedArticles.map(a => a.path)
]);

const executionPlan = [
  {
    step: 1,
    action: 'VERIFY_OFFICIAL_SOURCE',
    mode: 'human-required',
    blockedUntilApproved: true,
    description: 'Confirmar fonte oficial, vigência e escopo material da alteração.'
  },
  {
    step: 2,
    action: 'UPDATE_CANONICAL_RULE',
    mode: 'manual-controlled',
    blockedUntilApproved: true,
    description: 'Alterar somente a regra canônica aprovada e atualizar versão/fingerprint.'
  },
  {
    step: 3,
    action: 'VALIDATE_DIRECT_CONSUMERS',
    mode: 'manual-plus-automation',
    blockedUntilApproved: true,
    targets: toolIds
  },
  {
    step: 4,
    action: 'REVIEW_EDITORIAL_IMPACT',
    mode: 'human-required',
    blockedUntilApproved: true,
    targets: articleIds
  },
  {
    step: 5,
    action: 'RUN_VALIDATORS',
    mode: 'automation-after-approval',
    blockedUntilApproved: true,
    validators
  },
  {
    step: 6,
    action: 'PREVIEW_AND_APPROVE_PUBLICATION',
    mode: 'human-required',
    blockedUntilApproved: true,
    description: 'Nenhuma publicação automática é permitida.'
  }
];

const report = {
  id: `impact-analysis-${slug(input.ruleId)}-${Date.now()}`,
  version: '1.0.0',
  status: rule ? 'generated-read-only' : 'blocked-unresolved',
  generatedAt: new Date().toISOString(),
  input: {
    ruleId: input.ruleId,
    changeType: input.changeType,
    effectiveFrom: input.effectiveFrom || null,
    sourceReference: input.sourceReference || null,
    requestedBy: input.requestedBy || null,
    notes: input.notes || null
  },
  resolution: {
    ruleFound: Boolean(rule),
    canonicalRuleFile: rule ? rule.file : null,
    certificationLevel: rule ? rule.certificationLevel : null,
    impactLevel,
    unresolvedReason: rule ? null : 'RULE_ID_NOT_FOUND'
  },
  impactSummary: {
    typedRelations: relations.length,
    confirmedRelations,
    declaredRelations,
    tools: toolIds.length,
    articles: articleIds.length,
    clusters: impactedClusters.length,
    nuclei: impactedNuclei.length,
    pillarArticles: pillarArticles.length,
    affectedFiles: affectedFiles.length
  },
  directImpact: {
    tools: directTools,
    articles: directArticles,
    otherConsumers: directOther
  },
  indirectImpact: {
    inheritedArticles: inheritedArticles.map(a => ({
      articleId: a.articleId,
      title: a.title,
      path: a.path,
      primaryToolId: a.primaryToolId,
      clusterId: a.clusterId,
      nucleusId: a.nucleusId,
      isPillar: a.isPillar,
      impactConnection: a.impactConnection
    })),
    clusters: impactedClusters,
    nuclei: impactedNuclei,
    pillarArticles: pillarArticles.map(a => ({
      articleId: a.articleId,
      title: a.title,
      path: a.path
    }))
  },
  humanReview: {
    required: true,
    automaticPublicationAllowed: false,
    requiredApprovals: [
      {role:'domain-owner', status:'pending'},
      {role:'legal-reviewer', status:'pending'},
      {role:'publishing-owner', status:'pending'}
    ],
    reviewReasons: unique([
      'LEGAL_OR_GOVERNANCE_CHANGE',
      toolIds.length ? 'CALCULATOR_CONSUMERS_AFFECTED' : null,
      articleIds.length ? 'EDITORIAL_CONTENT_AFFECTED' : null,
      pillarArticles.length ? 'PILLAR_CONTENT_AFFECTED' : null
    ])
  },
  validationPlan: validators.map((validator, index) => ({
    order: index + 1,
    validator,
    required: true,
    status: 'pending'
  })),
  executionPlan,
  affectedFiles,
  safety: {
    sourceFilesModified: false,
    publicFilesModified: false,
    commit: false,
    push: false,
    deploy: false,
    automaticExecutionAllowed: false
  }
};

const defaultOutput = `data/core/update/impact-analysis/${slug(input.ruleId)}.impact.json`;
const output = input.output || defaultOutput;
write(output, report);

console.log(JSON.stringify({
  status: rule ? 'PASS' : 'BLOCKED',
  output: '/' + output.replace(/\\/g, '/'),
  impactLevel,
  tools: toolIds.length,
  articles: articleIds.length,
  clusters: impactedClusters.length,
  nuclei: impactedNuclei.length,
  humanApprovalRequired: true,
  sourceMutation: 0,
  publicMutation: 0
}, null, 2));

if (!rule) process.exit(3);
