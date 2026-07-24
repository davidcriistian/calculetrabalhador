#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
let target = null;
for (let i = 0; i < args.length; i++) if (args[i] === '--file') target = args[++i];

if (!target) {
  console.error(JSON.stringify({status:'FAIL', failures:['EXECUTION_PLAN_FILE_REQUIRED']}, null, 2));
  process.exit(2);
}

const file = path.isAbsolute(target) ? target : path.join(root, target);
const failures = [];
let plan;
try { plan = JSON.parse(fs.readFileSync(file, 'utf8')); }
catch (error) { failures.push(`EXECUTION_PLAN_INVALID:${error.message}`); }

if (plan) {
  const required = [
    'id','version','status','generatedAt','input','approval','scope',
    'preconditions','operations','validationSequence','rollbackPlan',
    'publicationGate','safety'
  ];
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(plan, key)) failures.push(`MISSING_FIELD:${key}`);
  }
  if (!['blocked-awaiting-approval','blocked-invalid-approval','approved-plan-read-only'].includes(plan.status)) {
    failures.push(`INVALID_STATUS:${plan.status}`);
  }
  if (!plan.approval || plan.approval.required !== true) failures.push('APPROVAL_MUST_BE_REQUIRED');
  if (!plan.rollbackPlan || plan.rollbackPlan.required !== true) failures.push('ROLLBACK_PLAN_REQUIRED');
  if (!plan.publicationGate || plan.publicationGate.automaticPublicationAllowed !== false) failures.push('AUTOMATIC_PUBLICATION_NOT_ALLOWED');
  if (!plan.safety || plan.safety.planningOnly !== true) failures.push('PLAN_MUST_BE_PLANNING_ONLY');
  if (!plan.safety || plan.safety.sourceFilesModified !== false) failures.push('SOURCE_MUTATION_DETECTED');
  if (!plan.safety || plan.safety.publicFilesModified !== false) failures.push('PUBLIC_RUNTIME_MUTATION');
  if (!plan.safety || plan.safety.automaticExecutionAllowed !== false) failures.push('AUTOMATIC_EXECUTION_ATTEMPT');
  if (plan.safety && (plan.safety.commit || plan.safety.push || plan.safety.deploy)) failures.push('VCS_OR_DEPLOY_MUTATION_DETECTED');
  if (!Array.isArray(plan.operations) || plan.operations.length === 0) failures.push('OPERATIONS_REQUIRED');
  if (Array.isArray(plan.operations) && plan.operations.some(op => op.mutationAllowed !== false)) {
    failures.push('OPERATION_MUTATION_MUST_BE_FALSE');
  }
  if (plan.status === 'approved-plan-read-only' && (!plan.approval || plan.approval.valid !== true)) {
    failures.push('APPROVED_PLAN_REQUIRES_VALID_APPROVAL');
  }
}

if (failures.length) {
  console.error(JSON.stringify({status:'FAIL', failures}, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status:'PASS',
  file:path.relative(root, file).replace(/\\/g, '/'),
  planStatus:plan.status,
  operations:plan.operations.length,
  approvalValid:plan.approval.valid,
  planningOnly:true,
  sourceMutation:0,
  publicMutation:0
}, null, 2));
