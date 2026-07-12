(function () {
  const TOOLS_URL = '/data/tools.json';
  const ARTICLES_URL = '/data/articles.json';
  const NUCLEI_URL = '/data/brain/nuclei.json';
  const LIMIT_HOME_TOOLS = 9;
  const LIMIT_ARTICLES = 6;

  const $ = (selector) => document.querySelector(selector);
  const byOrder = (field) => (a, b) => Number(a[field] ?? 999) - Number(b[field] ?? 999);

  const escapeHtml = (value) => String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const normalizeHref = (href) => {
    if (typeof href !== 'string' || href.trim() === '') return '#';
    return href.endsWith('/') ? href : `${href}/`;
  };

  const fetchJson = async (url) => {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Falha ao carregar ${url}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error(`${url} nao retornou lista`);
    return data;
  };

  const fetchJsonItems = async (url) => {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Falha ao carregar ${url}`);
    const data = await response.json();
    return Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : [];
  };


  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animateNumber = (element, target, suffix = '') => {
    if (!element || !Number.isFinite(target)) return;

    const finalValue = Math.max(0, Math.round(target));

    if (prefersReducedMotion()) {
      element.textContent = `${finalValue}${suffix}`;
      return;
    }

    const duration = 900;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(finalValue * eased);
      element.textContent = `${current}${suffix}`;

      if (progress < 1) requestAnimationFrame(tick);
    };

    element.textContent = `0${suffix}`;
    requestAnimationFrame(tick);
  };

  const countPublishedTools = (tools) => tools.filter((tool) => tool.published === true).length;
  const countPublishedArticles = (articles) => articles.length;

  const updateStats = (tools, articles) => {
    const toolsStat = document.querySelector('[data-stat-counter="tools"]');
    const articlesStat = document.querySelector('[data-stat-counter="articles"]');

    animateNumber(toolsStat, countPublishedTools(tools));
    animateNumber(articlesStat, countPublishedArticles(articles));
  };

  const renderTools = (tools) => {
    const grid = $('#toolsGrid');
    const empty = $('#toolsEmpty');
    if (!grid) return;

    if (!tools.length) {
      grid.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }

    if (empty) empty.hidden = true;

    grid.innerHTML = tools.map((tool) => {
      const badge = tool.badge ? `<span class="ct-badge ct-badge--main" style="background:${escapeHtml(tool.badgeColor || '#16a34a')}">${escapeHtml(tool.badge)}</span>` : '';
      const category = tool.category ? `<span class="ct-badge">${escapeHtml(tool.category)}</span>` : '';

      return `
        <a class="ct-tool-card" href="${escapeHtml(normalizeHref(tool.slug))}">
          <div class="ct-tool-card__top">
            <span class="ct-tool-icon">${escapeHtml(tool.icone || '🧮')}</span>
            <span class="ct-badges">${badge}${category}</span>
          </div>
          <h3>${escapeHtml(tool.title)}</h3>
          <p>${escapeHtml(tool.description)}</p>
          <span class="ct-tool-card__link">Calcular agora →</span>
        </a>
      `;
    }).join('');
  };

  const renderArticleCard = (article) => `
    <a class="ct-article-anchor" href="${escapeHtml(normalizeHref(article.slug))}">
      <article class="ct-article-card">
        <div class="ct-article-meta">
          <span class="ct-article-category" style="color:${escapeHtml(article.cor || '#1d4ed8')};background:${escapeHtml(article.corBg || '#dbeafe')}">${escapeHtml(article.category || 'CLT')}</span>
          <span class="ct-article-time">⏱ ${escapeHtml(article.tempo || '')} de leitura</span>
        </div>
        <h3>${escapeHtml(article.title)}</h3>
        <p>${escapeHtml(article.description)}</p>
        <span class="ct-article-read">Ler artigo →</span>
      </article>
    </a>
  `;

  const renderArticleSection = ({ eyebrow, title, articles }) => `
    <section class="ct-article-section">
      <div class="ct-article-heading">
        <div>
          <p class="ct-article-eyebrow">${escapeHtml(eyebrow)}</p>
          <h2 class="ct-article-title">${escapeHtml(title)}</h2>
        </div>
        <a class="ct-article-all" href="/blog/">Ver todos →</a>
      </div>
      <div class="ct-article-grid">
        ${articles.map(renderArticleCard).join('')}
      </div>
    </section>
  `;

  const renderGuideCard = (guide) => `
    <a class="ct-article-anchor" href="${escapeHtml(normalizeHref(guide.url))}">
      <article class="ct-article-card" data-guide-asset-id="${escapeHtml(guide.assetId || guide.id || '')}">
        <div class="ct-article-meta">
          <span class="ct-article-category">Guia</span>
          <span class="ct-article-time">${escapeHtml(guide.name || guide.slug || '')}</span>
        </div>
        <h3>${escapeHtml(guide.title)}</h3>
        <p>${escapeHtml(guide.description)}</p>
        <span class="ct-article-read">Abrir guia &rarr;</span>
      </article>
    </a>
  `;

  const renderGuideSection = (guides) => {
    if (!guides.length) return '';

    return `
      <section class="ct-article-section" aria-labelledby="home-guides-title">
        <div class="ct-article-heading">
          <div>
            <p class="ct-article-eyebrow">Guias</p>
            <h2 class="ct-article-title" id="home-guides-title">Guias por tema</h2>
          </div>
        </div>
        <div class="ct-article-grid">
          ${guides.map(renderGuideCard).join('')}
        </div>
      </section>
    `;
  };

  const renderArticles = (articles, guides = []) => {
    const mount = $('#articlesMount');
    if (!mount) return;

    const latest = articles
      .filter((article) => article.showOnHome === true)
      .sort(byOrder('homeOrder'))
      .slice(0, LIMIT_ARTICLES);

    const cltGuides = articles
      .filter((article) => article.showOnCltGuide === true)
      .sort(byOrder('cltGuideOrder'))
      .slice(0, LIMIT_ARTICLES);

    const sections = [
      renderGuideSection(guides),
      renderArticleSection({ eyebrow: 'Blog', title: 'Últimos Artigos', articles: latest }),
      renderArticleSection({ eyebrow: 'Guias CLT', title: 'Guias CLT', articles: cltGuides })
    ].filter(Boolean);

    mount.innerHTML = sections.join('');
  };

  const setupSearch = (allTools) => {
    const form = $('#toolSearchForm');
    const input = $('#toolSearch');
    if (!form || !input) return;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const query = input.value.trim().toLowerCase();

      const filtered = !query ? allTools : allTools.filter((tool) => {
        return String(tool.title || '').toLowerCase().includes(query)
          || String(tool.description || '').toLowerCase().includes(query)
          || String(tool.category || '').toLowerCase().includes(query);
      });

      renderTools(filtered);
      document.getElementById('ferramentas')?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  const setupMenu = () => {
    const open = $('#menuOpen');
    const close = $('#menuClose');
    const drawer = $('#menuDrawer');
    const overlay = $('#menuOverlay');

    if (!open || !close || !drawer || !overlay) return;

    const openMenu = () => {
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      open.setAttribute('aria-expanded', 'true');
      overlay.hidden = false;
    };

    const closeMenu = () => {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      open.setAttribute('aria-expanded', 'false');
      overlay.hidden = true;
    };

    open.addEventListener('click', openMenu);
    close.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  };

  const loadHomeGuides = async () => {
    if (!window.CTNuclei) return [];

    try {
      const nuclei = await fetchJsonItems(NUCLEI_URL);
      return window.CTNuclei.getHomeGuides(nuclei);
    } catch (error) {
      console.warn('Nao foi possivel carregar os guias da Home.', error);
      return [];
    }
  };

  const init = async () => {
    setupMenu();

    try {
      const [tools, articles, guides] = await Promise.all([
        fetchJson(TOOLS_URL),
        fetchJson(ARTICLES_URL),
        loadHomeGuides()
      ]);

      const homeTools = tools
        .filter((tool) => tool.published === true && tool.showOnHome === true)
        .sort(byOrder('homeOrder'))
        .slice(0, LIMIT_HOME_TOOLS);

      renderTools(homeTools);
      renderArticles(articles, guides);
      updateStats(tools, articles);
      setupSearch(homeTools);
      document.documentElement.dataset.homeRefactorV8 = 'ready';
    } catch (error) {
      console.warn('Nao foi possivel carregar a Home refatorada V5.', error);
      document.documentElement.dataset.homeRefactorV8 = 'error';
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
