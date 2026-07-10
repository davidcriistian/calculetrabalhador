# Nucleus Blueprint

## Objetivo

Nucleus Blueprint modela a organizacao estrategica de um nucleo futuro do Calcule Trabalhador.

Esta fase nao cria nucleos reais, nao cria paginas publicas, nao altera guias existentes e nao altera producao.

## Autoridade de Relacionamento

O Domain Relationship Model em `/docs/PLATFORM_ARCHITECTURE.md` continua sendo a autoridade canonica.

Nucleus Blueprint apenas aplica esse modelo:

- `primaryDomain` define o dominio principal do nucleo;
- `primaryGuide` define o guia publico principal do nucleo;
- clusters, calculadoras, artigos, downloads, glossary, FAQs, produtos, ofertas e CTAs sao referencias por identificador.

## Estrutura

```text
data/blueprints/nucleus/
  index.json
  metadata/nucleus.json
  history/index.json
  versioning/index.json
  schemas/
  contracts/
  docs/
```

## Modelo

O template declara:

- identidade;
- relacoes;
- governanca;
- growth;
- Testing;
- Validation;
- Publishing;
- limites operacionais.

## Growth

Growth e declarativo. Ele prepara planejamento de clusters, calculadoras, artigos, gaps comerciais e roadmap sem cadastrar numeros reais nesta fase.

## Gold Standard

Nucleus Blueprint declara `goldStandardVersion` na governanca. A versao real sera preenchida somente quando houver nucleo concreto e aprovacao de qualidade.

## Testing e Validation

Testing cobre integridade de relacoes, catalogos, navegacao, links, agregacao de conteudo, empty state e prevencao de duplicidade.

Validation cobre conformidade com Gold Standard, estrutura, links, componentes e relacao nucleo-guia.

## Publishing

Publishing define estados declarativos: draft, preview, review, approval, ready-to-publish, published e rollback.

Nenhuma publicacao real ocorre nesta fase.

## Operacoes Futuras

O modelo prepara:

- `create-nucleus`: definir dominio, guia principal, clusters iniciais e gates;
- `expand-nucleus`: adicionar novos clusters, artigos, calculadoras e gaps;
- `update-nucleus`: revisar relacoes, growth, governanca e status.

## Limites

Nucleus Blueprint nao:

- cria nucleos CLT, FGTS, INSS, MEI, PJ, IRRF, Beneficios ou Aposentadoria;
- altera `data/tools.json`;
- altera `data/articles.json`;
- altera sitemap;
- altera URLs;
- altera SEO atual;
- altera HTML, CSS ou JavaScript de producao;
- executa automacao.
