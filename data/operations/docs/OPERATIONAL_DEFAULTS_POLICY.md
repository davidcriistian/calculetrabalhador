# Operational Defaults Policy

## Objetivo

A Operational Defaults Policy define os comportamentos padrao das operacoes da plataforma quando campos opcionais nao forem informados.

Ela existe para reduzir decisoes repetitivas, evitar ambiguidade e impedir que o Codex precise inventar valores durante uma operacao.

## Escopo

Esta politica pertence ao Operation System:

```text
data/operations/defaults/index.json
```

Ela nao cria nova camada, nao cria nova Engine e nao altera a arquitetura da plataforma.

## Filosofia

Defaults nao sao inferencia.

Defaults nao usam IA.

Defaults nao criam conhecimento.

Defaults nao substituem revisao humana.

Defaults nao substituem dados existentes.

Defaults apenas resolvem ausencia de parametros opcionais com regras oficiais e deterministicas.

## Defaults Oficiais

Quando ausentes, os campos abaixo devem ser resolvidos assim:

| Campo | Valor aplicado |
| --- | --- |
| `strategyVersion` | versao vigente em `data/strategy/` |
| `goldStandardVersion` | Gold Standard vigente para o tipo do ativo |
| `blueprintVersion` | Blueprint vigente do tipo correspondente |
| `reference` | `null`, `referenceStatus: unavailable`, warning e `manualReviewRequired: true` |
| `owner` | `core-platform` |
| `lifecycle` | `planned` |
| `runtimeStatus` | `not-consumed` |
| `visibility` | `internal` |
| `publishingStatus` | `draft` |
| `commercialStatus` | `not-configured` |
| `eligibleProducts` | `[]` |
| `eligibleOffers` | `[]` |
| `eligibleCTAs` | `[]` |
| `testingRequired` | `true` |
| `validationRequired` | `true` |
| `publishingRequired` | `true` |
| `rollbackRequired` | `true` |
| `manualApprovalRequired` | `true` |

## Relatorio Obrigatorio

Toda operacao que aplicar defaults deve registrar:

- campo;
- valor original;
- valor aplicado;
- motivo;
- `resolvedByDefault`.

Campos fornecidos explicitamente devem registrar `resolvedByDefault: false`.

Campos resolvidos por esta politica devem registrar `resolvedByDefault: true`.

## Referencias Ausentes

A ausencia de referencia oficial nao bloqueia criacao em draft quando houver Gold Standard aplicavel.

Nesse caso, a operacao deve registrar:

- `referenceStatus: unavailable`;
- warning;
- `manualReviewRequired: true`.

Publicacao continua bloqueada ate revisao e aprovacao.

## Limites

Esta politica nao pode alterar:

- Core;
- Constitution;
- Strategy;
- Blueprint System;
- Gold Standard;
- Reference System;
- paginas publicas;
- runtime;
- SEO;
- URLs;
- sitemap;
- producao.

## Operacoes Afetadas

Todas as operacoes futuras devem consultar esta politica antes de pedir decisao manual para campos opcionais ausentes.

As operacoes de nucleo passam a usar esta politica como comportamento padrao declarativo para `create-nucleus`, `expand-nucleus`, `update-nucleus`, `validate-nucleus` e `publish-nucleus`.

## Resultado Esperado

A politica reduz:

- decisoes manuais repetitivas;
- consumo de creditos;
- divergencias entre operacoes;
- risco de inferencia indevida;
- relatorios incompletos.

Ela mantem a plataforma governada por configuracao e preserva revisao humana nos pontos que exigem julgamento.
