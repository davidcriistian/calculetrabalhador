#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}
function write(rel, data) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}
function list(obj, keys) {
  if (Array.isArray(obj)) return obj;
  for (const key of keys) if (obj && Array.isArray(obj[key])) return obj[key];
  return [];
}
function pick(obj, keys, fallback = null) {
  for (const key of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== null && obj[key] !== '' &&
        !(Array.isArray(obj[key]) && obj[key].length === 0)) return obj[key];
  }
  return fallback;
}
function id(value) {
  return value === null || value === undefined ? null : String(value).trim();
}
function resolveReference(value, knownIds, acceptedPrefixes = []) {
  const raw = id(value);
  if (!raw) return null;
  if (knownIds.has(raw)) return raw;
  for (const prefix of acceptedPrefixes) {
    if (raw.startsWith(prefix)) {
      const candidate = raw.slice(prefix.length);
      if (knownIds.has(candidate)) return candidate;
    }
  }
  return raw;
}
function indexBy(items, keys) {
  const map = new Map();
  for (const item of items) {
    const key = id(pick(item, keys));
    if (key) map.set(key, item);
  }
  return map;
}
function locateRelations(registry) {
  if (Array.isArray(registry)) return registry;
  for (const key of ['dependencies','consumers','relations','entries','items','ruleConsumers']) {
    if (registry && Array.isArray(registry[key])) return registry[key];
  }
  for (const value of Object.values(registry || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const key of ['dependencies','consumers','relations','entries','items','ruleConsumers']) {
        if (Array.isArray(value[key])) return value[key];
      }
    }
  }
  return [];
}

const articles = list(read('data/articles.json'), ['articles','items','entries']);
const tools = list(read('data/tools.json'), ['tools','items','entries']);
const content = list(read('data/maps/content-map.json'), ['content','articles','items','entries']);
const toolsMap = list(read('data/maps/tools-map.json'), ['tools','items','entries']);
const clusters = list(read('data/brain/clusters.json'), ['clusters','items','entries']);
const nuclei = list(read('data/brain/nuclei.json'), ['nuclei','items','entries']);
const relations = locateRelations(read('data/core/update/governed-rule-consumers.json'));

const articleIndex = indexBy(articles, ['id','articleId','slug']);
const toolIndex = indexBy(tools, ['id','toolId','slug']);
const toolMapIndex = indexBy(toolsMap, ['id','toolId','slug']);
const clusterIndex = indexBy(clusters, ['id','clusterId','slug']);
const nucleusIndex = indexBy(nuclei, ['id','nucleusId','slug']);

const ruleToTools = new Map();
for (const relation of relations) {
  const status = String(pick(relation, ['status','confirmationStatus','state'], 'declared')).toLowerCase();
  if (status === 'rejected') continue;
  const ruleId = id(pick(relation, ['ruleId','rule','canonicalRuleId','sourceRule','legalRuleId']));
  const consumerId = id(pick(relation, ['consumerId','assetId','toolId','calculatorId','targetId','id']));
  const type = String(pick(relation, ['consumerType','assetType','type','targetType'], '')).toLowerCase();
  if (!ruleId || !consumerId) continue;
  if (type.includes('tool') || type.includes('calculator') || toolIndex.has(consumerId) || toolMapIndex.has(consumerId)) {
    if (!ruleToTools.has(ruleId)) ruleToTools.set(ruleId, new Set());
    ruleToTools.get(ruleId).add(consumerId);
  }
}

