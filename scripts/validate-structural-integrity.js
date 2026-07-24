#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const failures = [];
const warnings = [];
const semver = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const sha256 = /^[a-f0-9]{64}$/i;
const isoDate = /^\d{4}-\d{2}-\d{2}(?:T.*)?$/;

function read(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}
function fileExists(rel) {
  return fs.existsSync(path.join(root, String(rel || '').replace(/^\/+/, '')));
}
function walk(obj, fn, pathParts=[]) {
  fn(obj, pathParts);
  if (Array.isArray(obj)) obj.forEach((v,i)=>walk(v,fn,[...pathParts,i]));
  else if (obj && typeof obj === 'object') Object.entries(obj).forEach(([k,v])=>walk(v,fn,[...pathParts,k]));
}

const files = {
  compatibility: 'data/core/update/canonical-rule-compatibility.json',
  consumers: 'data/core/update/governed-rule-consumers.json',
  impact: 'data/core/update/editorial-impact-matrix.generated.json',
  references: 'data/core/update/canonical-reference-registry.generated.json',
  validators: 'data/core/update/validator-invocation-registry.generated.json',
  classifications: 'data/core/update/reference-classification-registry.generated.json',
  vocabularies: 'data/core/update/governance-vocabularies.json',
  report: 'data/core/update/structural-integrity-report.generated.json'
};

for (const [name, rel] of Object.entries(files)) {
  if (!fileExists(rel)) failures.push(`MISSING_ARTIFACT:${name}:${rel}`);
}

const loaded = {};
for (const [name, rel] of Object.entries(files)) {
  if (fileExists(rel)) loaded[name] = read(rel);
}

for (const [name, obj] of Object.entries(loaded)) {
  if (obj.version && !semver.test(obj.version)) failures.push(`INVALID_VERSION:${name}:${obj.version}`);
  if (obj.id !== undefined && (typeof obj.id !== 'string' || !obj.id.trim())) failures.push(`INVALID_ID:${name}`);
  for (const key of ['createdAt','updatedAt','generatedAt']) {
    if (obj[key] && !isoDate.test(obj[key])) failures.push(`INVALID_DATE:${name}:${key}:${obj[key]}`);
  }
  walk(obj, (value, p) => {
    const key = String(p[p.length-1] || '');
    if (/sha256|fingerprint/i.test(key) && typeof value === 'string' && value && !sha256.test(value)) {
      failures.push(`INVALID_FINGERPRINT:${name}:${p.join('.')}`);
    }
  });
}

if (loaded.references) {
  const refs = loaded.references.references || [];
  for (const ref of refs) {
    if (!['resolved','ambiguous','unresolved','invalid'].includes(ref.status)) failures.push(`INVALID_REFERENCE_STATUS:${ref.original}`);
    if (ref.status === 'resolved' && (!ref.resolvedPath || !fileExists(ref.resolvedPath))) {
      failures.push(`BROKEN_RESOLVED_REFERENCE:${ref.original}`);
    }
    if (ref.status === 'ambiguous' && (!Array.isArray(ref.candidates) || ref.candidates.length < 2)) {
      failures.push(`AMBIGUITY_NOT_PRESERVED:${ref.original}`);
    }
  }
}

if (loaded.classifications && loaded.references) {
  const classified = new Map((loaded.classifications.entries || []).map(x => [String(x.original), x]));
  for (const ref of loaded.references.references || []) {
    if (ref.status !== 'resolved' && !classified.has(String(ref.original))) {
      failures.push(`UNCLASSIFIED_UNRESOLVED_REFERENCE:${ref.original}`);
    }
  }
  const allowed = new Set((loaded.vocabularies?.vocabularies?.referenceClassification) || []);
  for (const entry of loaded.classifications.entries || []) {
    if (!allowed.has(entry.classification)) failures.push(`INVALID_REFERENCE_CLASSIFICATION:${entry.original}:${entry.classification}`);
  }
}

if (loaded.validators) {
  for (const val of loaded.validators.validators || []) {
    if (val.resolution?.status === 'resolved') {
      if (!val.resolution.resolvedPath || !fileExists(val.resolution.resolvedPath)) {
        failures.push(`BROKEN_VALIDATOR_PATH:${val.reference}`);
      }
    } else {
      failures.push(`UNRESOLVED_VALIDATOR:${val.reference}`);
    }
    if (!val.invocation || !Array.isArray(val.invocation.arguments)) {
      failures.push(`VALIDATOR_INVOCATION_INVALID:${val.reference}`);
    }
  }
}

for (const [name, obj] of Object.entries(loaded)) {
  if (String(obj.status || '').includes('generated') && obj.status !== 'generated-read-only') {
    const legacyGeneratedStatuses = new Set(['generated-internal-report']);
    if (legacyGeneratedStatuses.has(obj.status)) {
      warnings.push(`LEGACY_GENERATED_STATUS:${name}:${obj.status}`);
    } else {
      failures.push(`GENERATED_ARTIFACT_NOT_READ_ONLY:${name}:${obj.status}`);
    }
  }
  walk(obj, (value, p) => {
    const key = String(p[p.length-1] || '');
    if (key === 'publicationGate' && value && typeof value === 'object' && value.open === true) {
      failures.push(`PUBLICATION_GATE_OPEN:${name}:${p.join('.')}`);
    }
    if (/automatic.*allowed/i.test(key) && value === true) {
      failures.push(`AUTOMATIC_MUTATION_ENABLED:${name}:${p.join('.')}`);
    }
  });
}

// Cross-reference preservation checks
const referenceCount = loaded.references?.summary?.references;
const classificationCount = loaded.classifications?.entries?.length;
if (Number.isInteger(referenceCount) && referenceCount !== classificationCount) {
  failures.push(`REFERENCE_CLASSIFICATION_COUNT_MISMATCH:${referenceCount}:${classificationCount}`);
}

const result = {
  status: failures.length ? 'FAIL' : 'PASS',
  failures,
  warnings,
  checkedArtifacts: Object.keys(loaded),
  summary: {
    failures: failures.length,
    warnings: warnings.length,
    references: loaded.references?.summary || null,
    validators: loaded.validators?.summary || null,
    classifications: loaded.classifications?.summary || null
  }
};

if (failures.length) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(result, null, 2));
