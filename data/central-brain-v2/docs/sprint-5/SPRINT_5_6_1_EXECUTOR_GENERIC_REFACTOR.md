# Sprint 5.6.1 — Refatoração do Executor Genérico

## Objetivo
Remover conhecimento específico do domínio de aviso-prévio do executor central.

## Alterações
- extraído o materializador de saídas para `output-materializer.js`;
- removidos condicionais para `PROJ-AP-007` e `PROJ-AP-008`;
- removidos mapeamentos de fatos específicos do executor;
- defaults e traduções passaram a ser declarados nas projeções por `defaultValue` e `valueMap`;
- schema canônico ampliado para validar os novos metadados;
- testes de regressão adicionados para impedir reintrodução de IDs de domínio no executor.

## Resultado arquitetural
O executor voltou a atuar apenas como orquestrador. O significado jurídico e a transformação de valores permanecem nos artefatos declarativos da camada de conhecimento.