const matrix = [];
for (const item of content) {
  const articleId = id(pick(item, ['id','articleId','contentId','slug']));
  if (!articleId) continue;
  const article = articleIndex.get(articleId) || {};
  let toolId = resolveReference(
    pick(item, ['mainTool','mainToolId','primaryTool','primaryToolId','calculator','calculatorId','tool','toolId']),
    new Set([...toolIndex.keys(), ...toolMapIndex.keys()]),
    ['tool:', 'calculator:']
  );
  let clusterId = resolveReference(
    pick(item, ['cluster','clusterId','editorialCluster']),
    new Set(clusterIndex.keys()),
    ['cluster:']
  );
  let nucleusId = resolveReference(
    pick(item, ['nucleus','nucleusId']),
    new Set(nucleusIndex.keys()),
    ['nucleus:']
  );
  let domainId = id(pick(item, ['domain','domainId']));
  const cluster = clusterIndex.get(clusterId) || {};
  if (!nucleusId) nucleusId = resolveReference(
    pick(cluster, ['nucleus','nucleusId']),
    new Set(nucleusIndex.keys()),
    ['nucleus:']
  );
  if (!domainId) domainId = id(pick(cluster, ['domain','domainId']));
  if (!toolId) toolId = resolveReference(
    pick(cluster, ['tool','toolId','calculator','calculatorId','mainTool']),
    new Set([...toolIndex.keys(), ...toolMapIndex.keys()]),
    ['tool:', 'calculator:']
  );
  let declared = pick(item, ['dependencies','rules','legalRules'], []);
  if (typeof declared === 'string') declared = [declared];
  if (!Array.isArray(declared)) declared = [];
  declared = declared.map(id).filter(Boolean);
  const derived = [];
  for (const [ruleId, toolIds] of ruleToTools.entries()) {
    if (toolId && toolIds.has(toolId)) derived.push(ruleId);
  }
  const effective = [...new Set([...declared, ...derived])].sort();
  let mandatoryLinks = pick(item, ['mandatoryLinks','requiredLinks','links'], []);
  if (!Array.isArray(mandatoryLinks)) mandatoryLinks = [mandatoryLinks].filter(Boolean);
  matrix.push({
    articleId,
    title: pick(article, ['title','name'], pick(item, ['title','name'], articleId)),
    path: pick(article, ['path','file','url','slug']),
    primaryToolId: toolId,
    clusterId,
    nucleusId,
    domainId,
    isPillar: Boolean(pick(item, ['pillar','isPillar','pillarPage'], false)),
    searchIntent: pick(item, ['searchIntent','intent']),
    reviewFrequency: pick(item, ['reviewFrequency','reviewCycle','review']),
    mandatoryLinks,
    declaredRuleDependencies: declared.sort(),
    derivedRuleDependencies: derived.sort(),
    effectiveRuleDependencies: effective,
    impactConnection: declared.length ? 'DIRECT' : (derived.length ? 'INDIRECT_VIA_TOOL' : 'UNCONNECTED'),
    sourceAuthority: '/data/maps/content-map.json'
  });
}
matrix.sort((a,b) => a.articleId.localeCompare(b.articleId));

const clusterProjection = [];
for (const [clusterId, cluster] of clusterIndex.entries()) {
  const articleIds = new Set();
  const declaredArticles = pick(cluster, ['articles','articleIds','content'], []);
  if (Array.isArray(declaredArticles)) {
    for (const value of declaredArticles) {
      articleIds.add(id(typeof value === 'object' ? pick(value, ['id','articleId','slug']) : value));
    }
  }
  for (const row of matrix) if (row.clusterId === clusterId) articleIds.add(row.articleId);
  articleIds.delete(null);
  const toolIds = new Set();
  const declaredTools = pick(cluster, ['tools','toolIds','calculators'], []);
  if (Array.isArray(declaredTools)) {
    for (const value of declaredTools) {
      toolIds.add(id(typeof value === 'object' ? pick(value, ['id','toolId','calculatorId','slug']) : value));
    }
  }
  const primary = id(pick(cluster, ['tool','toolId','calculator','calculatorId','mainTool']));
  if (primary) toolIds.add(primary);
  for (const row of matrix) if (row.clusterId === clusterId && row.primaryToolId) toolIds.add(row.primaryToolId);
  toolIds.delete(null);
  const rows = matrix.filter(row => row.clusterId === clusterId);
  const rules = [...new Set(rows.flatMap(row => row.effectiveRuleDependencies))].sort();
  clusterProjection.push({
    clusterId,
    title: pick(cluster, ['title','name'], clusterId),
    nucleusId: id(pick(cluster, ['nucleus','nucleusId'])),
    domainId: id(pick(cluster, ['domain','domainId'])),
    toolIds: [...toolIds].sort(),
    articleIds: [...articleIds].sort(),
    ruleIds: rules,
    pillarArticleIds: rows.filter(row => row.isPillar).map(row => row.articleId).sort()
  });
}
clusterProjection.sort((a,b) => a.clusterId.localeCompare(b.clusterId));

