# LEGISLATION_ENGINE

Status: camada declarativa de legislacao

Versao: 2.5.0

Criado em: 2026-07-09

## 1. Objetivo

A Legislation Engine e o cerebro declarativo para interpretar mudancas legislativas, normativas e de tabelas oficiais dentro do Calcule Trabalhador.

Ela responde:

- o que mudou;
- quando mudou;
- qual dominio foi afetado;
- quais tabelas foram afetadas;
- quais regras foram afetadas;
- quais calculadoras e artigos podem ser afetados futuramente;
- qual nivel de impacto;
- se existe retroatividade;
- se existe periodo de transicao.

Nesta fase, ela nao altera runtime, calculadoras, artigos, rules, maps ou tabelas existentes.

## 2. Arquitetura

O ponto de entrada fica em:

```text
data/core/legislation/index.json
```

A estrutura da Engine e:

```text
data/core/legislation/
  index.json
  change-types.json
  impact-levels.json
  change-status.json
  impact-matrix.json
  change-template.json
  workflow.json
  decision-tree.json
  event-types.json
  validation-rules.json
```

Todos os arquivos sao declarativos e possuem `runtimeStatus: not-connected` ou papel equivalente definido no indice.

## 3. Fluxo

O fluxo oficial e:

```text
Nova lei ou evento normativo
-> Cadastro da mudanca
-> Validacao
-> Aprovacao
-> Analise de impacto
-> Migracao futura
-> Publicacao futura
```

Nenhuma etapa executa publicacao automaticamente nesta fase.

## 4. Workflow

O arquivo `workflow.json` documenta a governanca da mudanca.

Ele define etapas, guardrails e a separacao entre registrar uma mudanca e aplicar uma mudanca. Aplicacao real exige fase futura de integracao, equivalencia numerica e revisao.

## 5. Eventos

O arquivo `event-types.json` cataloga eventos como:

- lei publicada;
- lei revogada;
- tabela atualizada;
- regra criada;
- regra removida;
- mudanca de vigencia;
- mudanca de interpretacao.

Eventos iniciam analise, mas nao alteram dados.

## 6. Tipos De Mudanca

O arquivo `change-types.json` padroniza tipos como:

- nova lei;
- nova portaria;
- novo decreto;
- nova instrucao normativa;
- alteracao de aliquota;
- alteracao de faixa;
- correcao monetaria;
- mudanca de percentual;
- mudanca de vigencia;
- revogacao;
- substituicao;
- correcao tecnica.

## 7. Impactos

O arquivo `impact-levels.json` define:

- `none`
- `low`
- `medium`
- `high`
- `critical`

Impacto representa risco e amplitude para analise futura. Ele nao altera comportamento do site atual.

## 8. Matriz

O arquivo `impact-matrix.json` prepara a analise sobre:

- Domains
- Rules
- Tables
- Tools
- Articles
- Offers
- Blueprints

Essa matriz permite identificar se uma mudanca exige revisao de regras, tabelas, calculadoras, artigos ou engines futuras.

## 9. Boas Praticas

- Registrar sempre fonte oficial.
- Informar data de publicacao e vigencia.
- Separar mudanca legislativa de mudanca tecnica.
- Declarar retroatividade explicitamente.
- Declarar periodo de transicao quando existir.
- Usar ids estaveis em kebab-case.
- Nunca conectar mudancas ao runtime sem validacao futura.
- Consultar a Compatibility Engine para impacto em ferramentas e artigos.

## 10. Como Cadastrar Uma Nova Lei

1. Criar um registro baseado em `change-template.json`.
2. Usar tipo `new-law`.
3. Informar fonte oficial, data de publicacao e vigencia.
4. Declarar dominio e impacto inicial.
5. Listar tabelas, regras, ferramentas e artigos possivelmente afetados.
6. Enviar para status `review`.

## 11. Como Registrar Alteracao De Tabela

1. Usar tipo `range-change`, `monetary-correction`, `rate-change` ou `percentage-change`.
2. Declarar `affectedTables`.
3. Declarar regras e ferramentas dependentes.
4. Consultar `data/core/compatibility/tables-map.json`.
5. Marcar impacto minimo `medium`; usar `high` quando afetar calculadoras.

## 12. Como Registrar Mudanca De Percentual

1. Usar tipo `percentage-change`.
2. Registrar percentual anterior e novo nas notas ou no registro futuro da mudanca.
3. Marcar regras e tabelas afetadas.
4. Exigir validacao de equivalencia antes de qualquer uso futuro.

## 13. Como Registrar Mudanca De Vigencia

1. Usar tipo `validity-change`.
2. Preencher `effectiveDate`.
3. Informar se existe retroatividade.
4. Informar periodo de transicao quando existir.
5. Elevar impacto para `high` ou `critical` se houver efeito retroativo.

## 14. Integracao Futura

### Core

A Legislation Engine passa a ser referenciada pelo `data/core/index.json`, mas permanece isolada.

### Compatibility

A Compatibility Engine sera consultada futuramente para descobrir quais ferramentas e artigos dependem das regras ou tabelas afetadas.

### Rules

Rules futuras poderao ser atualizadas ou versionadas a partir de mudancas aprovadas, mas isso nao acontece nesta fase.

### Calculadoras

Calculadoras continuam consumindo o runtime atual. Qualquer migracao futura exige piloto, testes e equivalencia numerica.

### Artigos

Artigos podem ser marcados como afetados em registros futuros, mas nenhum artigo e alterado por esta Engine nesta fase.

### Offers Engine

Offers futuras poderao usar impacto legislativo para pausar, alterar ou priorizar ofertas relacionadas a dominios afetados.

### Blueprint Engine

Blueprints futuros poderao usar eventos legislativos para gerar checklists, revisoes e planos de atualizacao.

## 15. Fora De Escopo

Esta fase nao implementa automacao, nao altera regras existentes, nao migra calculadoras, nao migra artigos e nao modifica o runtime.
