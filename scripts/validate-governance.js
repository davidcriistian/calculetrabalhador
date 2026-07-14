const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const FILES = {
  tools: 'data/tools.json',
  articles: 'data/articles.json',
  toolsMap: 'data/maps/tools-map.json',
  contentMap: 'data/maps/content-map.json',
  updateMap: 'data/maps/update-map.json',
  dependencies: 'data/brain/dependencies.json',
  clusters: 'data/brain/clusters.json',
  strategyClusters: 'data/strategy/clusters/index.json',
  validationRules: 'data/brain/validation-rules.json'
};

const VALID_CATEGORIES = new Set([
  'catalog',
  'content',
  'tool',
  'cluster',
  'sitemap',
  'rules',
  'governance'
]);

const VALID_SEVERITIES = new Set(['critical', 'high', 'medium', 'low']);

const errors = [];
const sectionStatus = {
  JSON: true,
  Tools: true,
  Articles: true,
  Clusters: true,
  'Update Map': true,
  Dependencies: true,
  'Validation Rules': true
};

function fail(section, message) {
  sectionStatus[section] = false;
  errors.push(message);
}

function readJson(key) {
  const relativePath = FILES[key];
  const fullPath = path.join(ROOT, relativePath);

  try {
    const raw = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    fail('JSON', `${relativePath}: invalid JSON or unreadable file (${error.message})`);
    return null;
  }
}

function arrayFrom(value) {
  return Array.isArray(value) ? value : [];
}

function normalizePath(value) {
  if (!value || typeof value !== 'string') return null;

  let normalized = value.trim();
  const origin = 'https://calculetrabalhador.com.br';

  if (normalized.startsWith(origin)) {
    normalized = normalized.slice(origin.length);
  }

  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }

  if (!normalized.endsWith('/')) {
    normalized = `${normalized}/`;
  }

  return normalized;
}

function normalizedSlug(item) {
  return normalizePath(item.url || item.slug);
}

function indexBy(items, field) {
  const map = new Map();

  for (const item of items) {
    map.set(item[field], item);
  }

  return map;
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    } else {
      seen.add(value);
    }
  }

  return [...duplicates];
}

function fileExistsForSlug(slug) {
  const normalized = normalizePath(slug);
  if (!normalized) return false;

  const relative = normalized.replace(/^\/|\/$/g, '');
  return fs.existsSync(path.join(ROOT, relative, 'index.html'));
}

