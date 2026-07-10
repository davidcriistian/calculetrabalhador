# Strategy

## Objetivo

A Strategy Layer define as estrategias operacionais e editoriais atuais do Calcule Trabalhador.

Ela responde:

```text
Como o projeto opera hoje.
```

## Constitution Vs Strategy

Constitution e permanente.

Strategy e evolutiva.

A Strategy pode mudar continuamente sem alterar a Constitution, mas nunca pode contrariar seus principios.

## Estrutura

```text
data/strategy/
  registry/
  seo/
  clusters/
  editorial/
  monetization/
  products/
  cta/
  publishing/
  ux/
  growth/
  blueprints/
  shared/
  schemas/
  contracts/
  metadata/
  history/
  versioning/
  docs/
```

## Clusters

Cluster Blueprint sera a unidade editorial principal.

Article Blueprint passa a ser componente interno do Cluster Blueprint.

Todo artigo pertence obrigatoriamente a um Cluster.

Toda calculadora pertence obrigatoriamente a um Cluster.

## SEO

SEO define politicas configuraveis para links internos, FAQ, JSON-LD, estrutura, related content, heading strategy e meta strategy.

## Editorial

Editorial define artigo pilar, artigos satelites, ordem de criacao, clusters, objetivo, intencao e autoridade tematica.

## Monetization

Monetization modela tipos de produtos, posicoes, estrategias, prioridades e regras.

## Products

Products modela catalogo logico, categorias, nucleos elegiveis, clusters elegiveis, versionamento e status.

## CTA

CTA modela tipos, prioridades, posicoes, regras e configuracao.

## Publishing

Publishing modela ordem, pre-publicacao, pos-publicacao, aprovacao e revisao.

## UX

UX modela componentes, responsividade, hierarquia e experiencia.

## Growth

Growth modela expansao de clusters, expansao de nucleos, expansao editorial e roadmaps.

## Relacao Com Core

Strategy nao e fonte de conhecimento juridico ou trabalhista. Ela usa Core como fonte de conhecimento.

## Relacao Com POS

Strategy orienta processos operacionais futuros, mas nao executa operacoes.

## Relacao Com Blueprint System

Strategy orienta como blueprints devem ser usados. Blueprints constroem ativos em fases futuras, respeitando Strategy e Constitution.

## Estado Atual

Esta camada e declarativa, `not-consumed`, e nao altera producao.
