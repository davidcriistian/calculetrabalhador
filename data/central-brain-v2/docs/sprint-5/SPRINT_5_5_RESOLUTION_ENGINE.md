# Sprint 5.5 — Motor de Resolução

## Objetivo
Implementar execução determinística e auditável das projeções canônicas PROJ-AP-001 a PROJ-AP-008 sobre pacotes tipados de fatos.

## Componentes
- carregador imutável de snapshot;
- canonicalização e fingerprints SHA-256;
- validação estrutural e semântica de fatos;
- resolução de conflitos com políticas explícitas;
- seleção bitemporal de versões de regras;
- avaliador restrito de condições e exceções;
- biblioteca fechada de operações puras;
- execução topológica de dependências;
- construção de explicações e trilhas;
- validação defensiva dos resultados.

## Segurança
O motor não usa eval, Function, scripts provenientes de JSON ou módulos dinâmicos. Somente quatro operações registradas são permitidas. `runtimeAuthority` e `consumerReady` permanecem falsos.

## Determinismo
O snapshot, a entrada e as saídas são canonicalizados antes do SHA-256. O relógio é injetável. O fingerprint de saída exclui identificadores e timestamps operacionais, permitindo reprodução.

## Limites conhecidos
As regras e projeções permanecem em `review`. O motor é tecnicamente executável em modo de validação, mas não está aprovado para decisão jurídica autônoma nem conectado a consumidores.
