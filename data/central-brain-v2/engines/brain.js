'use strict';
const { BrainError, invariant } = require('./errors');
const { selectRuleVersion, parseDate } = require('./temporal-selector');
const { deepFreeze, clone, sha256 } = require('./integrity');
class CentralBrain {
  constructor(dataset) { this.dataset = deepFreeze(clone(dataset || {})); }
  resolveAlias(id, type = null) { const found = (this.dataset.aliases || []).find(x => x.alias === id && (!type || x.entityType === type)); return found ? found.canonicalId : id; }
  getDomain(domainId) { const id = this.resolveAlias(domainId, 'domain'); const domain = (this.dataset.domains || []).find(x => x.id === id); return domain ? deepFreeze(clone(domain)) : null; }
  getRule(ruleId, referenceDate, options = {}) {
    parseDate(referenceDate, 'referenceDate');
    const rule = (this.dataset.rules || []).find(x => x.id === ruleId);
    if (!rule) throw new BrainError('RULE_NOT_FOUND', 'Canonical rule was not found', { ruleId });
    invariant(rule.status === 'approved', 'RULE_NOT_APPROVED', 'Rule is not approved', { ruleId, status: rule.status });
    const domain = this.getDomain(rule.domainId);
    invariant(domain && domain.consumerReady && domain.maturity === 'READY_FOR_CONSUMERS', 'DOMAIN_NOT_READY', 'Domain is not ready for consumers', { domainId: rule.domainId });
    const version = selectRuleVersion(rule, referenceDate, options);
    return deepFreeze({ rule: clone(rule), version: clone(version), effectiveFrom: version.validFrom, effectiveTo: version.validTo, provenance: [...version.sourceIds], contentFingerprint: version.contentFingerprint });
  }
  getProjection(request) {
    invariant(request && typeof request === 'object', 'INVALID_REQUEST', 'Projection request must be an object');
    const { ruleId, referenceDate, projectionType, consumerId, asKnownAt } = request;
    invariant(ruleId && referenceDate && projectionType && consumerId, 'INVALID_REQUEST', 'ruleId, referenceDate, projectionType and consumerId are required', { request });
    const consumer = (this.dataset.consumers || []).find(c => c.canonicalId === consumerId);
    if (!consumer) throw new BrainError('CONSUMER_NOT_FOUND', 'Consumer is not registered', { consumerId });
    const selected = this.getRule(ruleId, referenceDate, { asKnownAt });
    const projection = (this.dataset.projections || []).find(p => p.ruleId === ruleId && p.ruleVersionId === selected.version.versionId && p.projectionType === projectionType && p.status === 'published');
    if (!projection) throw new BrainError('PROJECTION_NOT_FOUND', 'Published projection was not found', { ruleId, ruleVersionId: selected.version.versionId, projectionType, consumerId });
    const expected = sha256({ ruleId: projection.ruleId, ruleVersionId: projection.ruleVersionId, projectionType: projection.projectionType, effectiveFrom: projection.effectiveFrom, effectiveTo: projection.effectiveTo, payload: projection.payload, provenance: [...projection.provenance].sort() });
    invariant(expected === projection.contentFingerprint, 'FINGERPRINT_MISMATCH', 'Projection fingerprint is invalid', { projectionId: projection.id });
    return deepFreeze({ ruleId, ruleVersionId: projection.ruleVersionId, effectiveFrom: projection.effectiveFrom, effectiveTo: projection.effectiveTo, payload: clone(projection.payload), contentFingerprint: projection.contentFingerprint, buildFingerprint: projection.buildFingerprint, provenance: [...projection.provenance] });
  }
  getDependencies(entityId, options = {}) { return deepFreeze((this.dataset.dependencies || []).filter(d => (d.from === entityId || d.to === entityId) && (!options.status || d.status === options.status)).map(clone)); }
  getImpact(entityId) {
    const edges = this.dataset.dependencies || []; const impacted = new Set(); const queue = [entityId];
    while (queue.length) { const current = queue.shift(); for (const edge of edges) { if (edge.to === current && ['consumes','depends-on','projects','documents','tests'].includes(edge.relation) && !impacted.has(edge.from)) { impacted.add(edge.from); queue.push(edge.from); } } }
    return deepFreeze([...impacted]);
  }
}
module.exports = { CentralBrain };
