(function () {
  const ARTICLES_URL = '/data/articles.json';
  const TARGET_TITLE = 'Artigos sobre direitos trabalhistas';
  const LIMIT = 6;

  const byOrder = (field) => (a, b) => Number(a[field] || 0) - Number(b[field] || 0);

  const escapeHtml = (value) => String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const getArticleHref = (article) => {
    if (typeof article.slug !== 'string' || article.slug.trim() === '') return '#';
    return article.slug;
  };

  const getArticles = async () => {
    try {
      const response = await fetch(ARTICLES_URL, { cache: 'no-store' });
      if (!response.ok) return null;
      const data = await response.json();
      return Array.isArray(data) ? data : null;
    } catch (error) {
      console.warn('Nao foi possivel carregar os artigos da Home.', error);
      return null;
    }
  };

  const findOriginalArticleSection = () => {
    const headings = Array.from(document.querySelectorAll('h2'));
    const heading = headings.find((node) => (node.textContent || '').trim() === TARGET_TITLE);
    return heading ? heading.closest('section') : null;
  };

  const renderCard = (article) => `
    <a class="ct-home-article-anchor" href="${escapeHtml(getArticleHref(article))}">
      <div class="ct-home-article-card">
        <div class="ct-home-article-meta">
          <span class="ct-home-article-category" style="color:${escapeHtml(article.cor || '#1d4ed8')};background-color:${escapeHtml(article.corBg || '#dbeafe')}">${escapeHtml(article.category || 'CLT')}</span>
          <span class="ct-home-article-time">&#9201; ${escapeHtml(article.tempo || '')} de leitura</span>
        </div>
        <h3>${escapeHtml(article.title)}</h3>
        <p>${escapeHtml(article.description)}</p>
        <span class="ct-home-article-read">Ler artigo &#8594;</span>
      </div>
    </a>
  `;

  const renderSection = ({ eyebrow, title, articles }) => `
    <section class="ct-home-article-section">
      <div class="ct-home-article-heading">
        <div>
          <p class="ct-home-article-eyebrow">${escapeHtml(eyebrow)}</p>
          <h2 class="ct-home-article-title">${escapeHtml(title)}</h2>
        </div>
        <a class="ct-home-article-all" href="/blog/">Ver todos &#8594;</a>
      </div>
      <div class="ct-home-article-grid">
        ${articles.map(renderCard).join('')}
      </div>
    </section>
  `;

  const injectSections = async () => {
    try {
      if (document.documentElement.dataset.ctHomeArticlesReady === 'true') return true;

      const originalSection = findOriginalArticleSection();
      if (!originalSection) return false;

      const articles = await getArticles();
      if (!articles) return true;

      const latestArticles = articles
        .filter((article) => article.showOnHome === true)
        .sort(byOrder('homeOrder'))
        .slice(0, LIMIT);

      const cltGuides = articles
        .filter((article) => article.showOnCltGuide === true)
        .sort(byOrder('cltGuideOrder'))
        .slice(0, LIMIT);

      const wrapper = document.createElement('div');
      wrapper.className = 'ct-home-articles-wrapper';
      wrapper.innerHTML = [
        renderSection({
          eyebrow: 'Blog',
          title: 'Últimos Artigos',
          articles: latestArticles
        }),
        renderSection({
          eyebrow: 'Guias CLT',
          title: 'Guias CLT',
          articles: cltGuides
        })
      ].join('');

      originalSection.replaceWith(wrapper);
      document.documentElement.dataset.ctHomeArticlesReady = 'true';
      document.documentElement.dataset.ctLatestArticles = String(latestArticles.length);
      document.documentElement.dataset.ctCltGuides = String(cltGuides.length);
      return true;
    } catch (error) {
      console.warn('A secao de artigos da Home nao foi alterada.', error);
      return true;
    }
  };

  const waitForHome = () => {
    let tries = 0;
    const maxTries = 60;

    const timer = window.setInterval(async () => {
      tries += 1;
      const finished = await injectSections();

      if (finished || tries >= maxTries) {
        window.clearInterval(timer);
      }
    }, 150);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForHome, { once: true });
  } else {
    waitForHome();
  }
})();
