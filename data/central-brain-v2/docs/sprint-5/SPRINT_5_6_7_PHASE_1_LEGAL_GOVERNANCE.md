# Sprint 5.6.7 — Fase 1: Governança Jurídica

## Objetivo

Separar maturidade técnica de maturidade jurídica e tornar a promoção legal auditável por escopo, função e fingerprint.

## Correções

- `approvalStatus` obrigatório em todas as versões canônicas de regra.
- `reviewScope` obrigatório em registros formais de aprovação.
- Autor usa decisão `submitted`; revisores jurídico/técnico e aprovador usam `approved`.
- `technicalMaturity` e `legalMaturity` independentes.
- Promoção para consumidor exige maturidade técnica e jurídica.
- Metadados do catálogo de regras sincronizados.
- Políticas `approval-policy.json` e `maturity-policy.json` adicionadas.
- Validador e testes estruturais ampliados.

## Estado

- `technicalMaturity`: `PROJECTIONS_VALIDATED`
- `legalMaturity`: `PENDING_FORMAL_REVIEW`
- `consumerReady`: `false`
- Aprovações formais: `0`

## Validação

- Validator: OK — `2.4.1-sprint5.6.7-phase1`
- Testes estruturais: 109 aprovados
- Projection Runtime: 46 aprovados, 0 falhas
- Advertência remanescente: `LEGACY_PLACEHOLDERS` (8 inventários legados)
