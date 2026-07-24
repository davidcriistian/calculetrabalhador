#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

const args = process.argv.slice(2);
const input = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--impact') input.impact = args[++i];
  else if (args[i] === '--approval') input.approval = args[++i];
  else if (args[i] === '--requested-by') input.requestedBy = args[++i];
  else if (args[i] === '--change-window') input.changeWindow = args[++i];
  else if (args[i] === '--notes') input.notes = args[++i];
  else if (args[i] === '--output') input.output = args[++i];
}

if (!input.impact) {
  console.error(JSON.stringify({status:'FAIL', failures:['IMPACT_ANALYSIS_REQUIRED']}, null, 2));
  process.exit(2);
}

const impactFile = path.isAbsolute(input.impact) ? input.impact : path.join(root, input.impact);
let impact;
try { impact = read(impactFile); } catch (error) {
  console.error(JSON.stringify({status:'FAIL', failures:[`IMPACT_ANALYSIS_INVALID:${error.message}`]}, null, 2));
  process.exit(2);
}

const impactRel = path.relative(root, impactFile).replace(/\\/g, '/');
const requiredRoles = ['domain-owner','legal-reviewer','publishing-owner'];
let approval = null;
let approvalState = 'missing';
let approvalFailures = [];

if (input.approval) {
  const approvalFile = path.isAbsolute(input.approval) ? input.approval : path.join(root, input.approval);
  try {
    approval = read(approvalFile);
    approvalState = 'present';
    if (approval.status !== 'approved') approvalFailures.push('APPROVAL_NOT_APPROVED');
    if (String(approval.ruleId) !== String(impact.input.ruleId)) approvalFailures.push('APPROVAL_RULE_MISMATCH');
    if (String(approval.impactAnalysisFile).replace(/^\/+/, '') !== impactRel.replace(/^\/+/, '')) {
      approvalFailures.push('APPROVAL_IMPACT_MISMATCH');
    }
    const expires = Date.parse(approval.expiresAt);
    if (!Number.isFinite(expires) || expires <= Date.now()) approvalFailures.push('APPROVAL_EXPIRED');
    const approvals = Array.isArray(approval.approvals) ? approval.approvals : [];
    for (const role of requiredRoles) {
      const item = approvals.find(a => a.role === role);
      if (!item) approvalFailures.push(`APPROVAL_ROLE_MISSING:${role}`);
      else if (item.decision !== 'approved') approvalFailures.push(`APPROVAL_NOT_APPROVED:${role}`);
    }
  } catch (error) {
    approvalState = 'invalid';
    approvalFailures.push(`APPROVAL_FILE_INVALID:${error.message}`);
  }
}

let status = 'blocked-awaiting-approval';
if (approvalState === 'present' && approvalFailures.length === 0) status = 'approved-plan-read-only';
else if (approvalState !== 'missing') status = 'blocked-invalid-approval';

if (impact.status !== 'generated-read-only' || !impact.resolution || impact.resolution.ruleFound !== true) {
  status = 'blocked-invalid-approval';
  approvalFailures.push('IMPACT_ANALYSIS_UNRESOLVED');
}

const affectedFiles = unique(impact.affectedFiles || []);
const operations = [
  {
    order: 1,
    id: 'capture-prechange-fingerprints',
    action: 'CAPTURE_FINGERPRINTS',
    mode: 'manual-controlled',
    targets: affectedFiles,
    mutationAllowed: false,
    status: 'pending'
  },
  {
    order: 2,
    id: 'verify-legal-source',
    action: 'VERIFY_OFFICIAL_SOURCE',
    mode: 'human-required',
    targets: [impact.resolution.canonicalRuleFile].filter(Boolean),
    mutationAllowed: false,
    status: 'pending'
  },
  {
    order: 3,
    id: 'prepare-rule-change',
    action: 'PREPARE_CANONICAL_RULE_PATCH',
    mode: 'human-authored',
    targets: [impact.resolution.canonicalRuleFile].filter(Boolean),
    mutationAllowed: false,
    status: 'pending'
  },
  {
    order: 4,
    id: 'prepare-consumer-updates',
    action: 'PREPARE_CONSUMER_PATCHES',
    mode: 'human-authored',
    targets: affectedFiles.filter(file => file !== impact.resolution.canonicalRuleFile),
    mutationAllowed: false,
    status: 'pending'
  },
  {
    order: 5,
    id: 'run-validation-suite',
    action: 'RUN_VALIDATORS',
    mode: 'automation-after-manual-change',
    targets: (impact.validationPlan || []).map(v => v.validator),
    mutationAllowed: false,
    status: 'pending'
  },
  {
    order: 6,
    id: 'generate-preview',
    action: 'GENERATE_PREVIEW',
    mode: 'manual-controlled',
    targets: [],
    mutationAllowed: false,
    status: 'pending'
  },
  {
    order: 7,
    id: 'publication-approval',
    action: 'FINAL_PUBLICATION_APPROVAL',
    mode: 'human-required',
    targets: [],
    mutationAllowed: false,
    status: 'pending'
  }
];

