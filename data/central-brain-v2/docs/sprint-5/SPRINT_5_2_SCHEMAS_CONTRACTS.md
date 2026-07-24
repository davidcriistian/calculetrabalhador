# Sprint 5.2 — Schemas e Contratos do Projection Engine

## Objetivo

Formalizar, antes do código executável, as fronteiras e estruturas de dados do motor de projeções jurídicas.

## Entregas

- `legal-fact.schema.json`: definição canônica e governada de fatos jurídicos.
- `fact-package.schema.json`: envelope imutável de fatos por caso, com origem, evidência, confiança e conflito.
- `canonical-projection.schema.json`: definição declarativa de projeção jurídica `PROJ-*`.
- `projection-result.schema.json`: resultado auditável, determinístico e explícito sobre incerteza.
- `projection-catalog.schema.json`: catálogo por domínio.
- `projection-engine.contract.json`: ordem de execução, limites, temporalidade e falhas.
- `projection-result.contract.json`: garantias e obrigações dos consumidores.

## Decisão de compatibilidade

O projeto já possuía artefatos `PRJ-*` destinados a payloads imutáveis de consumidores. A Sprint 5 introduz `PROJ-*` para projeções jurídicas canônicas. As duas classes não foram fundidas: `PROJ-*` deriva conhecimento; `PRJ-*` empacota resultados para consumidores.

## Salvaguardas

- `runtimeAuthority = false`.
- `consumerReady = false`.
- fatos ausentes não podem ser inventados;
- conflitos não podem ser resolvidos silenciosamente;
- versões históricas são selecionadas por data de referência;
- operações permitidas são puras e enumeradas;
- resultados carregam fingerprints, snapshot e trilhas de decisão.

## Estado

Estruturas prontas para o próximo bloco: catálogo canônico de fatos do domínio Aviso-Prévio.
