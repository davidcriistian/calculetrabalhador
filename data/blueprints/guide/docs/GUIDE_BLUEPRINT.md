# Guide Blueprint

## Objetivo

Guide Blueprint modela a pagina publica principal futura de um nucleo.

Esta fase nao cria paginas publicas, nao altera guias existentes, nao altera URLs, nao altera sitemap e nao altera SEO atual.

## Autoridade de Relacionamento

O Domain Relationship Model em `/docs/PLATFORM_ARCHITECTURE.md` continua sendo a autoridade canonica.

Guide Blueprint apenas aplica esse modelo:

- `primaryDomain` define o dominio principal do guia;
- `primaryNucleus` define o nucleo representado pelo guia;
- clusters, calculadoras, artigos, produtos, ofertas e CTAs entram por configuracao.

## Estrutura

```text
data/blueprints/guide/
  index.json
  metadata/guide.json
  history/index.json
  versioning/index.json
  schemas/
  contracts/
  docs/
```

## Estrutura Visual

O template modela header, breadcrumb, hero, introduction, featured clusters, calculadoras, artigos, listas completas, FAQ, glossary, downloads, related guides, offer slots, CTA slots, disclaimer e footer.

Nenhum HTML, CSS ou copia de pagina existente e criado nesta fase.

## SEO

O modelo declara title, meta description, canonical, Open Graph, Twitter Card, breadcrumb, headings, JSON-LD, schema, internal links, related content e indexing policy.

Esses campos sao requisitos futuros, nao alteracoes no SEO atual.

## Conteudo Dinamico

O guia devera futuramente receber ativos por configuracao e catalogo.

Exemplo conceitual:

```text
primaryNucleus = "pj"
published = true
```

Um artigo futuro com essa relacao podera aparecer no Guia PJ conforme filtros, prioridades e regras de publicacao.

O mesmo modelo vale para clusters, calculadoras, artigos, produtos e CTAs.

Nenhuma integracao e implementada nesta fase.

## Ordenacao e Destaques

Ordenacao e destaques devem vir de configuracao:

- featured;
- displayOrder;
- priority;
- showOnGuide;
- section;
- limit;
- filter;
- fallback.

Nada deve ser hardcoded no HTML.

## Gold Standard e Reference System

Guide Blueprint declara `goldStandardType = "guide"` e prepara `goldStandardVersion` e `officialReference`.

Nenhuma referencia real de guia e cadastrada nesta fase.

## Testing e Validation

Testing cobre integridade de relacoes, catalogos, navegacao, links, regressao de SEO, regressao de layout, agregacao de conteudo, empty state e prevencao de duplicidade.

Validation cobre Gold Standard, SEO, JSON-LD, breadcrumb, headings, responsividade, acessibilidade, links, componentes, estrutura e relacao nucleo-guia.

## Publishing

Publishing define draft, preview, review, approval, ready-to-publish, published, rollback, sitemap, indexing e publication log.

Nenhuma publicacao real ocorre nesta fase.

## Limites

Guide Blueprint nao:

- cria Guia CLT ou qualquer guia real;
- cria pagina publica;
- altera pagina existente;
- altera `data/tools.json`;
- altera `data/articles.json`;
- altera sitemap;
- altera URLs;
- altera SEO atual;
- altera HTML, CSS ou JavaScript de producao;
- executa automacao.
