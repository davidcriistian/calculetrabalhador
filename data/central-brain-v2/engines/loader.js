'use strict';
const fs = require('fs');
const path = require('path');
const { deepFreeze, clone, sha256 } = require('./integrity');
const { BrainError, invariant } = require('./errors');
function readJson(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (error) { throw new BrainError('DATASET_LOAD_FAILED', `Unable to load ${file}`, { file, cause: error.message }); } }
function verifyProjection(p) {
  const expected = sha256({ ruleId: p.ruleId, ruleVersionId: p.ruleVersionId, projectionType: p.projectionType, effectiveFrom: p.effectiveFrom, effectiveTo: p.effectiveTo, payload: p.payload, provenance: [...p.provenance].sort() });
  invariant(expected === p.contentFingerprint, 'FINGERPRINT_MISMATCH', 'Projection content fingerprint failed during load', { projectionId: p.id });
}
function loadDataset(root = path.resolve(__dirname, '..')) {
  const reg = name => readJson(path.join(root, 'registries', name)).items || [];
  const projectionRegistry = reg('projections.json');
  const dataset = { domains: reg('domains.json'), sources: reg('sources.json'), rules: reg('rules.json'), projections: projectionRegistry.filter(p => p.id && p.id.startsWith('PRJ-')), canonicalProjectionDiscovery: projectionRegistry.filter(p => p.id && p.id.startsWith('PROJ-')), dependencies: reg('dependencies.json'), consumers: reg('consumers.inventory.json'), auditEvents: reg('audit-events.json'), aliases: readJson(path.join(root, 'registries', 'aliases.json')).items || [] };
  dataset.projections.forEach(verifyProjection);
  const snapshot = clone(dataset);
  snapshot.snapshotFingerprint = sha256(dataset);
  snapshot.loadedAt = new Date().toISOString();
  return deepFreeze(snapshot);
}
module.exports = { loadDataset, verifyProjection };
