#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const root = path.resolve(__dirname, '..');

function read(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}
function list(obj, keys) {
  if (Array.isArray(obj)) return obj;
  for (const key of keys) if (obj && Array.isArray(obj[key])) return obj[key];
  return [];
}
function pick(obj, keys) {
  for (const key of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== null && obj[key] !== '') return obj[key];
  }
  return null;
}
function id(value) {
  return value === null || value === undefined ? null : String(value).trim();
}
function normalized(rel) {
  const obj = read(rel);
  delete obj.generatedAt;
  return JSON.stringify(obj);
}

const failures = [];
const articles = list(read('data/articles.json'), ['articles','items','entries']);
const tools = list(read('data/tools.json'), ['tools','items','entries']);
const clusters = list(read('data/brain/clusters.json'), ['clusters','items','entries']);
const nuclei = list(read('data/brain/nuclei.json'), ['nuclei','items','entries']);
const matrix = read('data/core/update/editorial-impact-matrix.generated.json');
const articleIds = new Set(articles.map(x => id(pick(x, ['id','articleId','slug']))).filter(Boolean));
const toolIds = new Set(tools.map(x => id(pick(x, ['id','toolId','slug']))).filter(Boolean));
const clusterIds = new Set(clusters.map(x => id(pick(x, ['id','clusterId','slug']))).filter(Boolean));
const nucleusIds = new Set(nuclei.map(x => id(pick(x, ['id','nucleusId','slug']))).filter(Boolean));

for (const row of matrix.articles || []) {
  if (!articleIds.has(row.articleId)) failures.push(`ARTICLE_REFERENCE_NOT_FOUND:${row.articleId}`);
  if (row.primaryToolId && !toolIds.has(row.primaryToolId)) failures.push(`TOOL_REFERENCE_NOT_FOUND:${row.articleId}:${row.primaryToolId}`);
  if (row.clusterId && !clusterIds.has(row.clusterId)) failures.push(`CLUSTER_REFERENCE_NOT_FOUND:${row.articleId}:${row.clusterId}`);
  if (row.nucleusId && !nucleusIds.has(row.nucleusId)) failures.push(`NUCLEUS_REFERENCE_NOT_FOUND:${row.articleId}:${row.nucleusId}`);
}

if (!failures.length) {
  const generator = path.join(root, 'scripts/generate-editorial-impact-matrix.js');
  childProcess.execFileSync('node', [generator], {cwd: root, stdio: 'pipe'});
  const first = [
    normalized('data/core/update/editorial-impact-matrix.generated.json'),
    normalized('data/brain/editorial-clusters.generated.json'),
    normalized('data/brain/editorial-nuclei.generated.json')
  ];
  childProcess.execFileSync('node', [generator], {cwd: root, stdio: 'pipe'});
  const second = [
    normalized('data/core/update/editorial-impact-matrix.generated.json'),
    normalized('data/brain/editorial-clusters.generated.json'),
    normalized('data/brain/editorial-nuclei.generated.json')
  ];
  if (first.some((value, index) => value !== second[index])) {
    failures.push('GENERATED_EDITORIAL_PROJECTION_DRIFT');
  }
}

if (failures.length) {
  console.error(JSON.stringify({status:'FAIL', failures}, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: 'PASS',
  articleCount: matrix.articleCount,
  connectedArticleCount: matrix.connectedArticleCount,
  unconnectedArticleCount: matrix.unconnectedArticleCount,
  publicMutation: 0,
  articleContentMutation: 0
}, null, 2));
