# Padrão Oficial de Header

## 1. Objetivo do padrão de header

O objetivo deste documento é registrar o padrão oficial de header do projeto Calcule Trabalhador antes de replicá-lo para outras páginas.

O header deve criar uma identidade visual consistente entre calculadoras, páginas institucionais e futuras páginas HTML, preservando SEO, acessibilidade e funcionamento das calculadoras existentes.

## 2. Referência visual

A referência visual principal é a Home mobile atual.

Elementos obrigatórios do padrão:

- Menu sanduíche à esquerda.
- Logo Calcule Trabalhador à direita.
- Drawer lateral aberto ao clicar no menu.
- Overlay sobre o conteúdo enquanto o drawer estiver aberto.
- Botão de fechar dentro do drawer.
- Links principais do site dentro do menu.

## 3. Estrutura HTML padrão

Estrutura base recomendada:

```html
<header class="site-header">
  <div class="site-header-inner">
    <button
      id="siteMenuOpen"
      type="button"
      class="site-menu-button"
      aria-label="Abrir menu"
      aria-controls="siteMenuDrawer"
      aria-expanded="false"
    >
      <!-- ícone sanduíche -->
    </button>

    <a href="/" class="site-logo" aria-label="Calcule Trabalhador - Home">
      <!-- logo SVG inline -->
      <span class="site-logo-text">
        <span>CALCULE</span>
        <span>TRABALHADOR</span>
      </span>
    </a>
  </div>

  <div id="siteMenuOverlay" class="site-menu-overlay" hidden></div>

  <aside id="siteMenuDrawer" class="site-menu-drawer" aria-hidden="true">
    <div class="site-menu-header">
      <a href="/" class="site-logo" aria-label="Calcule Trabalhador - Home">
        <!-- logo SVG inline -->
      </a>

      <button id="siteMenuClose" type="button" aria-label="Fechar menu">
        <!-- ícone fechar -->
      </button>
    </div>

    <nav aria-label="Menu principal">
      <!-- links oficiais -->
    </nav>
  </aside>
</header>
```

## 4. Padrão da logo SVG inline

A logo oficial usada neste padrão deve seguir a Home:

- Ícone de calculadora em SVG inline.
- Borda azul.
- Texto em duas linhas:
  - CALCULE
  - TRABALHADOR
- Cor principal: `#1d4ed8`.
- Texto principal: `#0f172a`.

Não existe, nesta fase, um arquivo de imagem separado para a logo. Por isso, a logo deve ser reproduzida como SVG inline em cada página até que exista um componente ou include compartilhado.

## 5. Links oficiais do menu

Links oficiais do drawer:

- `/` - Calculadoras
- `/saque-aniversario-fgts/` - Saque-Aniversário FGTS
- `/salario-liquido-clt-2026/` - Salário Líquido
- `/calculadora-rescisao-clt-2026/` - Rescisão CLT
- `/calculadora-13-salario-2026/` - 13º Salário
- `/calculadora-ferias-clt-2026/` - Férias CLT
- `/calculadora-horas-extras-clt-2026/` - Horas Extras
- `/calculadora-seguro-desemprego-2026/` - Seguro-Desemprego
- `/sobre/` - Sobre
- `/contato/` - Contato
- `/politica-de-privacidade/` - Privacidade

## 6. Regras para H1

- Nunca duplicar H1.
- Manter apenas um `<h1>` por página.
- Ao usar este padrão de header, manter o H1 fora do header.
- Preservar o texto SEO original da página.
- Se o H1 antigo estiver dentro do header, movê-lo para o início do `<main>`.
- Não transformar logo, nome do site ou item de menu em H1.

## 7. Regras para páginas Tailwind

Páginas que já usam Tailwind CDN podem receber o header com classes Tailwind.

Regras:

- Não remover Tailwind CDN nesta etapa.
- Não adicionar outro framework CSS.
- Usar IDs únicos:
  - `siteMenuOpen`
  - `siteMenuClose`
  - `siteMenuDrawer`
  - `siteMenuOverlay`
- Manter o script do menu separado do script da calculadora.
- Não alterar fórmulas, eventos ou variáveis da calculadora.

## 8. Regras para páginas com CSS próprio

Páginas com CSS próprio não devem receber Tailwind CDN apenas para usar o header.

Regras:

- Recriar o mesmo padrão visual usando CSS próprio da página.
- Criar classes equivalentes, como:
  - `.site-header`
  - `.site-header-inner`
  - `.site-menu-button`
  - `.site-logo`
  - `.site-menu-overlay`
  - `.site-menu-drawer`
  - `.site-menu-drawer.is-open`
- Preservar o estilo geral da página.
- Não misturar Tailwind em páginas que não usam Tailwind.

## 9. Regras para scripts

- O script do menu deve ser pequeno, local e separado.
- Nunca alterar o script da calculadora.
- Nunca inserir lógica do menu dentro do script de cálculo.
- O script do menu deve apenas:
  - abrir drawer;
  - fechar drawer;
  - mostrar/esconder overlay;
  - atualizar `aria-expanded`;
  - atualizar `aria-hidden`;
  - fechar com `Escape`.

## 10. Checklist antes de aplicar em nova página

- [ ] Identificar o arquivo permitido.
- [ ] Localizar o header atual.
- [ ] Localizar o H1 atual.
- [ ] Confirmar se o H1 está dentro ou fora do header.
- [ ] Localizar todos os blocos `<script>`.
- [ ] Identificar o script da calculadora, se existir.
- [ ] Confirmar se a página usa Tailwind CDN ou CSS próprio.
- [ ] Definir como manter H1 único.
- [ ] Planejar a alteração sem tocar em cálculos.
- [ ] Aguardar aprovação antes de alterar.

## 11. Checklist de validação

- [ ] Apenas o arquivo aprovado foi alterado.
- [ ] Existe apenas um `<h1>`.
- [ ] O H1 está fora do `<header>`.
- [ ] O texto SEO do H1 foi preservado.
- [ ] O menu usa IDs únicos.
- [ ] O drawer abre e fecha pelo botão sanduíche.
- [ ] O drawer fecha pelo botão de fechar.
- [ ] O drawer fecha ao clicar no overlay.
- [ ] O drawer fecha com `Escape`.
- [ ] O script do menu está separado.
- [ ] O script da calculadora não foi alterado.
- [ ] FAQ visual foi preservado.
- [ ] FAQ Schema foi preservado.
- [ ] Footer foi preservado.
- [ ] `git diff --check` não apresenta erros.
- [ ] `git status --short` mostra somente o arquivo esperado.

## 12. Ordem recomendada de aplicação

Aplicar o padrão uma página por vez, sempre com análise prévia, aprovação, validação e commit antes de seguir para a próxima.

Ordem recomendada:

1. `calculadora-ferias-clt-2026`
2. `calculadora-horas-extras-clt-2026`
3. `calculadora-rescisao-clt-2026`
4. `salario-liquido-clt-2026`
5. `calculadora-seguro-desemprego-2026`
6. Páginas institucionais
7. `saque-aniversario-fgts`
8. Home somente em fase separada

## Regra final

A Home atual ainda depende do bundle React/Vite. Por isso, o header da Home não deve ser alterado nesta etapa. O padrão deve ser replicado primeiro nas páginas HTML estáticas, uma por vez.
