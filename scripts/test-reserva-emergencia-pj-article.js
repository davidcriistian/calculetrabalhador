const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const parse = (relative) => JSON.parse(read(relative));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const slug = 'como-montar-uma-reserva-de-emergencia-sendo-pj';
const route = `/blog/${slug}/`;
const canonical = `https://calculetrabalhador.com.br${route}`;
const html = read(`blog/${slug}/index.html`);

assert(!html.includes('Ã') && !html.includes('â€'), 'UTF-8 mojibake detected.');
assert((html.match(/<h1\b/gi) || []).length === 1, 'Article must have exactly one H1.');
assert(html.includes('<title>Como Montar uma Reserva de Emergência Sendo PJ</title>'), 'Expected SEO title missing.');
assert(html.includes(`<link rel="canonical" href="${canonical}"`), 'Canonical is missing or incorrect.');
const seoTitle = html.match(/<title>(.*?)<\/title>/i)[1];
const seoDescription = html.match(/<meta name="description" content="(.*?)"/i)[1];
assert(seoTitle.length >= 45 && seoTitle.length <= 65, `SEO title length outside target: ${seoTitle.length}.`);
assert(seoDescription.length >= 120 && seoDescription.length <= 160, `SEO description length outside target: ${seoDescription.length}.`);

const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map((match) => JSON.parse(match[1]));
const nodes = schemas.flatMap((schema) => schema['@graph'] || [schema]);
for (const type of ['Article', 'FAQPage', 'BreadcrumbList']) assert(nodes.some((node) => node['@type'] === type), `${type} schema missing.`);

const faq = nodes.find((node) => node['@type'] === 'FAQPage');
const clean = (value) => value.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
const visibleFaq = [...html.matchAll(/<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>\s*<\/details>/gi)]
  .map((match) => ({ question: clean(match[1]), answer: clean(match[2]) }));
assert(visibleFaq.length === 14, `Expected 14 visible FAQs; found ${visibleFaq.length}.`);
assert(faq.mainEntity.length === visibleFaq.length, 'Visible and structured FAQ counts differ.');
visibleFaq.forEach((item, index) => {
  assert(faq.mainEntity[index].name === item.question, `FAQ question ${index + 1} differs from schema.`);
  assert(faq.mainEntity[index].acceptedAnswer.text === item.answer, `FAQ answer ${index + 1} differs from schema.`);
});

const visibleText = html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[^;]+;/g, ' ');
const wordCount = (visibleText.match(/[A-Za-zÀ-ÿ0-9]+/g) || []).length;
assert(wordCount >= 2500, `Article is too short: ${wordCount} words.`);
assert(wordCount <= 4300, `Article exceeds intended scope: ${wordCount} words.`);

for (const marker of ['resumo-title', 'sumario-title', 'CTA_CARD_V1_Principal', 'CTA_CARD_V1_Secundario', 'CTA_CARD_V1_Final', 'Ads01', 'Ads02', 'Ads03', 'Ads04', 'faq-title', 'fontes-title', 'relacionados-title', 'aviso-title']) {
  assert(html.includes(marker), `Required module missing: ${marker}.`);
}
assert((html.match(/href="\/calculadora-reserva-financeira-pj\/"/g) || []).length >= 4, 'Primary calculator must appear in content and all CTAs.');

for (const href of ['/blog/como-organizar-as-financas-sendo-pj/', '/calculadora-reserva-financeira-pj/', '/calculadora-custo-mensal-pj/', '/calculadora-ferias-pj/', '/guias/pj/']) {
  assert(html.includes(`href="${href}"`), `Required internal link missing: ${href}.`);
  assert(fs.existsSync(path.join(root, href, 'index.html')), `Internal destination does not exist: ${href}.`);
}

const articles = parse('data/articles.json');
const contentMap = parse('data/maps/content-map.json').items;
const clusters = parse('data/brain/clusters.json').items;
const strategyClusters = parse('data/strategy/clusters/index.json').items;
const nuclei = parse('data/brain/nuclei.json').items;
const registry = parse('data/registry/by-type/index.json').entries;
const publishing = parse('data/publishing/registry/index.json').draftEntries;
const metadata = parse('data/editorial-metadata.json');

assert(articles.filter((item) => item.id === slug).length === 1, 'Catalog identity must occur exactly once.');
assert(contentMap.filter((item) => item.id === slug).length === 1, 'Content-map identity must occur exactly once.');
assert(registry.filter((item) => item.assetId === `article:${slug}`).length === 1, 'Article registry identity must occur exactly once.');
assert(registry.filter((item) => item.assetId === 'cluster:pj-financas').length === 1, 'Cluster registry identity must occur exactly once.');
assert(publishing.filter((item) => item.assetId === `article:${slug}`).length === 1, 'Article publishing identity must occur exactly once.');
assert(publishing.filter((item) => item.assetId === 'cluster:pj-financas').length === 1, 'Cluster publishing identity must occur exactly once.');
assert(metadata[route], 'Editorial metadata entry missing.');

const cluster = clusters.find((item) => item.assetId === 'cluster:pj-financas');
assert(cluster && cluster.pillarArticle === 'como-organizar-as-financas-sendo-pj', 'Cluster pillar is unresolved.');
assert(cluster.articleRoles[slug] === 'CORE_SUPPORT', 'Article role must be CORE_SUPPORT.');
assert(cluster.primaryTool === 'calculadora-reserva-financeira-pj', 'Primary calculator relationship is incorrect.');
const strategyCluster = strategyClusters.find((item) => item.assetId === 'cluster:pj-financas');
assert(strategyCluster && strategyCluster.pillarArticle === 'article:como-organizar-as-financas-sendo-pj', 'Strategy cluster is missing or invalid.');
assert(strategyCluster.satelliteArticles.includes(`article:${slug}`), 'Strategy cluster support article is missing.');

const pj = nuclei.find((item) => item.id === 'pj');
assert(pj && pj.articleFilter.slugs.filter((item) => item === slug).length === 1, 'PJ nucleus relationship missing or duplicated.');
assert((read('guias/pj/index.html').match(new RegExp(slug, 'g')) || []).length === 2, 'Guide relationship must exist once in schema and once visibly.');
assert(read('blog/como-organizar-as-financas-sendo-pj/index.html').includes(`href="${route}"`), 'Pillar inbound link is missing.');
assert((read('sitemap.xml').match(new RegExp(canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length === 1, 'Sitemap URL missing or duplicated.');

console.log(`Reserva de emergência PJ article: PASS (${wordCount} visible words, 14 FAQ pairs, cluster/catalog/SEO integration valid).`);
