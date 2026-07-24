# Changelog — Sprint 5.5

## Adicionado
- motor de resolução modular em `engines/projection-runtime`;
- carregamento e fingerprint de snapshot;
- validação e resolução de conflitos factuais;
- seleção bitemporal de regras;
- avaliador declarativo de condições e exceções;
- biblioteca fechada de operações puras;
- execução topológica das oito projeções;
- trilhas de regras, exceções, dependências e fatos;
- schemas de requisição e bundle de execução;
- seis fixtures e doze testes de runtime.

## Controles preservados
- `runtimeAuthority: false`;
- `consumerReady: false`;
- sem conexão com calculadoras;
- sem execução de código arbitrário originado nos JSONs.
