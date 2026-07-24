#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
let target = null;
for (let i = 0; i < args.length; i++) if (args[i] === '--file') target = args[++i];

if (!target) {
  console.error(JSON.stringify({status:'FAIL', failures:['PREVIEW_BUNDLE_FILE_REQUIRED']}, null, 2));
  process.exit(2);
}

const file = path.isAbsolute(target) ? target : path.join(root, target);
const failures = [];
let bundle;
try { bundle = JSON.parse(fs.readFileSync(file, 'utf8')); }
catch (error) { failures.push(`PREVIEW_BUNDLE_INVALID:${error.message}`); }

if (bundle) {
  const required = [
    'id','version','status','generatedAt','input','fingerprints',
    'fileEvidence','proposal','validatorEvidence','humanReview',
    'publicationGate','safety'
  ];
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(bundle, key)) failures.push(`MISSING_FIELD:${key}`);
  }
  if (!['review-ready','blocked-evidence-incomplete','blocked-validator-failure'].includes(bundle.status)) {
    failures.push(`INVALID_STATUS:${bundle.status}`);
  }
  if (!bundle.humanReview || bundle.humanReview.required !== true) failures.push('HUMAN_REVIEW_REQUIRED');
  if (!bundle.publicationGate || bundle.publicationGate.open !== false) failures.push('PUBLICATION_GATE_MUST_BE_CLOSED');
  if (!bundle.publicationGate || bundle.publicationGate.automaticPublicationAllowed !== false) failures.push('AUTOMATIC_PUBLICATION_NOT_ALLOWED');
  if (!bundle.safety || bundle.safety.evidenceOnly !== true) failures.push('BUNDLE_MUST_BE_EVIDENCE_ONLY');
  if (!bundle.safety || bundle.safety.sourceFilesModified !== false) failures.push('SOURCE_MUTATION_DETECTED');
  if (!bundle.safety || bundle.safety.publicFilesModified !== false) failures.push('PUBLIC_RUNTIME_MUTATION');
  if (!bundle.safety || bundle.safety.patchesApplied !== 0) failures.push('PATCH_APPLICATION_DETECTED');
  if (bundle.safety && (bundle.safety.commit || bundle.safety.push || bundle.safety.deploy || bundle.safety.publication)) {
    failures.push('VCS_DEPLOY_OR_PUBLICATION_MUTATION_DETECTED');
  }
  if (!Array.isArray(bundle.fileEvidence)) failures.push('FILE_EVIDENCE_INVALID');
  if (!Array.isArray(bundle.validatorEvidence)) failures.push('VALIDATOR_EVIDENCE_INVALID');
}

if (failures.length) {
  console.error(JSON.stringify({status:'FAIL', failures}, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status:'PASS',
  file:path.relative(root, file).replace(/\\/g, '/'),
  bundleStatus:bundle.status,
  affectedFiles:bundle.fileEvidence.length,
  validators:bundle.validatorEvidence.length,
  evidenceOnly:true,
  sourceMutation:0,
  publicMutation:0,
  patchesApplied:0,
  publication:0
}, null, 2));
