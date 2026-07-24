# Central Brain v2 — 2.6.0-sprint5.6.7-phaseD

Plataforma canônica paralela com o modelo jurídico da Sprint 5.6.7 Fase 2 carregado e mantido sob revisão jurídica formal.

## Estado da entrega

- conhecimento do domínio piloto `aviso-previo`: carregado;
- fontes, conceitos, fatos, regras e projeções: estruturalmente validados;
- aprovação jurídica formal: pendente;
- `consumerReady`: `false`;
- autoridade de runtime: `false`;
- conexão com calculadoras e artigos: desativada.

## Regra de organização

- conhecimento oficial entra em `sources`;
- interpretação operacional entra em `rules`;
- saída para consumidores entra em `projections`;
- relações entram em `dependencies`;
- toda transição entra em `audit-events`;
- consumidores nunca escrevem conhecimento.

## Validação

```bash
python validation/validate.py
node tests/run-tests.js
node tests/projection-runtime/run.js
```

## Versionamento

`2.6.0-sprint5.6.7-phaseD` é a versão canônica desta entrega. Versões internas de schemas, contratos, motores e entidades permanecem independentes por compatibilidade semântica.