const plan = {
  id: `controlled-execution-plan-${slug(impact.input.ruleId)}-${Date.now()}`,
  version: '1.0.0',
  status,
  generatedAt: new Date().toISOString(),
  input: {
    impactAnalysisFile: impactRel,
    impactAnalysisSha256: sha256(impactFile),
    approvalFile: input.approval || null,
    requestedBy: input.requestedBy || null,
    changeWindow: input.changeWindow || null,
    notes: input.notes || null
  },
  approval: {
    required: true,
    state: approvalState,
    valid: approvalState === 'present' && approvalFailures.length === 0,
    failures: approvalFailures,
    requiredRoles,
    artifact: approval
  },
  scope: {
    ruleId: impact.input.ruleId,
    impactLevel: impact.resolution.impactLevel,
    canonicalRuleFile: impact.resolution.canonicalRuleFile,
    affectedFiles,
    directConsumers: impact.impactSummary.typedRelations,
    tools: impact.impactSummary.tools,
    articles: impact.impactSummary.articles,
    clusters: impact.impactSummary.clusters,
    nuclei: impact.impactSummary.nuclei,
    pillarArticles: impact.impactSummary.pillarArticles
  },
  preconditions: [
    {id:'impact-analysis-valid', required:true, status:'satisfied'},
    {id:'human-approval-artifact-valid', required:true, status: status === 'approved-plan-read-only' ? 'satisfied' : 'blocked'},
    {id:'official-source-verified', required:true, status:'pending'},
    {id:'rollback-baseline-available', required:true, status:'pending'},
    {id:'change-window-approved', required:true, status: input.changeWindow ? 'declared' : 'pending'}
  ],
  operations,
  validationSequence: (impact.validationPlan || []).map((item, index) => ({
    order:index + 1,
    validator:item.validator,
    required:true,
    status:'pending'
  })),
  rollbackPlan: {
    required:true,
    baselineType:'pre-change file fingerprints plus approved repository baseline',
    actions:[
      'stop publication',
      'restore canonical rule from approved baseline',
      'restore consumer files from approved baseline',
      'regenerate derived projections',
      'run full validation sequence',
      'record rollback evidence'
    ],
    automaticRollbackAllowed:false
  },
  publicationGate: {
    open:false,
    requiredApprovals:requiredRoles,
    previewRequired:true,
    allValidatorsMustPass:true,
    unresolvedWarningsAllowed:false,
    automaticPublicationAllowed:false
  },
  safety: {
    planningOnly:true,
    sourceFilesModified:false,
    publicFilesModified:false,
    commit:false,
    push:false,
    deploy:false,
    automaticExecutionAllowed:false
  }
};

const output = input.output || `data/core/update/execution-plans/${slug(impact.input.ruleId)}.execution-plan.json`;
write(output, plan);

console.log(JSON.stringify({
  status: status === 'approved-plan-read-only' ? 'PASS' : 'BLOCKED',
  planStatus: status,
  output: '/' + output.replace(/\\/g, '/'),
  ruleId: impact.input.ruleId,
  operations: operations.length,
  approvalValid: plan.approval.valid,
  sourceMutation: 0,
  publicMutation: 0,
  commit: 0,
  push: 0,
  deploy: 0
}, null, 2));

process.exit(status === 'approved-plan-read-only' ? 0 : 3);
