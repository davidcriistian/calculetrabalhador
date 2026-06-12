(function () {
  'use strict';

  const DATA_URL = '/data/editorial-metadata.json';

  async function carregarEditorialMetadata() {
    const response = await fetch(DATA_URL, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`Não foi possível carregar ${DATA_URL}`);
    }
    return response.json();
  }

  function normalizarPathAtual(pathname) {
    let path = pathname || window.location.pathname || '/';
    if (!path.endsWith('/')) path += '/';
    return path;
  }

  function formatarDataBR(dataISO) {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split('-').map(Number);
    if (!ano || !mes || !dia) return dataISO;

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(ano, mes - 1, dia));
  }

  function renderizarLinhaCalculadora(metadata) {
    const linha = document.createElement('p');
    linha.className = 'editorial-metadata-line';
    linha.setAttribute('aria-label', 'Data de atualização dos dados');
    const dataAtualizacao = metadata.atualizadoEm || metadata.revisadoEm || metadata.publicadoEm;
    linha.textContent = dataAtualizacao
      ? `Dados atualizados em ${formatarDataBR(dataAtualizacao)}`
      : `Dados atualizados conforme regras vigentes em ${metadata.anoBase || 'ano-base atual'}`;
    return linha;
  }

  function renderizarFaixaEditorial(metadata) {
    if (metadata && metadata.tipo === 'calculadora') {
      return renderizarLinhaCalculadora(metadata);
    }

    const wrapper = document.createElement('aside');
    wrapper.className = 'editorial-metadata-box';
    wrapper.setAttribute('aria-label', 'Informações editoriais');

    const publicado = metadata.publicadoEm ? `<span><strong>Publicado em:</strong> ${formatarDataBR(metadata.publicadoEm)}</span>` : '';
    const atualizado = metadata.atualizadoEm ? `<span><strong>Atualizado em:</strong> ${formatarDataBR(metadata.atualizadoEm)}</span>` : '';
    const revisado = metadata.anoBase ? `<span><strong>Revisado conforme regras vigentes em:</strong> ${metadata.anoBase}</span>` : '';
    const fonte = metadata.fonteResumo ? `<p>${metadata.fonteResumo}</p>` : '';
    const aviso = metadata.aviso ? `<p>${metadata.aviso}</p>` : '';

    wrapper.innerHTML = `
      <div class="editorial-metadata-row">
        ${publicado}
        ${atualizado}
        ${revisado}
      </div>
      <div class="editorial-metadata-text">
        ${fonte}
        ${aviso}
      </div>
    `;

    return wrapper;
  }

  function inserirEstilos() {
    if (document.getElementById('editorial-metadata-styles')) return;

    const style = document.createElement('style');
    style.id = 'editorial-metadata-styles';
    style.textContent = `
      .editorial-metadata-line,
      body .editorial-metadata-line {
        display: block;
        margin-top: 10px;
        margin-right: 0;
        margin-bottom: 18px;
        margin-left: 0;
        font-size: 12px;
        font-weight: 500;
        line-height: 1.45;
        color: #4f7df3;
        font-style: normal;
        background: transparent;
        border: 0;
        padding: 0;
      }
      .editorial-metadata-box {
        margin-top: 1rem;
        max-width: 56rem;
        border: 1px solid rgba(255,255,255,.24);
        background: rgba(255,255,255,.12);
        color: #eff6ff;
        border-radius: 1rem;
        padding: 1rem;
        backdrop-filter: blur(10px);
      }
      .editorial-metadata-row {
        display: flex;
        flex-wrap: wrap;
        gap: .5rem 1rem;
        font-size: .875rem;
        line-height: 1.5;
      }
      .editorial-metadata-row strong { color: #fff; }
      .editorial-metadata-text {
        margin-top: .5rem;
        display: grid;
        gap: .25rem;
        font-size: .875rem;
        line-height: 1.55;
        color: #dbeafe;
      }
      .editorial-metadata-text p { margin: 0; }
      main .editorial-metadata-box,
      article .editorial-metadata-box {
        border-color: #bfdbfe;
        background: #eff6ff;
        color: #1e3a8a;
      }
      main .editorial-metadata-row strong,
      article .editorial-metadata-row strong { color: #1e40af; }
      main .editorial-metadata-text,
      article .editorial-metadata-text { color: #1e3a8a; }
    `;
    document.head.appendChild(style);
  }

  function inserirFaixaNoTopo(metadata) {
    if (!metadata || document.querySelector('.editorial-metadata-box, .editorial-metadata-line')) return;

    inserirEstilos();

    const h1 = document.querySelector('h1');
    if (!h1) return;

    const faixa = renderizarFaixaEditorial(metadata);
    h1.insertAdjacentElement('afterend', faixa);
  }

  async function inicializarFaixaEditorial() {
    try {
      const todosMetadados = await carregarEditorialMetadata();
      const pathAtual = normalizarPathAtual();
      const metadata = todosMetadados[pathAtual];
      if (metadata) inserirFaixaNoTopo(metadata);
    } catch (error) {
      console.warn('[Calcule Trabalhador] Faixa editorial não carregada:', error);
    }
  }

  window.CalculeTrabalhadorEditorial = {
    carregarEditorialMetadata,
    normalizarPathAtual,
    renderizarFaixaEditorial,
    inserirFaixaNoTopo,
    formatarDataBR
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarFaixaEditorial);
  } else {
    inicializarFaixaEditorial();
  }
})();
