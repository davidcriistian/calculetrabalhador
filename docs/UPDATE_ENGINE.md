# UPDATE_ENGINE

Status: camada declarativa de planejamento de atualizacoes

Versao: 2.6.0

Criado em: 2026-07-09

## 1. Objetivo

A Update Engine transforma mudancas registradas em planos estruturados de atualizacao futura.

Ela responde:

- o que precisa ser atualizado;
- qual prioridade;
- quem sera afetado;
- qual impacto estimado;
- qual complexidade;
- qual plano de execucao futura.

Nesta fase, ela nao executa atualizacoes, nao altera runtime, nao altera calculadoras, nao altera artigos e nao modifica rules, maps, brain ou tabelas.

## 2. Arquitetura

O ponto de entrada fica em:

```text
data/core/update/index.json
```

A estrutura da Engine e:

```text
data/core/update/
  index.json
  update-template.json
  priority-levels.json
  update-status.json
  impact-score.json
  planner.json
  dependencies-analyzer.json
  update-checklist.json
  update-report-template.json
```

Todos os arquivos sao declarativos e permanecem `not-connected` ao runtime.

## 3. Fluxo

O fluxo oficial e:

```text
Mudanca legislativa
-> Analise
-> Plano de atualizacao
-> Validacao
-> Execucao futura
-> Conclusao
```

Execucao futura esta fora do escopo desta fase.

## 4. Planner

O arquivo `planner.json` define como uma mudanca legislativa deve virar plano:

- recebe uma mudanca da Legislation Engine;
- consulta matriz de impacto e Compatibility Engine;
- monta plano usando `update-template.json`;
- valida com checklist e score;
- prepara uma execucao futura, sem aplica-la agora.

## 5. Checklist

O arquivo `update-checklist.json` obriga a verificar:

- regras;
- tabelas;
- calculadoras;
- artigos;
- FAQs;
- exemplos;
- fontes;
- schema;
- documentacao.

O checklist reduz o risco de uma atualizacao futura esquecer dependencias.

## 6. Dependencias

O arquivo `dependencies-analyzer.json` modela o fluxo:

```text
Regra
-> Tabela
-> Ferramenta
-> Artigo
-> Oferta
-> Blueprint
```

Ele aponta para mapas da Compatibility Engine, mas nao executa varredura automatica nesta fase.

## 7. Score De Impacto

O arquivo `impact-score.json` define criterios como:

- numero de calculadoras afetadas;
- numero de artigos afetados;
- mudanca de tabela;
- mudanca de lei;
- mudanca constitucional;
- mudanca de percentual;
- mudanca de vigencia.

O score ajuda a transformar impacto em prioridade.

## 8. Boas Praticas

- Sempre vincular o plano a uma mudanca de origem.
- Consultar Legislation Engine para fonte, vigencia e impacto legal.
- Consultar Compatibility Engine para ferramentas, artigos e dependencias.
- Separar planejamento de execucao.
- Registrar complexidade e tempo estimado com grau de confianca.
- Exigir validacao de equivalencia para qualquer impacto numerico futuro.
- Nunca alterar runtime a partir desta Engine nesta fase.

## 9. Como Registrar Uma Atualizacao

1. Criar um registro baseado em `update-template.json`.
2. Informar `sourceChange` apontando para mudanca legislativa.
3. Definir dominio, prioridade e status inicial.
4. Listar regras, tabelas, calculadoras e artigos afetados.
5. Calcular impacto estimado usando `impact-score.json`.
6. Preencher complexidade, tempo e checklist.
7. Manter status `draft` ou `planned` ate existir fase futura de execucao.

## 10. Como Interpretar Prioridades

- `none`: manter apenas registro.
- `low`: revisao simples, geralmente editorial ou documental.
- `medium`: impacto localizado com revisao controlada.
- `high`: impacto em multiplos itens ou risco numerico.
- `critical`: impacto amplo, retroativo ou sensivel.
- `emergency`: resposta futura urgente, com plano de contingencia.

## 11. Integracao Futura

### Legislation Engine

A Legislation Engine fornece a mudanca de origem, fonte, vigencia, tipo e impacto legal.

### Compatibility Engine

A Compatibility Engine informa quais rules, tabelas, ferramentas e artigos podem ser afetados.

### Core

O Core fornece dominios, contratos, lifecycle, schemas, history e versioning para governanca.

### Blueprint Engine

Blueprints futuros poderao transformar planos em roteiros de execucao, revisao ou publicacao.

### Automation Engine

Automacoes futuras poderao executar partes do plano depois de validacao e aprovacoes explicitas.

### Calculadoras

Calculadoras continuam intocadas nesta fase. Atualizacao futura exige validacao numerica e fase propria.

### Artigos

Artigos continuam intocados nesta fase. Atualizacao futura exige revisao editorial e fase propria.

## 12. Fora De Escopo

Esta fase nao implementa automacao, nao altera calculadoras, nao altera artigos, nao altera runtime e nao executa atualizacoes.
