#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const contractPath = path.join(root, 'data/core/update/canonical-rule-minimum.contract.json');
const reportPath = path.join(root, 'data/core/update/canonical-rule-compatibility.json');
const rulesDir = path.join(root, 'data/rules');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const failures = [];
let contract;
let report;

try { contract = readJson(contractPath); } catch (error) {
  failures.push(`CONTRACT_INVALID: ${error.message}`);
}
try { report = readJson(reportPath); } catch (error) {
  failures.push(`REPORT_INVALID: ${error.message}`);
}

const files = fs.readdirSync(rulesDir).filter(name => name.endsWith('.json')).sort();
const seen = new Set();

for (const name of files) {
  const file = path.join(rulesDir, name);
  let rule;
  try { rule = readJson(file); } catch (error) {
    failures.push(`RULE_JSON_INVALID:${name}:${error.message}`);
    continue;
  }
  const id = String(rule.ruleId || rule.id || rule.domain || path.basename(name, '.json'));
  if (seen.has(id)) failures.push(`DUPLICATE_CANONICAL_RULE_ID:${id}`);
  seen.add(id);
  if (typeof rule.fingerprint === 'string' && !/^[a-f0-9]{64}$/i.test(rule.fingerprint)) {
    failures.push(`FINGERPRINT_DECLARED_BUT_INVALID:${name}`);
  }
}

if (report) {
  if (report.scope.ruleCount !== files.length) {
    failures.push(`REPORT_RULE_COUNT_MISMATCH:${report.scope.ruleCount}:${files.length}`);
  }
  if (report.scope.existingRulesMutated !== 0) {
    failures.push('EXISTING_RULE_MUTATION_NOT_ALLOWED_IN_PHASE_1');
  }
  if (report.scope.publicFilesMutated !== 0) {
    failures.push('PUBLIC_RUNTIME_MUTATION');
  }
  const reported = new Set((report.rules || []).map(item => path.basename(item.file)));
  for (const name of files) {
    if (!reported.has(name)) failures.push(`RULE_MISSING_FROM_COMPATIBILITY_REPORT:${name}`);
  }
}

if (contract) {
  if (contract.runtimeStatus !== 'validation-only') {
    failures.push('CONTRACT_RUNTIME_STATUS_MUST_BE_VALIDATION_ONLY');
  }
  if (contract.compatibilityPolicy.existingRuleMutationRequired !== false) {
    failures.push('CONTRACT_MUST_NOT_REQUIRE_BULK_RULE_MUTATION');
  }
}

if (failures.length) {
  console.error(JSON.stringify({status: 'FAIL', failures}, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: 'PASS',
  contract: '/data/core/update/canonical-rule-minimum.contract.json',
  rulesValidated: files.length,
  publicMutation: 0,
  ruleMutation: 0
}, null, 2));
