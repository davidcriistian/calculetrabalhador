'use strict';
const { sha256, deepFreeze, clone } = require('./integrity');
const { invariant } = require('./errors');
function hashEvent(event) { const seed=clone(event); delete seed.eventHash; return sha256(seed); }
function createAuditEvent({ actor, action, entityType, entityId, before = null, after = null, reason, correlationId, occurredAt = new Date().toISOString(), metadata = {}, sequence = 1, previousEventHash = null }) {
  invariant(actor && reason && correlationId, 'INVALID_AUDIT_EVENT', 'actor, reason and correlationId are required', { entityId });
  invariant(Number.isInteger(sequence) && sequence > 0, 'INVALID_AUDIT_SEQUENCE', 'sequence must be a positive integer', { sequence });
  const seed = { actor, action, entityType, entityId, occurredAt, correlationId };
  const event={ id: `AUD-${sha256(seed).slice(7, 31).toUpperCase()}`, occurredAt, actor, action, entityType, entityId, beforeFingerprint: before === null ? null : sha256(before), afterFingerprint: after === null ? null : sha256(after), reason, correlationId, metadata: clone(metadata), sequence, previousEventHash };
  event.eventHash=hashEvent(event); return deepFreeze(event);
}
function validateAuditChain(events) {
  let previous=null;
  for (let i=0;i<events.length;i++) { const e=events[i]; invariant(e.sequence===i+1,'AUDIT_SEQUENCE_BROKEN','Audit sequence is not contiguous',{eventId:e.id}); invariant(e.previousEventHash===previous,'AUDIT_PREVIOUS_HASH_MISMATCH','Audit previous hash mismatch',{eventId:e.id}); invariant(e.eventHash===hashEvent(e),'AUDIT_EVENT_HASH_MISMATCH','Audit event was modified',{eventId:e.id}); previous=e.eventHash; }
  return true;
}
function appendAuditEvent(events, event) {
  validateAuditChain(events); invariant(!events.some(x => x.id === event.id), 'DUPLICATE_AUDIT_EVENT', 'Audit event IDs are append-only and unique', { eventId: event.id });
  const expectedSequence=events.length+1, expectedPrevious=events.length?events[events.length-1].eventHash:null;
  invariant(event.sequence===expectedSequence,'AUDIT_APPEND_SEQUENCE_MISMATCH','Event must be appended at the chain tail',{expectedSequence}); invariant(event.previousEventHash===expectedPrevious,'AUDIT_APPEND_PREVIOUS_HASH_MISMATCH','Event must reference the current chain head',{}); invariant(event.eventHash===hashEvent(event),'AUDIT_EVENT_HASH_MISMATCH','Audit event hash is invalid',{eventId:event.id});
  const next=[...events.map(clone),clone(event)]; validateAuditChain(next); return deepFreeze(next);
}
module.exports = { createAuditEvent, appendAuditEvent, validateAuditChain, hashEvent };
