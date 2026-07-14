(function () {
  const normalize = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const stripSlashes = (value) => String(value || '').replace(/^\/+|\/+$/g, '');

  const readItems = (payload) => Array.isArray(payload) ? payload : payload && Array.isArray(payload.items) ? payload.items : [];

  const sortByOrder = (items) => [...items].sort((a, b) => (a.order || 0) - (b.order || 0));

  const articleValues = (article) => {
    const categories = Array.isArray(article.categories) ? article.categories : [];
    return [
      article.category,
      article.cluster,
      article.clusterId,
      ...categories
    ].map(normalize).filter(Boolean);
  };

  const isPublished = (article) => article.published !== false && article.status !== 'draft';

  const articleUrl = (article) => {
    const raw = article.slug || article.url || '';
    if (!raw) return '#';
    if (/^https?:\/\//i.test(raw)) return raw;
    return `/${stripSlashes(raw)}/`;
  };

  const articleKey = (article) => stripSlashes(article.slug || article.id || article.url || '').split('/').pop();

  const RESPONSIVE_PRESENTATION = Object.freeze({
    mobile: Object.freeze({ mode: 'CAROUSEL', itemLimit: 6, navigation: 'HORIZONTAL_SWIPE_OR_SCROLL' }),
    desktop: Object.freeze({ mode: 'GRID', itemLimit: 9, navigation: 'NONE_FOR_VISIBLE_GRID' })
  });

  const isArticleEligible = (article) => {
    const status = normalize(article && article.status);
    const robots = normalize(article && article.robots);
    const href = articleUrl(article);

    return Boolean(
      article
      && article.published !== false
      && !['draft', 'archived', 'removed'].includes(status)
      && article.noindex !== true
      && !robots.includes('noindex')
      && typeof article.title === 'string'
      && article.title.trim()
      && typeof article.description === 'string'
      && article.description.trim()
      && href !== '#'
      && (/^https?:\/\//i.test(href) || href.startsWith('/blog/'))
    );
  };

  const articleMatchesNucleus = (article, nucleus) => {
    const filterSlugs = nucleus && nucleus.articleFilter && Array.isArray(nucleus.articleFilter.slugs)
      ? nucleus.articleFilter.slugs.map(normalize)
      : [];

    const filterFlag = nucleus && nucleus.articleFilter && typeof nucleus.articleFilter.flag === 'string'
      ? nucleus.articleFilter.flag
      : '';

    if (filterSlugs.length) {
      return filterSlugs.includes(normalize(articleKey(article)));
    }

    if (filterFlag) return article[filterFlag] === true;

    const accepted = [nucleus.id, nucleus.slug].map(normalize);
    return articleValues(article).some((value) => accepted.includes(value));
  };

  const getVisibleOnHome = (nuclei) => sortByOrder(nuclei).filter((item) => item.showOnHome);

  const getVisibleOnBlog = (nuclei) => sortByOrder(nuclei).filter((item) => item.showOnBlog);

  const getActiveNuclei = (nuclei) => sortByOrder(nuclei).filter((item) => item.status === 'active');

  const isHomeEligible = (item) => {
    return Boolean(
      item
      && item.showOnHome === true
      && item.published === true
      && item.status === 'active'
      && typeof item.url === 'string'
      && stripSlashes(item.url)
    );
  };

  const getHomeGuides = (nuclei) => sortByOrder(nuclei).filter(isHomeEligible);

  const getNucleusBySlug = (nuclei, slug) => {
    const target = normalize(slug);
    return nuclei.find((item) => normalize(item.slug) === target || normalize(item.id) === target) || null;
  };

  const sortNucleusArticles = (articles, nucleus) => {
    const strategy = nucleus && nucleus.homeSection && nucleus.homeSection.ordering
      ? nucleus.homeSection.ordering.strategy
      : 'PUBLISHED_AT_DESC';

    if (strategy === 'ARTICLE_FILTER_ORDER' && nucleus.articleFilter && Array.isArray(nucleus.articleFilter.slugs)) {
      const order = new Map(nucleus.articleFilter.slugs.map((slug, index) => [normalize(slug), index]));
      return [...articles].sort((a, b) => (order.get(normalize(articleKey(a))) ?? 999) - (order.get(normalize(articleKey(b))) ?? 999));
    }

    return [...articles].sort((a, b) => {
      const dateOrder = String(b.publishedAt || b.updatedAt || '').localeCompare(String(a.publishedAt || a.updatedAt || ''));
      return dateOrder || articleKey(a).localeCompare(articleKey(b));
    });
  };

  const getArticlesByNucleus = (articles, nucleus) => {
    const seen = new Set();
    const eligible = articles.filter((article) => {
      const key = normalize(articleKey(article));
      if (!key || seen.has(key) || !isArticleEligible(article) || !articleMatchesNucleus(article, nucleus)) return false;
      seen.add(key);
      return true;
    });

    return sortNucleusArticles(eligible, nucleus);
  };

  const getHomeArticleSections = (articles, nuclei) => sortByOrder(nuclei).reduce((sections, nucleus) => {
    const config = nucleus && nucleus.homeSection;
    if (!config || config.sectionType !== 'NUCLEUS_ARTICLE_SECTION' || config.enabled !== true) return sections;
    if (nucleus.status !== 'active' || nucleus.showOnHome !== true) return sections;

    const eligibleArticles = getArticlesByNucleus(articles, nucleus);
    if (!eligibleArticles.length) return sections;

    sections.push({ nucleus, config, articles: eligibleArticles });
    return sections;
  }, []);

  const loadJson = (url) => fetch(url).then((response) => {
    if (!response.ok) throw new Error(`Nao foi possivel carregar ${url}`);
    return response.json();
  });

  window.CTNuclei = {
    normalize,
    stripSlashes,
    readItems,
    sortByOrder,
    articleUrl,
    articleKey,
    RESPONSIVE_PRESENTATION,
    isArticleEligible,
    articleMatchesNucleus,
    getActiveNuclei,
    getVisibleOnHome,
    getVisibleOnBlog,
    isHomeEligible,
    getHomeGuides,
    getNucleusBySlug,
    getArticlesByNucleus,
    getHomeArticleSections,
    loadJson
  };
})();
