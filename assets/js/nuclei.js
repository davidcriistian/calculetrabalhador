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

  const articleMatchesNucleus = (article, nucleus) => {
    const filterSlugs = nucleus && nucleus.articleFilter && Array.isArray(nucleus.articleFilter.slugs)
      ? nucleus.articleFilter.slugs.map(normalize)
      : [];

    if (filterSlugs.length) {
      return filterSlugs.includes(normalize(articleKey(article)));
    }

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

  const getArticlesByNucleus = (articles, nucleus) => articles
    .filter((article) => isPublished(article) && articleMatchesNucleus(article, nucleus))
    .sort((a, b) => String(b.publishedAt || b.updatedAt || '').localeCompare(String(a.publishedAt || a.updatedAt || '')));

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
    articleMatchesNucleus,
    getActiveNuclei,
    getVisibleOnHome,
    getVisibleOnBlog,
    isHomeEligible,
    getHomeGuides,
    getNucleusBySlug,
    getArticlesByNucleus,
    loadJson
  };
})();