const nucleusProjection = [];
for (const [nucleusId, nucleus] of nucleusIndex.entries()) {
  const clusterIds = new Set();
  const declared = pick(nucleus, ['clusters','clusterIds'], []);
  if (Array.isArray(declared)) {
    for (const value of declared) clusterIds.add(id(typeof value === 'object' ? pick(value, ['id','clusterId','slug']) : value));
  }
  for (const c of clusterProjection) if (c.nucleusId === nucleusId) clusterIds.add(c.clusterId);
  clusterIds.delete(null);
  const rows = matrix.filter(row => row.nucleusId === nucleusId || clusterIds.has(row.clusterId));
  nucleusProjection.push({
    nucleusId,
    title: pick(nucleus, ['title','name'], nucleusId),
    status: pick(nucleus, ['status'], 'unknown'),
    clusterIds: [...clusterIds].sort(),
    toolIds: [...new Set(rows.map(row => row.primaryToolId).filter(Boolean))].sort(),
    articleIds: [...new Set(rows.map(row => row.articleId))].sort(),
    ruleIds: [...new Set(rows.flatMap(row => row.effectiveRuleDependencies))].sort(),
    pillarArticleIds: rows.filter(row => row.isPillar).map(row => row.articleId).sort()
  });
}
nucleusProjection.sort((a,b) => a.nucleusId.localeCompare(b.nucleusId));

const generatedAt = new Date().toISOString();
write('data/core/update/editorial-impact-matrix.generated.json', {
  id: 'editorial-impact-matrix',
  version: '1.0.0',
  status: 'generated-read-only',
  generatedAt,
  sourceAuthorities: {
    articles: '/data/articles.json',
    tools: '/data/tools.json',
    contentMap: '/data/maps/content-map.json',
    toolsMap: '/data/maps/tools-map.json',
    clusters: '/data/brain/clusters.json',
    nuclei: '/data/brain/nuclei.json',
    ruleConsumers: '/data/core/update/governed-rule-consumers.json'
  },
  articleCount: matrix.length,
  connectedArticleCount: matrix.filter(row => row.impactConnection !== 'UNCONNECTED').length,
  unconnectedArticleCount: matrix.filter(row => row.impactConnection === 'UNCONNECTED').length,
  articles: matrix
});
write('data/brain/editorial-clusters.generated.json', {
  id: 'editorial-cluster-impact-projection',
  version: '1.0.0',
  status: 'generated-read-only',
  generatedAt,
  sourceAuthority: '/data/brain/clusters.json',
  clusterCount: clusterProjection.length,
  clusters: clusterProjection
});
write('data/brain/editorial-nuclei.generated.json', {
  id: 'editorial-nucleus-impact-projection',
  version: '1.0.0',
  status: 'generated-read-only',
  generatedAt,
  sourceAuthority: '/data/brain/nuclei.json',
  nucleusCount: nucleusProjection.length,
  nuclei: nucleusProjection
});

console.log(JSON.stringify({
  status: 'PASS',
  articles: matrix.length,
  connected: matrix.filter(row => row.impactConnection !== 'UNCONNECTED').length,
  unconnected: matrix.filter(row => row.impactConnection === 'UNCONNECTED').length,
  clusters: clusterProjection.length,
  nuclei: nucleusProjection.length
}, null, 2));
