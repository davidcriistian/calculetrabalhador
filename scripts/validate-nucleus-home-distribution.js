const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const json = (relativePath) => JSON.parse(read(relativePath));

const evaluateFixture = (input) => {
  if (input.themeAmbiguous === true) return 'MANUAL_DECISION_REQUIRED';
  if (input.assetEvent === 'FIRST_CALCULATOR' && input.nucleusExists === false && input.rendered === false) return 'NUCLEUS_CANDIDATE';
  if (input.assetEvent === 'FIRST_ARTICLE' && input.nucleusExists === false && input.themeAmbiguous === false && input.eligibleArticleCount > 0 && input.rendered === true) return 'NUCLEUS_PROVISIONED';

  const fails = [
    input.sectionRole === 'GUIDE_ASSET_CARD',
    input.mobileMode && input.mobileMode !== 'CAROUSEL',
    Number(input.mobileVisible) > 6,
    input.desktopMode && input.desktopMode !== 'GRID',
    Number(input.desktopVisible) > 9,
    input.eligibleArticleCount === 0 && input.rendered === true,
    Number(input.eligibleArticleCount) > 0 && input.rendered === false && input.catalogLoad !== 'FAIL',
    input.membershipValid === false,
    input.filterType === 'TEXT_HEURISTIC',
    input.duplicateSection === true,
    input.duplicateCards === true,
    input.sourcesSame === false,
    input.viewAllRole && input.viewAllRole !== 'CATEGORY_PAGE',
    input.catalogLoad === 'FAIL' && input.homeFunctional !== true
  ];

  return fails.some(Boolean) ? 'FAIL' : 'PASS';
};

const findings = [];
const assert = (condition, id, evidence) => findings.push({ id, status: condition ? 'PASS' : 'FAIL', evidence });

const nucleiPayload = json('data/brain/nuclei.json');
const articles = json('data/articles.json');
const fixtures = json('data/pos/validation/nucleus-home-distribution-fixtures.json');
const homeJs = read('assets/home-refactor-v8.js');
const nucleiJs = read('assets/js/nuclei.js');
const homeCss = read('assets/home-refactor-v8.css');
const contract = json('data/blueprints/nucleus/home-distribution.contract.json');

const sandbox = { window: {}, fetch: () => Promise.reject(new Error('not used')) };
vm.runInNewContext(nucleiJs, sandbox, { filename: 'assets/js/nuclei.js' });
const runtime = sandbox.window.CTNuclei;
const nuclei = runtime.readItems(nucleiPayload);
const sections = runtime.getHomeArticleSections(articles, nuclei);
const pj = nuclei.find((item) => item.id === 'pj');
const clt = nuclei.find((item) => item.id === 'clt');
const pjSection = sections.find((item) => item.nucleus.id === 'pj');
const cltSection = sections.find((item) => item.nucleus.id === 'clt');

