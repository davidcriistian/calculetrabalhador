# CORE_ENGINE

Status: fundacao oficial da plataforma

Versao: 1.0.0

Criado em: 2026-07-09

## 1. Objetivo

O Core Engine e a fundacao oficial futura do Calcule Trabalhador para organizar dominios, regras, tabelas, conceitos, fontes, historico e versionamento de forma permanente.

Nesta fase, o Core Engine nasce em paralelo. Ele nao altera calculadoras, artigos, URLs, SEO, sitemap, componentes visuais, `data/tabelas-trabalhistas.json`, `data/rules/`, `data/maps/` ou `data/brain/`.

O runtime oficial atual continua sendo:

```text
data/tabelas-trabalhistas.json
```

As calculadoras continuam consumindo o runtime atual diretamente ou por meio de:

```text
assets/js/tabelas-trabalhistas.js
```

## 2. Principios

### Core = Conhecimento

O Core Engine e a fonte organizada de conhecimento da plataforma.

Ele responde por:

- leis;
- regras;
- tabelas;
- conceitos;
- fontes;
- historico;
- dominios.

Ele nao deve assumir processos operacionais do POS, como migracao, testes, validacao operacional, produtos, campanhas, automacao ou administracao.

### Single Source of Truth

Toda informacao legal, tabela, percentual, conceito ou fonte oficial deve ter uma fonte primaria declarada. O Core Engine prepara essa camada, mas nao duplica nem substitui as regras atuais nesta fase.

O POS pode consumir conhecimento aprovado do Core por processos operacionais, mas nao deve se tornar fonte de conhecimento juridico ou trabalhista.

### Arquitetura orientada por dominios

O sistema deve suportar qualquer dominio futuro, como CLT, FGTS, INSS, MEI, PJ, IRRF, Beneficios, Aposentadoria, Tributos, Servidor Publico e novos temas.

Nenhum dominio deve receber tratamento especial na arquitetura. Todos devem seguir a mesma anatomia.

### Compatibilidade retroativa

O Core Engine deve conviver com a arquitetura atual sem quebrar nada. Nenhuma calculadora deve consumir `data/core/` ate existir uma fase especifica de integracao, validacao e equivalencia numerica.

### Versionamento permanente

Tabelas antigas, regras antigas e historico legal nunca devem ser apagados. Uma nova versao deve ser adicionada ao lado das anteriores.

### Component First

No futuro, calculadoras, artigos, guias, FAQs, blocos de ofertas, produtos e automacoes devem consumir dados centralizados em vez de repetir informacoes em HTML.

### Runtime atual intocavel

Nesta fase, `data/tabelas-trabalhistas.json` continua sendo a fonte usada pelas calculadoras. `data/core/` e declarativo e nao muda o comportamento do site.

## 3. Estrutura

```text
data/core/
  index.json
  registry/
  domains/
  shared/
  schemas/
  metadata/
  history/
  versioning/
  contracts/
  lifecycle/
  compatibility/
  legislation/
  update/
```

`shared/` e uma area global compartilhada e nao deve ser tratada como dominio.

## 3.1 Arquitetura Interna

A arquitetura interna do Core Engine passa a ter um ponto de entrada unico, contratos declarativos, lifecycle padronizado, schemas compartilhados e convencoes oficiais.

Nenhuma Engine futura deve navegar diretamente pelas pastas internas. O acesso deve comecar por:

```text
data/core/index.json
```

Essa regra evita acoplamento prematuro entre futuras Engines e a estrutura fisica do repositorio.

## 3.2 Core Index

O arquivo `data/core/index.json` e o ponto de entrada oficial do Core Engine.

Ele referencia:

- `registry`
- `domains`
- `shared`
- `schemas`
- `history`
- `metadata`
- `versioning`
- `contracts`
- `lifecycle`
- `compatibility`
- `legislation`
- `update`

O Core Index e declarativo. Ele nao executa codigo, nao publica conteudo e nao conecta o Core ao runtime atual.

## 3.3 Contracts

A pasta `data/core/contracts/` define contratos internos para Engines futuras.

Contratos iniciais:

- Calculator Engine
- Content Engine
- Offers Engine
- Blueprint Engine
- Automation Engine
- Knowledge Engine

Cada contrato define:

- nome;
- versao;
- objetivo;
- entradas esperadas;
- saidas esperadas;
- dependencias;
- observacoes.

Esses contratos sao modelos. Nenhuma Engine foi implementada nesta fase.

## 3.4 Lifecycle

A pasta `data/core/lifecycle/` define o ciclo de vida de qualquer informacao futura do Core.

