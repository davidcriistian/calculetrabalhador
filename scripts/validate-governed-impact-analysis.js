#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function fail(message, failures) {
  failures.push(message);
}

const args = process.argv.slice(2);
let target = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file') target = args[++i];
}
if (!target) {
  console.error(JSON.stringify({status:'FAIL', failures:['ANALYSIS_FILE_REQUIRED']}, null, 2));
  process.exit(2);
}

const file = path.isAbsolute(target) ? target : path.join(root, target);
const failures = [];
let report;
try { report = read(file); } catch (error) {
  failures.push(`ANALYSIS_SCHEMA_INVALID:${error.message}`);
}

if (report) {
  const required = [
    'id','version','status','generatedAt','input','resolution',
    'impactSummary','directImpact','indirectImpact','humanReview',
    'validationPlan','executionPlan','safety'
  ];
  for (const key of required) if (!Object.prototype.hasOwnProperty.call(report, key)) fail(`MISSING_FIELD:${key}`, failures);
  if (!report.input || !report.input.ruleId) fail('RULE_ID_NOT_FOUND', failures);
  if (!report.humanReview || report.humanReview.required !== true) fail('ANALYSIS_WITHOUT_HUMAN_APPROVAL', failures);
  if (report.humanReview && report.humanReview.automaticPublicationAllowed !== false) fail('AUTOMATIC_PUBLICATION_NOT_ALLOWED', failures);
  if (!report.safety || report.safety.sourceFilesModified !== false) fail('SOURCE_MUTATION_DETECTED', failures);
  if (!report.safety || report.safety.publicFilesModified !== false) fail('PUBLIC_RUNTIME_MUTATION', failures);
  if (!report.safety || report.safety.automaticExecutionAllowed !== false) fail('AUTOMATIC_EXECUTION_ATTEMPT', failures);
  if (report.safety && (report.safety.commit || report.safety.push || report.safety.deploy)) fail('VCS_OR_DEPLOY_MUTATION_DETECTED', failures);
  if (!Array.isArray(report.validationPlan)) fail('VALIDATION_PLAN_INVALID', failures);
  if (!Array.isArray(report.executionPlan)) fail('EXECUTION_PLAN_INVALID', failures);
}

if (failures.length) {
  console.error(JSON.stringify({status:'FAIL', failures}, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status:'PASS',
  file: path.relative(root, file).replace(/\\/g, '/'),
  ruleId: report.input.ruleId,
  impactLevel: report.resolution.impactLevel,
  humanApprovalRequired: report.humanReview.required,
  sourceMutation: 0,
  publicMutation: 0
}, null, 2));
