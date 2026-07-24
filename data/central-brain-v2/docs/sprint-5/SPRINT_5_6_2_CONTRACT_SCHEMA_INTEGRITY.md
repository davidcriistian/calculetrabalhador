# Sprint 5.6.2 — Contract & Schema Integrity

## Objetivo

Eliminar divergências entre contrato, JSON Schema e implementação do Projection Runtime.

## Implementações

- Interface canônica única: `executeDomain(request, { brainRoot })`.
- Requisição oficial: `targetProjectionId`, `factPackage` e `executionContext`.
- `brainRoot` removido do contrato jurídico e tratado como configuração do host.
- Validação estrutural da requisição, resultado e bundle pelo módulo `schema-validator`.
- Schemas de request e bundle registrados no índice oficial.
- Contrato legado de consumidor explicitamente isolado.
- Novo contrato canônico `projection-runtime-consumer`.
- Matriz de compatibilidade criada em `projection-runtime.compatibility.json`.
- Catálogo do motor atualizado com `canonical`, `output-materializer`, `schema-validator` e operação temporal efetiva.
- Rastreabilidade por saída adicionada em `outputTrace`.

## Compatibilidade

Runtime 1.2.0 é compatível com os schemas e contratos listados na matriz de compatibilidade do projeto.

## Validação executada

- Testes estruturais: 84 aprovados.
- Testes do Projection Runtime: 34 aprovados.
- Validador principal: `ok=true`, 199 JSONs verificados, 0 erros.
- Advertência preservada: 8 inventários legados vazios e sem autoridade.

## Estado operacional

- `runtimeAuthority=false`
- `consumerReady=false`

O sprint corrige integridade contratual, mas não promove o motor para produção.
