'use strict';
const { invariant, BrainError } = require('./errors');
const { sha256, deepFreeze, clone } = require('./integrity');
function projectionIdentity(ruleId, ruleVersionId, projectionType, contentFingerprint) {
  return `PRJ-${sha256({ ruleId, ruleVersionId, projectionType, contentFingerprint }).slice(7, 31).toUpperCase()}`;
}
function generateProjection({ rule, version, projectionType, payload, generatedAt = new Date().toISOString() }) {
  invariant(rule && rule.status === 'approved', 'RULE_NOT_APPROVED', 'Rule must be approved before projection generation', { ruleId: rule && rule.id });
  invariant(version && version.status === 'approved', 'RULE_VERSION_NOT_APPROVED', 'Rule version must be approved before projection generation', { versionId: version && version.versionId });
  const content = { ruleId: rule.id, ruleVersionId: version.versionId, projectionType, effectiveFrom: version.validFrom, effectiveTo: version.validTo, payload: clone(payload), provenance: [...version.sourceIds].sort() };
  const contentFingerprint = sha256(content);
  const projection = { id: projectionIdentity(rule.id, version.versionId, projectionType, contentFingerprint), ...content, generatedAt, publishedAt: null, retiredAt: null, contentFingerprint, buildFingerprint: '', status: 'draft', validation: null };
  projection.buildFingerprint = sha256({ ...projection, buildFingerprint: undefined });
  return deepFreeze(projection);
}
function validateProjection(projection) {
  const expectedContent = sha256({ ruleId: projection.ruleId, ruleVersionId: projection.ruleVersionId, projectionType: projection.projectionType, effectiveFrom: projection.effectiveFrom, effectiveTo: projection.effectiveTo, payload: projection.payload, provenance: [...projection.provenance].sort() });
  invariant(expectedContent === projection.contentFingerprint, 'FINGERPRINT_MISMATCH', 'Projection content fingerprint is invalid', { projectionId: projection.id, expected: expectedContent, actual: projection.contentFingerprint });
  const validated = clone(projection);
  validated.status = 'validated';
  validated.validation = { validatedAt: new Date().toISOString(), validator: 'central-brain-v2' };
  validated.buildFingerprint = sha256({ ...validated, buildFingerprint: undefined });
  return deepFreeze(validated);
}
function publishProjection(projection, publishedAt = new Date().toISOString()) {
  invariant(projection.status === 'validated', 'INVALID_PROJECTION_TRANSITION', 'Only validated projections may be published', { projectionId: projection.id, status: projection.status });
  const published = clone(projection); published.status = 'published'; published.publishedAt = publishedAt; published.buildFingerprint = sha256({ ...published, buildFingerprint: undefined });
  return deepFreeze(published);
}
function retireProjection(projection, retiredAt = new Date().toISOString()) {
  invariant(projection.status === 'published', 'INVALID_PROJECTION_TRANSITION', 'Only published projections may be retired', { projectionId: projection.id, status: projection.status });
  const retired = clone(projection); retired.status = 'retired'; retired.retiredAt = retiredAt; retired.buildFingerprint = sha256({ ...retired, buildFingerprint: undefined });
  return deepFreeze(retired);
}
module.exports = { generateProjection, validateProjection, publishProjection, retireProjection };
