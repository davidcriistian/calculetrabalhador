(function () {
  const NAV_ITEMS = [
    { href: '/ferramentas/', label: 'Calculadoras', icon: '/assets/images/menu-icons/calculator.png', match: ['calculadora-', 'salario-liquido', 'saque-aniversario-fgts', 'ferramentas'] },
    { href: '/blog/', label: 'Blog', icon: '/assets/images/menu-icons/blog.png', match: ['blog'] },
    { href: '/sobre/', label: 'Sobre', icon: '/assets/images/menu-icons/user.png', match: ['sobre'] },
    { href: '/contato/', label: 'Contato', icon: '/assets/images/menu-icons/contact.png', match: ['contato'] }
  ];

  const FOOTER_LINKS = [
    { href: '/ferramentas/', label: 'Calculadoras' },
    { href: '/blog/', label: 'Blog' },
    { href: '/sobre/', label: 'Sobre' },
    { href: '/contato/', label: 'Contato' },
    { href: '/politica-de-privacidade/', label: 'Privacidade' },
    { href: '/politica-de-cookies/', label: 'Política de Cookies' },
    { href: '/termos-de-uso/', label: 'Termos de Uso' },
    { href: '/disclaimer/', label: 'Disclaimer' },
    { href: '/fontes-oficiais/', label: 'Fontes Oficiais' },
    { href: '/metodologia/', label: 'Metodologia' }
  ];

  const isActive = (item) => {
    const path = window.location.pathname.replace(/^\//, '').toLowerCase();
    return item.match.some((fragment) => path.startsWith(fragment));
  };

  const navLinks = () => NAV_ITEMS.map((item) => {
    const active = isActive(item) ? ' is-active' : '';
    return `<a class="${active.trim()}" href="${item.href}">${item.label}</a>`;
  }).join('');

  const drawerLinks = () => NAV_ITEMS.map((item) => {
    const active = isActive(item) ? ' is-active' : '';
    return `
      <a class="${active.trim()}" href="${item.href}">
        <img src="${item.icon}" alt="" aria-hidden="true">
        <span>${item.label}</span>
      </a>
    `;
  }).join('');

  const footerLinks = () => FOOTER_LINKS.map((item) => `<a href="${item.href}">${item.label}</a>`).join('');

  const renderHeader = () => {
    const mount = document.getElementById('global-header');
    if (!mount) return;

    mount.innerHTML = `
      <header class="ct-global-header">
        <div class="ct-global-header__inner">
          <button class="ct-global-menu-button" id="globalMenuOpen" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="globalMenuDrawer">
            <span></span><span></span><span></span>
          </button>

          <a class="ct-global-logo" href="/" aria-label="Calcule Trabalhador">
            <img class="ct-global-logo__img" src="/assets/images/logo-header.png" alt="Calcule Trabalhador">
          </a>

          <nav class="ct-global-nav" aria-label="Navegação principal">
            ${navLinks()}
          </nav>

          <span class="ct-global-spacer" aria-hidden="true"></span>
        </div>

        <div class="ct-global-menu-overlay" id="globalMenuOverlay" hidden></div>
        <aside class="ct-global-menu-drawer" id="globalMenuDrawer" aria-hidden="true">
          <div class="ct-global-menu-drawer__top">
            <span>Menu</span>
            <button class="ct-global-menu-close" id="globalMenuClose" type="button" aria-label="Fechar menu">×</button>
          </div>
          <nav aria-label="Menu principal">
            ${drawerLinks()}
          </nav>
          <div class="ct-global-menu-drawer__bottom">© 2026 Calcule Trabalhador</div>
        </aside>
      </header>
    `;
  };

  const renderFooter = () => {
    const mount = document.getElementById('global-footer');
    if (!mount) return;

    mount.innerHTML = `
      <footer class="ct-global-footer">
        <div class="ct-global-footer__inner">
          <div class="ct-global-footer__top">
            <a class="ct-global-footer__brand" href="/" aria-label="Calcule Trabalhador">
              <img class="ct-global-footer__logo" src="/assets/images/logo-footer.png" alt="Calcule Trabalhador">
            </a>
            <nav class="ct-global-footer__links" aria-label="Links institucionais">
              ${footerLinks()}
            </nav>
          </div>
          <div class="ct-global-footer__bottom">
            <p>© 2026 Calcule Trabalhador. Ferramentas educativas — não substituem assessoria jurídica.</p>
            <p>Tabelas atualizadas em maio de 2026</p>
          </div>
        </div>
      </footer>
    `;
  };

  const setupMenu = () => {
    const open = document.getElementById('globalMenuOpen');
    const close = document.getElementById('globalMenuClose');
    const drawer = document.getElementById('globalMenuDrawer');
    const overlay = document.getElementById('globalMenuOverlay');

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

  const init = () => {
    renderHeader();
    renderFooter();
    setupMenu();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
