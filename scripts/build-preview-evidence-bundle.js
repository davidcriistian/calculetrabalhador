#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const childProcess = require('child_process');

const root = path.resolve(__dirname, '..');

function read(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function write(rel, data) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}
function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
}
function resolve(ref) {
  if (!ref) return null;
  return path.isAbsolute(ref) ? ref : path.join(root, String(ref).replace(/^\/+/, ''));
}
function existsFile(ref) {
  const file = resolve(ref);
  return file && fs.existsSync(file) && fs.statSync(file).isFile();
}
function fingerprintRef(ref) {
  const file = resolve(ref);
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    return {reference: ref, exists:false, sha256:null, size:null};
  }
  return {
    reference: ref,
    exists:true,
    sha256:sha256(file),
    size:fs.statSync(file).size
  };
}

const args = process.argv.slice(2);
const input = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--plan') input.plan = args[++i];
  else if (args[i] === '--proposal') input.proposal = args[++i];
  else if (args[i] === '--requested-by') input.requestedBy = args[++i];
  else if (args[i] === '--notes') input.notes = args[++i];
  else if (args[i] === '--output') input.output = args[++i];
}

if (!input.plan) {
  console.error(JSON.stringify({status:'FAIL', failures:['EXECUTION_PLAN_REQUIRED']}, null, 2));
  process.exit(2);
}

const planFile = resolve(input.plan);
let plan;
try { plan = read(planFile); } catch (error) {
  console.error(JSON.stringify({status:'FAIL', failures:[`EXECUTION_PLAN_INVALID:${error.message}`]}, null, 2));
  process.exit(2);
}
if (plan.status !== 'approved-plan-read-only') {
  console.error(JSON.stringify({status:'FAIL', failures:['EXECUTION_PLAN_NOT_APPROVED_READ_ONLY']}, null, 2));
  process.exit(3);
}

const planRel = path.relative(root, planFile).replace(/\\/g, '/');
const impactRef = plan.input.impactAnalysisFile;
const approvalRef = plan.input.approvalFile;
let proposal = null;
let proposalState = 'missing';
if (input.proposal) {
  try {
    proposal = read(resolve(input.proposal));
    proposalState = 'present';
  } catch (error) {
    proposalState = 'invalid';
  }
}

const fileEvidence = (plan.scope.affectedFiles || []).map(ref => {
  const fp = fingerprintRef(ref);
  return {
    ...fp,
    classification: ref === plan.scope.canonicalRuleFile ? 'canonical-rule' : 'consumer-or-editorial',
    proposedChange: proposal && Array.isArray(proposal.proposals)
      ? proposal.proposals.find(p => p.targetFile === ref) || null
      : null
  };
});

const validatorEvidence = [];
for (const step of plan.validationSequence || []) {
  const validatorRef = step.validator;
  const validatorFile = resolve(validatorRef);
  const evidence = {
    validator: validatorRef,
    exists: Boolean(validatorFile && fs.existsSync(validatorFile)),
    executed: false,
    exitCode: null,
    status: 'missing',
    stdout: '',
    stderr: ''
  };
  if (evidence.exists && path.extname(validatorFile) === '.js') {
    try {
      const result = childProcess.spawnSync('node', [validatorFile], {
        cwd: root,
        encoding: 'utf8',
        timeout: 120000
      });
      evidence.executed = true;
      evidence.exitCode = result.status;
      evidence.stdout = result.stdout || '';
      evidence.stderr = result.stderr || '';
      evidence.status = result.status === 0 ? 'pass' : 'fail';
    } catch (error) {
      evidence.executed = true;
      evidence.exitCode = -1;
      evidence.stderr = error.message;
      evidence.status = 'fail';
    }
  }
  validatorEvidence.push(evidence);
}

const missingFiles = fileEvidence.filter(item => !item.exists).length;
const validatorFailures = validatorEvidence.filter(item => item.status === 'fail').length;
const validatorMissing = validatorEvidence.filter(item => item.status === 'missing').length;
const proposalIncomplete = !proposal || proposalState !== 'present' ||
  !Array.isArray(proposal.proposals) ||
  proposal.proposals.some(p => p.patchStatus === 'not-created');

let status = 'review-ready';
if (validatorFailures > 0) status = 'blocked-validator-failure';
else if (missingFiles > 0 || validatorMissing > 0 || proposalIncomplete) status = 'blocked-evidence-incomplete';

const bundle = {
  id: `preview-evidence-${slug(plan.scope.ruleId)}-${Date.now()}`,
  version: '1.0.0',
  status,
  generatedAt: new Date().toISOString(),
  input: {
    executionPlanFile: planRel,
    proposalManifestFile: input.proposal || null,
    requestedBy: input.requestedBy || null,
    notes: input.notes || null
  },
  fingerprints: {
    executionPlan: fingerprintRef(planRel),
    impactAnalysis: fingerprintRef(impactRef),
    approvalArtifact: fingerprintRef(approvalRef),
    proposalManifest: fingerprintRef(input.proposal)
  },
  fileEvidence,
  proposal: {
    state: proposalState,
    manifest: proposal,
    incomplete: proposalIncomplete,
    proposedPatchFilesCreated: proposal && Array.isArray(proposal.proposals)
      ? proposal.proposals.filter(p => p.proposedPatchFile).length
      : 0,
    patchesApplied: 0
  },
  validatorEvidence,
  evidenceSummary: {
    affectedFiles: fileEvidence.length,
    existingFiles: fileEvidence.filter(item => item.exists).length,
    missingFiles,
    validators: validatorEvidence.length,
    validatorPasses: validatorEvidence.filter(item => item.status === 'pass').length,
    validatorFailures,
    validatorMissing,
    proposalIncomplete
  },
  humanReview: {
    required: true,
    checklist: [
      {item:'official source verified', status:'pending'},
      {item:'legal scope reviewed', status:'pending'},
      {item:'proposed rule change reviewed', status:'pending'},
      {item:'consumer impact reviewed', status:'pending'},
      {item:'editorial impact reviewed', status:'pending'},
      {item:'preview approved', status:'pending'},
      {item:'publication explicitly approved', status:'pending'}
    ]
  },
  publicationGate: {
    open:false,
    previewReady:status === 'review-ready',
    automaticPublicationAllowed:false,
    reason: status === 'review-ready' ? 'HUMAN_APPROVAL_PENDING' : status
  },
  safety: {
    evidenceOnly:true,
    sourceFilesModified:false,
    publicFilesModified:false,
    patchesCreated:0,
    patchesApplied:0,
    commit:false,
    push:false,
    deploy:false,
    publication:false
  }
};

const output = input.output || `data/core/update/preview-evidence/${slug(plan.scope.ruleId)}.preview-evidence.json`;
write(output, bundle);

console.log(JSON.stringify({
  status: status === 'review-ready' ? 'PASS' : 'BLOCKED',
  bundleStatus: status,
  output:'/' + output.replace(/\\/g, '/'),
  affectedFiles:fileEvidence.length,
  existingFiles:fileEvidence.filter(item => item.exists).length,
  missingFiles,
  validators:validatorEvidence.length,
  validatorFailures,
  validatorMissing,
  proposalIncomplete,
  sourceMutation:0,
  publicMutation:0,
  patchesApplied:0,
  publication:0
}, null, 2));

process.exit(status === 'review-ready' ? 0 : 3);
