#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const targets = [
  'data/core/update/canonical-rule-compatibility.json',
  'data/core/update/governed-rule-consumers.json',
  'data/core/update/editorial-impact-matrix.generated.json',
  'data/core/update/canonical-reference-registry.generated.json',
  'data/core/update/validator-invocation-registry.generated.json',
  'data/core/update/reference-classification-registry.generated.json',
  'data/core/update/governance-vocabularies.json'
];

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

const artifacts = targets.map(rel => {
  const file = path.join(root, rel);
  return {
    file: rel,
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256(file) : null,
    size: fs.existsSync(file) ? fs.statSync(file).size : null
  };
});

const report = {
  id: 'structural-integrity-report',
  version: '1.0.0',
  status: 'generated-read-only',
  generatedAt: new Date().toISOString(),
  artifacts,
  summary: {
    total: artifacts.length,
    existing: artifacts.filter(x => x.exists).length,
    missing: artifacts.filter(x => !x.exists).length
  },
  safety: {
    sourceFilesModified: false,
    publicFilesModified: false,
    publication: false
  }
};

const out = path.join(root, 'data/core/update/structural-integrity-report.generated.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({status:'PASS', output:'/data/core/update/structural-integrity-report.generated.json', summary:report.summary}, null, 2));