Estados oficiais:

- `draft`: item em rascunho, nao deve ser consumido por producao.
- `review`: item pronto para revisao tecnica, juridica, editorial ou de fonte.
- `approved`: item aprovado, mas ainda nao ativo.
- `active`: item vigente para consumidores futuros do Core.
- `deprecated`: item descontinuado para novos usos, mas mantido por compatibilidade.
- `archived`: item historico preservado para auditoria.
- `future`: item reservado para modulo, dominio, Engine ou integracao futura.
- `cancelled`: item planejado que nao deve seguir adiante.

Lifecycle nao altera publicacao do site atual. Ele apenas classifica maturidade interna do Core.

## 3.5 Compatibility

A pasta `data/core/compatibility/` define a camada declarativa de compatibilidade entre o Core e a arquitetura atual.

Ela mapeia runtime, regras, tabelas, ferramentas, artigos, dependencias e prontidao de migracao futura, sempre com `coreStatus: not-connected`.

A documentacao detalhada fica em:

```text
docs/COMPATIBILITY_ENGINE.md
```

Nenhum item de compatibilidade deve ser consumido por calculadoras, artigos ou paginas nesta fase.

## 3.6 Legislation

A pasta `data/core/legislation/` define a camada declarativa para registrar e interpretar mudancas legislativas, normativas e de tabelas oficiais.

Ela organiza tipos de mudanca, niveis de impacto, status, matriz de impacto, workflow, arvore de decisao, eventos e regras de validacao.

A documentacao detalhada fica em:

```text
docs/LEGISLATION_ENGINE.md
```

Nenhuma mudanca legislativa registrada nessa Engine altera calculadoras, artigos, rules, maps, tabelas ou runtime nesta fase.

## 3.7 Update

A pasta `data/core/update/` define a camada declarativa para transformar mudancas registradas em planos futuros de atualizacao.

Ela organiza prioridades, status, score de impacto, planner, analisador de dependencias, checklist e template de relatorio.

A documentacao detalhada fica em:

```text
docs/UPDATE_ENGINE.md
```

Nenhum plano da Update Engine executa atualizacoes, altera runtime, modifica calculadoras ou atualiza artigos nesta fase.

## 3.8 Metadados Compartilhados

O schema `data/core/schemas/shared-metadata.schema.json` define a estrutura minima comum para modelos do Core.

Campos obrigatorios:

- `id`
- `version`
- `status`
- `createdAt`
- `updatedAt`
- `owner`
- `source`
- `notes`

Novos schemas do Core devem reutilizar esse contrato sempre que possivel por meio de composicao JSON Schema.

## 3.9 Convencoes

As convencoes oficiais ficam em:

```text
data/core/metadata/conventions.json
```

Convencoes principais:

- diretorios em lowercase kebab-case;
- arquivos JSON nomeados em lowercase kebab-case;
- `index.json` como ponto de entrada de colecoes;
- ids estaveis em lowercase kebab-case;
- slugs publicos sem acento e em kebab-case;
- datas em ISO `YYYY-MM-DD`;
- versoes de contratos e schemas em SemVer;
- owners explicitos;
- status baseados no lifecycle;
- JSON valido, sem comentarios.

## 3.10 Fluxo Interno Do Core

Fluxo interno recomendado:

```text
data/core/index.json
-> registry
-> domain metadata
-> domain layers
-> shared data
-> schemas
-> contracts
-> lifecycle
-> history/versioning
```

Esse fluxo organiza descoberta interna sem criar dependencia com calculadoras, artigos ou runtime.

### Registry

O Registry Mestre fica em:

```text
data/core/registry/domains.json
```

Ele cadastra dominios com os campos:

- `id`
- `slug`
- `name`
- `description`
- `status`
- `owner`
- `createdAt`
- `updatedAt`
- `currentVersion`
- `activeYear`
- `dependencies`
- `references`
- `tags`
- `futureModules`

O Registry e o ponto de entrada para qualquer consumidor futuro do Core Engine.

### Domains

Cada dominio possui a mesma anatomia:

```text
data/core/domains/[domain]/
  legislation/
  tables/
  rules/
  concepts/
  references/
  examples/
  history/
  metadata/
```

Dominios iniciais:

- `clt`
- `fgts`
- `inss`
- `mei`
- `pj`
- `irrf`
- `beneficios`
- `aposentadoria`
- `aviso-previo` (dominio piloto de referencia)

Esses dominios nasceram como estrutura vazia e preparada. Eles nao contêm regras oficiais migradas nesta fase.

