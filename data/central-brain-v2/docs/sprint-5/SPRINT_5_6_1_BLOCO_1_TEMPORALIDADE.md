# Sprint 5.6.1 — Bloco 1: Temporalidade

## Resultado executivo

O motor passou a distinguir comunicação, início da contagem, último dia factual e término jurídico projetado. A contagem canônica exclui o dia da comunicação, começa no dia civil seguinte e inclui o vencimento.

## Implementado

- política temporal canônica `TEMPORAL-POLICY-BR-001`;
- biblioteca de datas civis sem dependência de timezone;
- contagem determinística em dias corridos;
- seleção bitemporal de versões de regras;
- gate de governança por modo `sandbox` e `operational`;
- bloqueio operacional de regras sem aprovação formal;
- resolução explícita da data jurídica de referência;
- snapshot ampliado com código, schemas, contratos e governança;
- dois novos fatos temporais;
- projeção de término corrigida para partir da comunicação;
- trilha temporal nas operações e resultados.

## Validação

- 84 testes estruturais aprovados;
- 20 testes do runtime aprovados;
- 188 JSONs verificados pelo validador;
- 0 erros estruturais;
- 0 falhas temporais conhecidas nos casos cobertos;
- aviso histórico de 8 inventários legados permanece isolado.

## Limites

O Brain continua em `runtimeAuthority=false` e `consumerReady=false`. Regras em `review` são aceitas somente no sandbox; em modo operacional são bloqueadas e encaminhadas para revisão humana.
