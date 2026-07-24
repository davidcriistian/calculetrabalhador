'use strict';
class BrainError extends Error {
  constructor(code, message, context = {}) {
    super(message || code);
    this.name = 'BrainError';
    this.code = code;
    this.context = Object.freeze({ ...context });
  }
  toJSON() { return { name: this.name, code: this.code, message: this.message, context: this.context }; }
}
function invariant(condition, code, message, context) {
  if (!condition) throw new BrainError(code, message, context);
}
module.exports = { BrainError, invariant };