## 4. Camadas Do Dominio

### Legislation

Armazena, em fase futura, leis, decretos, portarias, resolucoes, instrucoes normativas, vigencias, encerramentos, orgaos responsaveis, versoes, status, links oficiais e observacoes.

### Tables

Armazena tabelas versionaveis por ano, sem limite fixo. Anos antigos devem permanecer disponiveis.

Exemplo futuro:

```text
data/core/domains/inss/tables/2026/
data/core/domains/inss/tables/2027/
```

### Rules

Prepara compatibilidade futura com `data/rules/`. Nesta fase, `data/rules/` permanece intacto e continua sendo a camada de regras estruturadas ja existente.

### Concepts

Armazena conceitos, definicoes, objetivos, casos especiais, excecoes e observacoes.

### References

Armazena fontes oficiais, links, orgaos, credibilidade, status e ultima conferencia.

### Examples

Armazena casos de teste, cenarios, exemplos e simulacoes que poderao apoiar validacoes futuras.

### History

Armazena mudancas legais, mudancas de regras, motivos, impactos, datas e versoes.

### Metadata

Armazena status, responsavel, versao, ultima atualizacao e observacoes operacionais.

## 5. Shared

A area `data/core/shared/` existe para dados usados por varios dominios e que nao pertencem a um unico dominio.

Shared nao e dominio, nao deve aparecer em `data/core/domains/` e nao deve ser referenciado como `domains/shared`.

Exemplos:

- salario minimo;
- indices nacionais;
- datas nacionais;
- fontes oficiais compartilhadas;
- configuracoes globais.

Nenhum dado compartilhado deve depender de um dominio especifico.

## 6. Schemas

Os schemas oficiais ficam em:

```text
data/core/schemas/
```

Schemas criados:

- `registry.schema.json`
- `domain.schema.json`
- `legislation.schema.json`
- `table.schema.json`
- `rule.schema.json`
- `concept.schema.json`
- `reference.schema.json`
- `example.schema.json`
- `history.schema.json`
- `metadata.schema.json`
- `version.schema.json`
- `shared-metadata.schema.json`
- `core-index.schema.json`
- `contract.schema.json`
- `lifecycle.schema.json`
- `conventions.schema.json`

Eles definem os contratos de dados futuros do Core Engine. Nesta fase, sao contratos declarativos e nao sao usados pelas calculadoras.

## 7. Versionamento

A area `data/core/versioning/` controla versoes, migracoes, compatibilidade, evolucao e historico.

Nesta fase:

- nao existe migracao ativa;
- nenhuma calculadora consome `data/core/`;
- nenhum artigo consome `data/core/`;
- `data/tabelas-trabalhistas.json` continua sendo o runtime oficial.

## 8. Fluxo Futuro

Fluxo futuro desejado:

```text
Fontes oficiais
-> data/core/domains/[domain]/
-> data/core/shared/
-> data/rules/ ou camada de compatibilidade
-> data/tabelas-trabalhistas.json
-> assets/js/tabelas-trabalhistas.js
-> calculadoras
-> artigos, guias, FAQs, ofertas e automacoes
```

Esse fluxo so deve ser ativado em fases futuras, depois de validacao e equivalencia numerica.

## 9. Compatibilidade Com A Arquitetura Atual

O Core Engine conversa com a arquitetura atual por referencias declarativas:

- `data/core/registry/domains.json` aponta para `data/rules/`, `data/tabelas-trabalhistas.json`, maps e catalogos existentes;
- `data/core/domains/*/rules/index.json` declara o alvo de compatibilidade futuro;
- `data/core/versioning/index.json` registra que a migracao ainda nao comecou;
- `data/core/metadata/core.json` declara que o runtime oficial atual permanece intocado.

Nenhuma dessas referencias executa codigo ou altera paginas.

## 10. Como Adicionar Um Novo Dominio

1. Adicionar o dominio em `data/core/registry/domains.json`.
2. Criar `data/core/domains/[novo-dominio]/`.
3. Criar as subpastas padrao:
   - `legislation/`
   - `tables/`
   - `rules/`
   - `concepts/`
   - `references/`
   - `examples/`
   - `history/`
   - `metadata/`
4. Criar arquivos `index.json` vazios para as colecoes.
5. Criar `metadata/domain.json`.
6. Registrar dependencias, referencias e modulos futuros no Registry.
7. Nao conectar a calculadoras sem fase propria de integracao.

## 11. Como Adicionar Um Novo Ano

