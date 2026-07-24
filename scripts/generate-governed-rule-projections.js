#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const registryPath = path.join(root, 'data/core/update/governed-rule-consumers.json');
const updateProjectionPath = path.join(root, 'data/maps/update-map.generated.json');
const dependencyProjectionPath = path.join(root, 'data/brain/dependencies.generated.json');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
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
  const preferred = ['consumers','relations','entries','items','ruleConsumers','dependencies'];
  for (const key of preferred) {
    if (Array.isArray(registry[key])) return registry[key];
  }
  for (const value of Object.values(registry)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const key of preferred) {
        if (Array.isArray(value[key])) return value[key];
      }
    }
  }
  return [];
}

const registry = readJson(registryPath);
const raw = locateRelations(registry);
const relations = raw
  .map((item, index) => ({
    relationId: String(pick(item, ['relationId','id'], `relation-${String(index + 1).padStart(4, '0')}`)),
    ruleId: pick(item, ['ruleId','rule','canonicalRuleId','sourceRule','legalRuleId']),
    consumerId: pick(item, ['consumerId','assetId','toolId','calculatorId','articleId','id','targetId']),
    consumerType: pick(item, ['consumerType','assetType','type','targetType'], 'unknown'),
    path: pick(item, ['path','file','consumerPath','targetPath']),
    relationType: pick(item, ['relationType','impactType','usage','mode','consumerMode'], 'unspecified'),
    status: pick(item, ['status','confirmationStatus','state'], 'declared'),
    nucleusId: pick(item, ['nucleusId','nucleus']),
    domainId: pick(item, ['domainId','domain']),
    clusterId: pick(item, ['clusterId','cluster']),
    impactSeverity: pick(item, ['impactSeverity','severity']),
    reviewRequired: pick(item, ['reviewRequired'], true),
    validators: pick(item, ['validators'], [])
  }))
  .filter(item => item.status !== 'rejected')
  .sort((a, b) =>
    String(a.ruleId || '').localeCompare(String(b.ruleId || '')) ||
    String(a.consumerType || '').localeCompare(String(b.consumerType || '')) ||
    String(a.consumerId || a.path || '').localeCompare(String(b.consumerId || b.path || ''))
  );

const byRule = {};
for (const relation of relations) {
  const rule = String(relation.ruleId || 'UNRESOLVED_RULE');
  if (!byRule[rule]) byRule[rule] = [];
  byRule[rule].push(relation);
}

const generatedAt = new Date().toISOString();
const updateProjection = {
  id: 'governed-update-map-projection',
  version: '1.0.0',
  status: 'generated-read-only',
  generatedAt,
  sourceAuthority: '/data/core/update/governed-rule-consumers.json',
  generator: '/scripts/generate-governed-rule-projections.js',
  relationCount: relations.length,
  rules: Object.keys(byRule).sort().map(ruleId => ({
    ruleId,
    consumers: byRule[ruleId].map(r => ({
      relationId: r.relationId,
      consumerId: r.consumerId,
      consumerType: r.consumerType,
      path: r.path,
      relationType: r.relationType,
      status: r.status,
      impactSeverity: r.impactSeverity,
      reviewRequired: r.reviewRequired,
      validators: r.validators
    }))
  }))
};

const dependencyProjection = {
  id: 'governed-dependency-projection',
  version: '1.0.0',
  status: 'generated-read-only',
  generatedAt,
  sourceAuthority: '/data/core/update/governed-rule-consumers.json',
  generator: '/scripts/generate-governed-rule-projections.js',
  relationCount: relations.length,
  dependencies: relations.map(r => ({
    relationId: r.relationId,
    from: {type: 'rule', id: r.ruleId},
    to: {type: r.consumerType, id: r.consumerId, path: r.path},
    relationType: r.relationType,
    status: r.status,
    context: {
      nucleusId: r.nucleusId,
      domainId: r.domainId,
      clusterId: r.clusterId
    }
  }))
};

writeJson(updateProjectionPath, updateProjection);
writeJson(dependencyProjectionPath, dependencyProjection);

console.log(JSON.stringify({
  status: 'PASS',
  sourceRelations: raw.length,
  projectedRelations: relations.length,
  outputs: [
    '/data/maps/update-map.generated.json',
    '/data/brain/dependencies.generated.json'
  ]
}, null, 2));