assert(!homeJs.includes('Guias por tema') && !homeJs.includes('data-guide-asset-id') && !homeJs.includes('renderGuideSection'), 'ISOLATED_GUIDE_CARD_REMOVED', 'No isolated Guide renderer or heading remains.');
assert(pj && pj.assetId === 'guide:guide-pj' && pj.guideUrl === '/guias/pj/' && fs.existsSync(path.join(ROOT, 'guias/pj/index.html')), 'GUIDE_PJ_PRESERVED', 'Guide identity, URL and physical page remain.');
assert(pjSection && pjSection.config.sectionType === 'NUCLEUS_ARTICLE_SECTION', 'PJ_SECTION_RESOLVED', pjSection ? pjSection.config.sectionId : 'missing');
assert(cltSection && cltSection.config.title === 'Guia CLT', 'CLT_SECTION_PRESERVED', cltSection ? cltSection.config.sectionId : 'missing');
assert(pjSection && pjSection.articles.length === pj.articleFilter.slugs.length, 'PJ_GOVERNED_COLLECTION_COMPLETE', pjSection ? `${pjSection.articles.length} eligible` : 'missing');
assert(pjSection && pjSection.articles.every((article) => pj.articleFilter.slugs.includes(runtime.articleKey(article))), 'PJ_FILTER_DETERMINISTIC', 'articleFilter.slugs matched by stable key.');
assert(pjSection && pjSection.articles.every((article) => fs.existsSync(path.join(ROOT, runtime.stripSlashes(runtime.articleUrl(article)), 'index.html'))), 'PJ_PUBLIC_ROUTES_EXIST', 'Every selected PJ article has a physical index.html.');
assert(pjSection && new Set(pjSection.articles.map(runtime.articleKey)).size === pjSection.articles.length, 'PJ_ARTICLES_UNIQUE', 'No duplicate stable keys.');
assert(pjSection && cltSection && !pjSection.articles.some((article) => cltSection.articles.some((candidate) => runtime.articleKey(candidate) === runtime.articleKey(article))), 'CROSS_NUCLEUS_ISOLATION', 'PJ and CLT governed collections do not overlap.');
assert(pj.homeSection.viewAllUrl === pj.categoryUrl && pj.categoryUrl === '/blog/categoria/pj/', 'VIEW_ALL_CATEGORY_RESOLVED', pj.homeSection.viewAllUrl);
assert(contract.responsivePresentation.mobile.mode === 'CAROUSEL' && contract.responsivePresentation.mobile.itemLimit === 6, 'MOBILE_CONTRACT_RESOLVED', contract.responsivePresentation.mobile);
assert(contract.responsivePresentation.desktop.mode === 'GRID' && contract.responsivePresentation.desktop.itemLimit === 9, 'DESKTOP_CONTRACT_RESOLVED', contract.responsivePresentation.desktop);
assert(homeCss.includes('@media(max-width:840px)') && homeCss.includes('grid-auto-flow:column') && homeCss.includes('overflow-x:auto'), 'MOBILE_CAROUSEL_IMPLEMENTED', 'Existing 840px institutional breakpoint reused.');
assert(homeCss.includes('nth-child(n+7)') && homeJs.includes('LIMIT_NUCLEUS_DESKTOP = 9'), 'RESPONSIVE_LIMITS_IMPLEMENTED', 'Mobile hides 7+, desktop source slices at 9.');
assert(homeJs.includes('Promise.allSettled') && homeJs.includes("homeRefactorV8 = 'degraded'"), 'CATALOG_FAIL_SAFE_IMPLEMENTED', 'Independent catalog failures preserve Home runtime.');
assert(sections.length === new Set(sections.map((item) => item.config.sectionId)).size, 'NO_DUPLICATE_HOME_SECTION', sections.map((item) => item.config.sectionId));

const fixtureResults = fixtures.scenarios.map((scenario) => {
  const actualStatus = evaluateFixture(scenario.input);
  return { id: scenario.id, expectedStatus: scenario.expectedStatus, actualStatus, matched: actualStatus === scenario.expectedStatus };
});
const fixtureMismatches = fixtureResults.filter((item) => !item.matched);
const liveFailures = findings.filter((item) => item.status === 'FAIL');

const result = {
  status: fixtureMismatches.length || liveFailures.length ? 'FAIL' : 'PASS',
  live: { checks: findings.length, passed: findings.length - liveFailures.length, failed: liveFailures.length, findings },
  fixtures: { scenarios: fixtureResults.length, matched: fixtureResults.length - fixtureMismatches.length, mismatches: fixtureMismatches.length, results: fixtureResults },
  resolved: {
    sections: sections.map((item) => ({ nucleusId: item.nucleus.id, sectionId: item.config.sectionId, eligibleArticles: item.articles.length })),
    pjMobileVisible: Math.min(6, pjSection ? pjSection.articles.length : 0),
    pjDesktopVisible: Math.min(9, pjSection ? pjSection.articles.length : 0),
    breakpoint: '840px'
  }
};

console.log(JSON.stringify(result, null, 2));
if (result.status !== 'PASS') process.exitCode = 1;