function sameSet(a, b) {
  const left = [...a].sort();
  const right = [...b].sort();
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function validateTools(data) {
  const { tools, toolsMap } = data;
  const toolsItems = arrayFrom(tools);
  const mapItems = arrayFrom(toolsMap.items);
  const toolsById = indexBy(toolsItems, 'id');
  const mapById = indexBy(mapItems, 'id');

  for (const tool of toolsItems) {
    if (!mapById.has(tool.id)) {
      fail('Tools', `Tool missing in tools-map: ${tool.id}`);
    }

    if (!fileExistsForSlug(tool.slug)) {
      fail('Tools', `Tool HTML missing: ${tool.id} (${tool.slug})`);
    }
  }

  for (const tool of mapItems) {
    if (!toolsById.has(tool.id)) {
      fail('Tools', `Extra tool in tools-map: ${tool.id}`);
    }
  }

  for (const id of findDuplicates(toolsItems.map((item) => item.id))) {
    fail('Tools', `Duplicate tool id in tools.json: ${id}`);
  }

  for (const id of findDuplicates(mapItems.map((item) => item.id))) {
    fail('Tools', `Duplicate tool id in tools-map: ${id}`);
  }

  for (const slug of findDuplicates(toolsItems.map((item) => normalizePath(item.slug)))) {
    fail('Tools', `Duplicate tool slug in tools.json: ${slug}`);
  }

  for (const slug of findDuplicates(mapItems.map((item) => normalizePath(item.slug)))) {
    fail('Tools', `Duplicate tool slug in tools-map: ${slug}`);
  }
}

function validateArticles(data) {
  const { articles, contentMap, tools } = data;
  const articleItems = arrayFrom(articles);
  const contentItems = arrayFrom(contentMap.items);
  const articlesById = indexBy(articleItems, 'id');
  const contentById = indexBy(contentItems, 'id');
  const toolIds = new Set(arrayFrom(tools).map((item) => item.id));

  for (const article of articleItems) {
    if (!contentById.has(article.id)) {
      fail('Articles', `Article missing in content-map: ${article.id}`);
    }

    if (!fileExistsForSlug(normalizedSlug(article))) {
      fail('Articles', `Article HTML missing: ${article.id} (${article.slug})`);
    }
  }

  for (const article of contentItems) {
    if (!articlesById.has(article.id)) {
      fail('Articles', `Extra article in content-map: ${article.id}`);
    }

    if (!toolIds.has(article.primaryTool)) {
      fail('Articles', `Invalid primaryTool for ${article.id}: ${article.primaryTool}`);
    }
  }

  for (const id of findDuplicates(articleItems.map((item) => item.id))) {
    fail('Articles', `Duplicate article id in articles.json: ${id}`);
  }

  for (const id of findDuplicates(contentItems.map((item) => item.id))) {
    fail('Articles', `Duplicate article id in content-map: ${id}`);
  }

  for (const slug of findDuplicates(articleItems.map(normalizedSlug))) {
    fail('Articles', `Duplicate article slug in articles.json: ${slug}`);
  }

  for (const slug of findDuplicates(contentItems.map(normalizedSlug))) {
    fail('Articles', `Duplicate article slug in content-map: ${slug}`);
  }
}

function validateClusters(data) {
  const { clusters, strategyClusters, contentMap, toolsMap } = data;
  const clusterItems = arrayFrom(clusters.items);
  const strategicItems = arrayFrom(strategyClusters.items);
  const contentItems = arrayFrom(contentMap.items);
  const toolIds = new Set(arrayFrom(toolsMap.items).map((item) => item.id));
  const contentIds = new Set(contentItems.map((item) => item.id));

  for (const cluster of clusterItems) {
    if (!toolIds.has(cluster.primaryTool)) {
      fail('Clusters', `Invalid primaryTool for cluster ${cluster.clusterId}: ${cluster.primaryTool}`);
    }

    if (cluster.assetId) {
      const strategicCluster = strategicItems.find((item) => item.assetId === cluster.assetId);
      if (!strategicCluster || strategicCluster.clusterId !== cluster.clusterId) {
        fail('Clusters', `Typed cluster is missing from strategy registry: ${cluster.assetId}`);
      } else if (strategicCluster.primaryCalculator !== `calculator:${cluster.primaryTool}`) {
        fail('Clusters', `Typed cluster primary calculator mismatch: ${cluster.assetId}`);
      }
    } else if (!toolIds.has(cluster.clusterId)) {
      fail('Clusters', `Legacy cluster id does not match an existing tool: ${cluster.clusterId}`);
    }

    const realCount = contentItems.filter((item) => item.clusterId === cluster.clusterId).length;
    const declaredArticles = arrayFrom(cluster.articles);

    if (cluster.articleCount !== realCount || declaredArticles.length !== realCount) {
      fail(
        'Clusters',
        `Cluster article count mismatch for ${cluster.clusterId}: declared=${cluster.articleCount}, listed=${declaredArticles.length}, real=${realCount}`
      );
    }

    for (const articleId of declaredArticles) {
      if (!contentIds.has(articleId)) {
        fail('Clusters', `Cluster ${cluster.clusterId} references unknown article: ${articleId}`);
      }
    }
  }

  for (const id of findDuplicates(clusterItems.map((item) => item.clusterId))) {
    fail('Clusters', `Duplicate clusterId: ${id}`);
  }
}

function validateUpdateAndDependencies(data) {
  const { updateMap, dependencies, toolsMap, clusters } = data;
  const updateItems = arrayFrom(updateMap.items);
  const dependencyItems = arrayFrom(dependencies.items);
  const updateByRule = indexBy(updateItems, 'ruleId');
  const dependencyByRule = indexBy(dependencyItems, 'ruleId');
  const toolIds = new Set(arrayFrom(toolsMap.items).map((item) => item.id));
  const clusterIds = new Set(arrayFrom(clusters.items).map((item) => item.clusterId));

  for (const update of updateItems) {
    if (!dependencyByRule.has(update.ruleId)) {
      fail('Update Map', `ruleId missing in dependencies: ${update.ruleId}`);
    }

    for (const toolId of arrayFrom(update.impactedTools)) {
      if (!toolIds.has(toolId)) {
        fail('Update Map', `Update Map rule ${update.ruleId} references unknown tool: ${toolId}`);
      }
    }

    for (const clusterId of arrayFrom(update.impactedClusters)) {
      if (!clusterIds.has(clusterId)) {
        fail('Update Map', `Update Map rule ${update.ruleId} references unknown cluster: ${clusterId}`);
      }
    }
  }

  for (const dependency of dependencyItems) {
    if (!updateByRule.has(dependency.ruleId)) {
      fail('Dependencies', `ruleId missing in update-map: ${dependency.ruleId}`);
      continue;
    }

    const update = updateByRule.get(dependency.ruleId);

    if (!sameSet(arrayFrom(dependency.tools), arrayFrom(update.impactedTools))) {
      fail('Dependencies', `Tool impact mismatch for rule: ${dependency.ruleId}`);
    }

    if (!sameSet(arrayFrom(dependency.clusters), arrayFrom(update.impactedClusters))) {
      fail('Dependencies', `Cluster impact mismatch for rule: ${dependency.ruleId}`);
    }

    if (dependency.estimatedArticles !== update.estimatedAffectedArticles) {
      fail('Dependencies', `Article impact mismatch for rule: ${dependency.ruleId}`);
    }

    if (dependency.risk !== update.risk) {
      fail('Dependencies', `Risk mismatch for rule: ${dependency.ruleId}`);
    }
  }

  for (const id of findDuplicates(updateItems.map((item) => item.ruleId))) {
    fail('Update Map', `Duplicate ruleId in update-map: ${id}`);
  }

  for (const id of findDuplicates(dependencyItems.map((item) => item.ruleId))) {
    fail('Dependencies', `Duplicate ruleId in dependencies: ${id}`);
  }
}

function validateValidationRules(data) {
  const validationItems = arrayFrom(data.validationRules.items);

  for (const id of findDuplicates(validationItems.map((item) => item.ruleId))) {
    fail('Validation Rules', `Duplicate validation ruleId: ${id}`);
  }

  for (const rule of validationItems) {
    if (!VALID_CATEGORIES.has(rule.category)) {
      fail('Validation Rules', `Invalid category for ${rule.ruleId}: ${rule.category}`);
    }

    if (!VALID_SEVERITIES.has(rule.severity)) {
      fail('Validation Rules', `Invalid severity for ${rule.ruleId}: ${rule.severity}`);
    }

    if (typeof rule.enabled !== 'boolean') {
      fail('Validation Rules', `enabled must be boolean for ${rule.ruleId}`);
    }
  }
}

function printReport() {
  console.log('Governance Validation Report');
  console.log('');

  for (const [section, passed] of Object.entries(sectionStatus)) {
    console.log(`${section}: ${passed ? 'OK' : 'FAIL'}`);
  }

  console.log('');

  if (errors.length === 0) {
    console.log('Result: PASS');
    return;
  }

  console.log('Result: FAIL');
  console.log('Errors:');
  for (const error of errors) {
    console.log(`- ${error}`);
  }
}

const data = {
  tools: readJson('tools'),
  articles: readJson('articles'),
  toolsMap: readJson('toolsMap'),
  contentMap: readJson('contentMap'),
  updateMap: readJson('updateMap'),
  dependencies: readJson('dependencies'),
  clusters: readJson('clusters'),
  strategyClusters: readJson('strategyClusters'),
  validationRules: readJson('validationRules')
};

if (errors.length === 0) {
  validateTools(data);
  validateArticles(data);
  validateClusters(data);
  validateUpdateAndDependencies(data);
  validateValidationRules(data);
}

printReport();
process.exitCode = errors.length === 0 ? 0 : 1;
