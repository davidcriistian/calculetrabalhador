#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const childProcess = require('child_process');

const root = path.resolve(__dirname, '..');
const registryPath = path.join(root, 'data/core/update/governed-rule-consumers.json');
const contractPath = path.join(root, 'data/core/update/governed-rule-consumer-authority.contract.json');
const generatorPath = path.join(root, 'scripts/generate-governed-rule-projections.js');
const updateProjectionPath = path.join(root, 'data/maps/update-map.generated.json');
const dependencyProjectionPath = path.join(root, 'data/brain/dependencies.generated.json');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function digest(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
function locateRelations(registry) {
  if (Array.isArray(registry)) return registry;
  const preferred = ['consumers','relations','entries','items','ruleConsumers','dependencies'];
  for (const key of preferred) if (Array.isArray(registry[key])) return registry[key];
  for (const value of Object.values(registry)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const key of preferred) if (Array.isArray(value[key])) return value[key];
    }
  }
  return [];
}
function pick(obj, keys) {
  for (const key of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== null && obj[key] !== '') return obj[key];
  }
  return null;
}

const failures = [];
let registry, contract;
try { registry = readJson(registryPath); } catch (e) { failures.push(`CANONICAL_REGISTRY_INVALID:${e.message}`); }
try { contract = readJson(contractPath); } catch (e) { failures.push(`AUTHORITY_CONTRACT_INVALID:${e.message}`); }

if (registry) {
  const relations = locateRelations(registry);
  const seen = new Set();
  relations.forEach((item, index) => {
    const id = String(pick(item, ['relationId','id']) || `relation-${String(index + 1).padStart(4, '0')}`);
    const rule = pick(item, ['ruleId','rule','canonicalRuleId','sourceRule','legalRuleId']);
    const consumer = pick(item, ['consumerId','assetId','toolId','calculatorId','articleId','id','targetId']);
    const file = pick(item, ['path','file','consumerPath','targetPath']);
    if (seen.has(id)) failures.push(`DUPLICATE_RELATION_ID:${id}`);
    seen.add(id);
    if (!rule) failures.push(`RELATION_WITHOUT_RULE:${id}`);
    if (!consumer && !file) failures.push(`RELATION_WITHOUT_CONSUMER_ID_OR_PATH:${id}`);
  });
}

if (contract) {
  if (contract.runtimeStatus !== 'projection-and-validation-only') {
    failures.push('INVALID_RUNTIME_STATUS');
  }
  if (contract.projectionPolicy.overwriteLegacyMaps !== false) {
    failures.push('LEGACY_MAP_OVERWRITE_MUST_BE_FALSE');
  }
}

if (!failures.length) {
  childProcess.execFileSync('node', [generatorPath], {cwd: root, stdio: 'pipe'});
  const first = [digest(updateProjectionPath), digest(dependencyProjectionPath)];
  childProcess.execFileSync('node', [generatorPath], {cwd: root, stdio: 'pipe'});
  const second = [digest(updateProjectionPath), digest(dependencyProjectionPath)];
  // generatedAt changes; compare normalized content without timestamp instead.
  const normalize = file => {
    const obj = readJson(file);
    delete obj.generatedAt;
    return JSON.stringify(obj);
  };
  const normalizedFirst = [normalize(updateProjectionPath), normalize(dependencyProjectionPath)];
  childProcess.execFileSync('node', [generatorPath], {cwd: root, stdio: 'pipe'});
  const normalizedSecond = [normalize(updateProjectionPath), normalize(dependencyProjectionPath)];
  if (normalizedFirst[0] !== normalizedSecond[0] || normalizedFirst[1] !== normalizedSecond[1]) {
    failures.push('GENERATED_PROJECTION_DRIFT');
  }
}

if (failures.length) {
  console.error(JSON.stringify({status:'FAIL', failures}, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: 'PASS',
  authority: '/data/core/update/governed-rule-consumers.json',
  projections: [
    '/data/maps/update-map.generated.json',
    '/data/brain/dependencies.generated.json'
  ],
  publicMutation: 0,
  legacyMapsOverwritten: false
}, null, 2));
