'use strict';
const crypto = require('crypto');

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((out, key) => {
      if (value[key] !== undefined) out[key] = canonicalize(value[key]);
      return out;
    }, {});
  }
  return value;
}
function stableStringify(value) { return JSON.stringify(canonicalize(value)); }
function sha256(value) { return `sha256:${crypto.createHash('sha256').update(typeof value === 'string' ? value : stableStringify(value)).digest('hex')}`; }
function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value); Object.values(value).forEach(deepFreeze);
  }
  return value;
}
module.exports = { canonicalize, stableStringify, sha256, deepFreeze };