1. Confirmar a fonte oficial.
2. Criar nova versao anual dentro da camada adequada do dominio.
3. Registrar fonte, vigencia, data de consulta e status.
4. Preservar anos anteriores.
5. Registrar a mudanca em `history/`.
6. Atualizar `versioning/` quando a estrutura do contrato mudar.
7. Somente em fase futura, avaliar transformacao para `data/rules/` ou `data/tabelas-trabalhistas.json`.

## 12. Como Registrar Mudancas Legais

Toda mudanca legal futura deve informar:

- dominio afetado;
- tipo de mudanca;
- fonte oficial;
- data de consulta;
- vigencia inicial;
- vigencia final, se existir;
- versao;
- motivo;
- impacto esperado;
- calculadoras e artigos potencialmente afetados.

Mudancas legais devem ser registradas antes de qualquer alteracao de calculo.

## 13. Integracoes Futuras

### Rules

O Core Engine podera alimentar ou validar `data/rules/`, mas nao substitui essa pasta nesta fase.

### Maps

Maps poderao apontar para dominios Core para identificar impacto de mudancas por dominio, regra e ano.

### Dependencies

Dependencies poderao usar dominios Core para declarar impacto compartilhado entre ferramentas, artigos e regras.

### Calculadoras

Calculadoras so devem consumir Core Engine depois de:

- contrato aprovado;
- transformador definido;
- equivalencia numerica comprovada;
- fallback preservado;
- validacao manual e automatica.

### Artigos

Artigos poderao consumir conceitos, fontes, FAQs e historico no futuro, mas continuam usando HTML e `data/articles.json` nesta fase.

### Offers Engine

Ofertas futuras poderao usar dominios, conceitos e contexto do usuario para recomendar produtos sem misturar regra oficial com monetizacao.

### Blueprint Engine

Blueprints futuros poderao usar schemas e dominios para gerar novas calculadoras, artigos e guias com governanca consistente.

### Automation Engine

Automacoes futuras poderao usar registry, versioning e history para validar mudancas, detectar impacto e apoiar atualizacoes anuais.

## 14. Boas Praticas

- Nunca duplicar regra oficial sem declarar fonte.
- Nunca apagar versoes antigas.
- Nunca conectar `data/core/` ao runtime sem validacao.
- Nunca tratar um dominio como excecao arquitetural.
- Nunca navegar diretamente por pastas internas quando o Core Index puder ser usado.
- Nunca criar Engine sem contrato declarativo previo.
- Nunca usar status fora do lifecycle oficial sem justificar em schema proprio.
- Sempre registrar fonte, vigencia, status e versao.
- Sempre preencher os metadados compartilhados em novos modelos.
- Sempre preservar `data/tabelas-trabalhistas.json` ate uma migracao ser aprovada.
- Sempre separar regra legal, catalogo, conteudo editorial, componente visual e monetizacao.

## 14.1 Checklist Para Novos Dominios

- [ ] Registrar o dominio em `data/core/registry/domains.json`.
- [ ] Criar a anatomia padrao em `data/core/domains/[domain]/`.
- [ ] Criar `metadata/domain.json`.
- [ ] Criar `index.json` para legislation, tables, rules, concepts, references, examples e history.
- [ ] Usar ids e slugs em kebab-case.
- [ ] Declarar owner, source, status e versao.
- [ ] Declarar dependencias e referencias.
- [ ] Nao conectar a calculadoras nesta etapa.
- [ ] Registrar mudancas relevantes em history/versioning.

## 14.2 Checklist Para Novas Engines

- [ ] Criar contrato em `data/core/contracts/`.
- [ ] Registrar o contrato em `data/core/contracts/index.json`.
- [ ] Declarar objetivo, entradas, saidas e dependencias.
- [ ] Usar metadados compartilhados.
- [ ] Definir status inicial como `future` ou `draft`.
- [ ] Nao implementar codigo na fase de contrato.
- [ ] Nao conectar Engine ao runtime sem fase propria.
- [ ] Documentar validacoes esperadas antes de qualquer integracao.

## 15. Fora De Escopo Nesta Fase

Esta fase nao:

- implementa automacoes;
- migra calculadoras;
- migra artigos;
- altera regras existentes;
- altera SEO;
- altera URLs;
- altera sitemap;
- altera componentes visuais;
- muda resultados de calculo;
- cria transformadores novos.

## 16. Confirmacao De Compatibilidade

O Core Engine foi criado como camada paralela. Ele nao muda o comportamento atual do site.

O runtime oficial permanece:

```text
data/tabelas-trabalhistas.json
```

Qualquer integracao futura deve ser planejada como fase separada, pequena, validavel e reversivel.
