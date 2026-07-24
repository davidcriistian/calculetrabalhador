'use strict';
const { BrainError, invariant } = require('./errors');
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function parseDate(value, field = 'date') {
  invariant(typeof value === 'string' && DATE_RE.test(value), 'INVALID_DATE', `${field} must be YYYY-MM-DD`, { field, value });
  const d = new Date(`${value}T00:00:00.000Z`);
  invariant(!Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value, 'INVALID_DATE', `${field} is not a real calendar date`, { field, value });
  return value;
}
function parseDateTime(value, field = 'dateTime') {
  const ms = Date.parse(value);
  invariant(typeof value === 'string' && !Number.isNaN(ms), 'INVALID_DATETIME', `${field} must be ISO date-time`, { field, value });
  return ms;
}
function containsDate(version, referenceDate) {
  const ref = parseDate(referenceDate, 'referenceDate');
  parseDate(version.validFrom, 'validFrom');
  if (version.validTo !== null) parseDate(version.validTo, 'validTo');
  return ref >= version.validFrom && (version.validTo === null || ref <= version.validTo);
}
function knownAt(version, asKnownAt) {
  const at = parseDateTime(asKnownAt, 'asKnownAt');
  const from = parseDateTime(version.recordedAt, 'recordedAt');
  const until = version.recordedUntil === null ? null : parseDateTime(version.recordedUntil, 'recordedUntil');
  return at >= from && (until === null || at < until);
}
function selectRuleVersion(rule, referenceDate, options = {}) {
  const asKnownAt = options.asKnownAt || new Date().toISOString();
  const candidates = (rule.versions || []).filter(v => v.status === 'approved' && containsDate(v, referenceDate) && knownAt(v, asKnownAt));
  if (candidates.length === 0) throw new BrainError('NO_VERSION_FOR_DATE', 'No approved version matches the requested valid and transaction time', { ruleId: rule.id, referenceDate, asKnownAt });
  if (candidates.length > 1) throw new BrainError('AMBIGUOUS_VERSION_FOR_DATE', 'More than one approved version matches the requested valid and transaction time', { ruleId: rule.id, referenceDate, asKnownAt, versionIds: candidates.map(v => v.versionId) });
  return candidates[0];
}
module.exports = { parseDate, parseDateTime, containsDate, knownAt, selectRuleVersion };
