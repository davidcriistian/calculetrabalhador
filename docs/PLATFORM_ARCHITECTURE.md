# PLATFORM_ARCHITECTURE

Status: documentacao consolidada da infraestrutura

Versao: 1.0.0

Criado em: 2026-07-09

## Objetivo

Consolidar a arquitetura do Calcule Trabalhador apos a estabilizacao da infraestrutura.

Esta documentacao descreve Core, Compatibility, Legislation, Update, runtime atual, governanca, versionamento e criterios para futuras migracoes.

## Diagrama Textual

```text
Fontes oficiais
-> Legislation Engine
-> Update Engine
-> Compatibility Engine
-> Core Engine
-> Shadow Bridge Layer
-> POS Testing
-> Homologation Protocol
-> Calculation Equivalence
-> Runtime atual preservado
-> Calculadoras
-> Artigos
```

Nesta fase, o fluxo e documental. Nenhuma Engine executa alteracao operacional.

## Engines

### Core Engine

Fundacao da plataforma. Organiza dominios, shared, schemas, metadata, history, versioning, contracts e lifecycle.

Core = conhecimento. Ele responde por leis, regras, tabelas, conceitos, fontes, historico e dominios.

### Project Operating System

POS = operacao. Ele responde por criacao, migracao, testes, validacao, produtos, campanhas, automacao e administracao.

O POS nao deve ser fonte de conhecimento juridico ou trabalhista. Ele consome o Core por contratos e processos.

### Compatibility Engine

Mapeia a relacao entre Core e arquitetura atual, incluindo runtime, rules, tables, tools, articles e dependencies.

### Legislation Engine

Interpreta mudancas legislativas, normativas e de vigencia.

### Update Engine

Transforma mudancas em planos futuros de atualizacao.

### Shadow

Bridge Layer entre Core e POS Testing para evidencia tecnica de equivalencia. Nao e runtime e nao altera producao.

## Dependencias

```text
Core
  <- Compatibility consulta
  <- Legislation referencia
  <- Update consulta

Legislation
  -> Update

Update
  -> Compatibility

Compatibility
  -> Runtime atual como referencia read-only
```

## Dominios

Dominios principais:

- clt
- fgts
- inss
- mei
- pj
- irrf
- beneficios
- aposentadoria
- aviso-previo

`aviso-previo` e o dominio piloto de referencia. `shared` nao e dominio; e area global compartilhada.

## Runtime

O runtime oficial atual permanece:

```text
data/tabelas-trabalhistas.json
assets/js/tabelas-trabalhistas.js
```

Nenhuma calculadora consome `data/core/` nesta fase.

## Compatibilidade

A compatibilidade e declarativa. Ela mostra onde os dados atuais estao e como podem se relacionar com o Core em uma migracao futura.

## Governanca

Toda migracao futura deve passar por Homologation Protocol, Calculation Equivalence, Migration Checklist, validacao JSON, governance e transform rules quando aplicavel.

Principio oficial: configuracao acima de codigo. Toda funcionalidade recorrente deve ser controlada por configuracao antes de ser controlada por codigo.

## Versionamento

Regras, tabelas, dominios e mudancas futuras devem preservar historico e versoes antigas. Nenhuma versao antiga deve ser apagada como parte de atualizacao comum.

## Fluxo Completo Futuro

```text
Mudanca legal
-> registro em Legislation
-> plano em Update
-> impacto em Compatibility
-> dominio Core atualizado em fase propria
-> equivalencia numerica
-> homologacao
-> migracao piloto
-> monitoramento
```

## Boas Praticas

- Manter Engines declarativas ate fase de integracao.
- Migrar uma calculadora por vez.
- Comecar por dominio pequeno.
- Preservar rollback.
- Validar equivalencia antes de publicar.
- Nunca tratar `shared` como dominio.

## Roadmap

1. Homologar dominio piloto `aviso-previo`.
2. Executar equivalencia numerica da calculadora escolhida.
3. Fazer primeira migracao piloto com fallback.
4. Avaliar Offers Engine.
5. Avaliar Blueprint Engine.
6. Avaliar Automation Engine.

## Architecture Freeze Authority

Este documento e a autoridade principal para fronteiras entre camadas. Documentos especializados podem detalhar sua propria camada, mas nao devem redefinir as responsabilidades abaixo.

### Grafo Oficial

A arquitetura nao e uma cadeia linear obrigatoria. Ela e um grafo de responsabilidades:

```text
Constitution -> todos os principios permanentes
Strategy -> decisoes evolutivas e priorizacao
Core -> conhecimento trabalhista e tabelas declarativas
Gold Standard -> padrao oficial de qualidade
Reference System -> implementacoes aprovadas como referencia
Blueprint -> especificacao declarativa de construcao
Registry System -> descoberta seletiva de ativos
Manifest System -> contexto minimo por operacao
Operation System -> playbooks, workflows e pipelines
Migration -> somente quando houver migracao
Shadow -> somente quando houver comparacao, baseline ou equivalencia
Testing -> gate tecnico quando aplicavel
Validation -> gate de conformidade quando aplicavel
Publishing -> controlador unico de entrada em producao
Automation futura -> execucao de processos aprovados
```

Manifest, Operations e Registry sao transversais. Migration e condicional. Shadow e condicional e temporario. Testing e Validation sao gates obrigatorios quando a operacao exige prova tecnica ou conformidade. Publishing e a unica camada autorizada a controlar entrada em producao. Constitution, Strategy, Core, Gold Standard, Reference System e Blueprint informam decisoes, mas nao publicam nem executam diretamente.

### Autoridade de Registry

Existem duas responsabilidades diferentes:

- POS Registry: descoberta e governanca operacional do POS. Ele organiza operacoes, migracoes, testes, validacoes, status operacionais, gates, aprovacoes, processos e referencias para engines operacionais.
- Registry System em `data/registry`: indice particionado de ativos. Ele permite descobrir calculadoras, artigos, clusters, nucleos, dominios e futuros produtos por tipo, dominio, nucleo, cluster, status, versao e owner.

O POS Registry nao e catalogo mestre de ativos. O Registry System nao armazena ativos completos, conhecimento juridico, SEO completo, regras legais nem processos operacionais.

Os catalogos publicos atuais continuam sendo `data/tools.json` e `data/articles.json` ate uma futura migracao aprovada. O Registry System nao substitui esses arquivos nesta fase e nao cria consumo operacional.

### Asset Identity Policy

A identidade canonica de qualquer ativo e definida pela Asset Identity Policy em:

```text
data/constitution/governance/asset-identity-policy.json
```

Todo ativo deve possuir `assetId`, `assetType`, `publicSlug`, `displayName`, `version`, `status` e `owner`.

O `assetId` e a chave interna imutavel e deve usar identificador tipado, como `cluster:clt-ou-pj`, `article:clt-ou-pj` ou `calculator:calculadora-clt-ou-pj`.

O `publicSlug` e apenas atributo publico de rota ou exibicao. Ele nao precisa ser unico globalmente e pode se repetir entre tipos diferentes. Relacionamentos internos, Registry, PAM, Publishing, Testing, Validation, Operations, Manifest e mapas de relacionamento devem usar `assetId`, nunca slug, titulo ou URL.

Normalizacoes futuras recomendadas ficam em:

```text
data/constitution/governance/asset-identity-normalization-plan.json
```

Esse plano nao executa migracao e nao altera slugs, URLs, runtime ou relacionamentos operacionais existentes.

### Papel Oficial do Shadow

Shadow e uma camada temporaria de evidencia tecnica e baseline. Ele existe para comparar arquitetura legada e nova, registrar equivalencia, fornecer evidencia para Testing e Validation e apoiar migracoes controladas.

Shadow nao e runtime, nao e fonte de resultado para usuario, nao e fonte juridica, nao e catalogo, nao e camada permanente de execucao e nao substitui Testing nem Validation.

Shadow deve entrar em sunset por ativo quando todos os criterios abaixo estiverem satisfeitos:

- equivalencia aprovada;
- Testing aprovado;
- Validation aprovado;
- migracao concluida;
- periodo de observacao encerrado;
- rollback validado;
- aprovacao manual registrada.

### Matriz de Responsabilidades

| Camada | Responsabilidade | Fonte da verdade | Pode consultar | Pode modificar | Nao pode modificar | Ciclo de vida | Condicao de participacao | Autoridade final |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Constitution | Principios permanentes | `data/constitution/` | Todas as camadas | Principios e limites constitucionais | Producao, runtime, ativos finais | Permanente | Sempre | Principios |
| Strategy | Direcao e priorizacao | `data/strategy/` | Constitution, arquitetura, operacoes | Decisoes estrategicas | Regras legais, runtime, publicacao | Evolutivo | Planejamento e priorizacao | Direcao estrategica |
| Core | Conhecimento trabalhista | `data/core/` | Constitution, legislation, compatibility | Conhecimento, regras, tabelas e dominios declarativos | Runtime, paginas, SEO, publicacao | Versionado | Operacoes que dependem de conhecimento | Conhecimento |
| Gold Standard | Padrao de qualidade | `data/gold-standards/` | Constitution, Strategy, Reference | Criterios de qualidade | Ativos publicados e runtime | Versionado | Criacao, validacao e revisao | Qualidade |
| Reference System | Referencias aprovadas | `data/references/` | Gold Standard, ativos aprovados | Ponteiros para implementacoes de referencia | Conteudo dos ativos e runtime | Versionado | Quando houver padrao aprovado | Referencia |
| Blueprint | Especificacao de construcao | `data/blueprints/` | Core, Gold, Reference, Strategy | Modelos declarativos de calculadoras e artigos | Paginas publicadas e runtime | Versionado | Criacao ou alteracao estrutural | Especificacao |
| POS Registry | Descoberta operacional e governanca POS | `data/pos/registry/` | POS, Operations, Migration, Testing, Validation | Status, gates, processos e referencias operacionais | Catalogos publicos, ativos completos, conhecimento juridico | Foundation ate ativacao futura | Operacoes POS | Governanca operacional |
| Registry System | Descoberta particionada de ativos | `data/registry/` | Catalogos aprovados, manifests, operations | Indices minimos por tipo/dominio/nucleo/cluster/status/versao/owner | Ativos completos, regras legais, SEO completo, processos operacionais | Foundation ate populacao futura | Descoberta seletiva | Indice de ativos |
| Manifest | Contexto minimo por operacao | `data/manifests/` | Registry, Operations, POS | Escopo, contexto, restricoes e gates por operacao | Ativos, runtime, publicacao | Versionado | Toda operacao padronizada | Contexto operacional |
| Operations | Playbooks e workflows | `data/operations/` | Manifest, Registry, Testing, Validation, Publishing | Procedimentos e sequencias operacionais | Conhecimento, ativos finais, runtime | Versionado | Execucao de processo | Processo |
| Migration | Protocolo de migracao | `data/pos/migration/` | Core, Registry, Manifest, Testing, Validation, Shadow | Planos, fases, gates e rollback de migracao | Ativos publicados sem aprovacao, runtime | Condicional | Apenas quando houver migracao | Protocolo de migracao |
| Shadow | Evidencia e baseline temporarios | `data/core/shadow/` | Runtime atual read-only, Core, Testing, Validation | Evidencias, comparacoes e logs de equivalencia | Resultado ao usuario, catalogos, regras legais | Temporario por ativo | Comparacao, equivalencia ou baseline | Evidencia tecnica |
| Testing | Gate tecnico | `data/pos/testing/` | Shadow, Core, Operations, Manifest | Suites, baselines, resultados e criterios tecnicos | Publicacao e conhecimento juridico | Versionado | Operacoes que exigem prova tecnica | Aprovacao tecnica |
| Validation | Gate de conformidade | `data/pos/validation/` | Constitution, Gold, Blueprint, Testing, Operations | Checklists, severidade, evidencias e aprovacao de conformidade | Runtime e publicacao direta | Versionado | Operacoes que exigem conformidade | Conformidade |
| Publishing | Entrada em producao | `data/publishing/` | Testing, Validation, Operations, Manifest, Registry | Planos, gates, rollback e logs de publicacao | Conhecimento Core e ativos sem processo aprovado | Condicional por release | Qualquer entrada em producao | Publicacao |
| Automation futura | Execucao aprovada | A definir em fase propria | Manifest, Operations, Registry, Testing, Validation, Publishing | Execucao de processos aprovados | Regras, publicacao e runtime fora dos gates | Futura | Somente apos aprovacao explicita | Execucao |

## Domain Relationship Model

Este documento tambem e a autoridade canonica para a linguagem de relacionamento entre ativos. Nenhuma camada deve redefinir dominio, nucleo, guia, cluster, calculadora, artigo, FAQ, glossario, download, produto, oferta ou CTA com outro significado.

### Hierarquia Canonica

```text
Dominio
  -> contem Nucleos

Nucleo
  -> pertence a um Dominio principal
  -> possui um Guia principal
  -> contem Clusters

Guia
  -> representa publicamente um unico Nucleo
  -> agrega Clusters, Calculadoras e Artigos do Nucleo

Cluster
  -> pertence a um Nucleo principal
  -> pertence a um Dominio principal
  -> pode ter uma Calculadora principal
  -> deve ter um Artigo pilar quando aplicavel
  -> pode ter Artigos satelites
  -> pode ter FAQ, Glossario, Downloads, Produtos elegiveis e CTAs configuraveis

Calculadora
  -> pertence a um Dominio principal
  -> pertence a um Nucleo principal
  -> pertence a pelo menos um Cluster canonico
  -> pode apoiar outros Clusters secundarios
  -> possui uma relacao principal unica

Artigo
  -> pertence a um Nucleo principal
  -> pertence a um Cluster canonico
  -> possui funcao `pillar` ou `satellite`
  -> pode apoiar calculadoras e clusters secundarios
  -> possui uma relacao principal unica

Produto
  -> nao pertence estruturalmente ao Cluster
  -> e elegivel por configuracao para Nucleo, Cluster, Calculadora, Artigo ou Slot

CTA
  -> e selecionado por configuracao
  -> aponta para Calculadora, Produto, Guia ou outro destino autorizado
  -> nunca deve ser hardcoded como regra arquitetural
```

### Cardinalidades

- Um Dominio pode possuir varios Nucleos.
- Um Nucleo pertence a um Dominio principal.
- Um Nucleo possui um Guia principal.
- Um Guia representa um unico Nucleo.
- Um Nucleo pode possuir varios Clusters.
- Um Cluster pertence a um Nucleo principal.
- Um Cluster pertence a um Dominio principal.
- Um Cluster pode possuir zero ou uma Calculadora principal.
- Um Cluster pode possuir zero ou um Artigo pilar.
- Um Cluster pode possuir varios Artigos satelites.
- Uma Calculadora possui um Cluster principal.
- Um Artigo possui um Cluster principal.
- Produtos e CTAs sao relacoes configuraveis, nao ownership estrutural.

### Relacao Canonica e Relacoes Secundarias

Cada ativo deve declarar uma relacao canonica principal. Arrays genericos nao substituem a relacao principal.

Campos canonicos recomendados:

- `primaryDomain`;
- `primaryNucleus`;
- `primaryGuide`;
- `primaryCluster`;
- `primaryCalculator`;
- `primaryArticle`.

Relacoes adicionais devem ser declaradas separadamente:

- `secondaryClusters`;
- `relatedCalculators`;
- `relatedArticles`;
- `relatedGuides`;
- `eligibleProducts`.

A relacao canonica responde "onde este ativo pertence". Relacoes secundarias respondem "onde este ativo tambem apoia, aparece ou pode ser recomendado".

### Ownership por Camada

| Relacao | Autoridade | Limite |
| --- | --- | --- |
| Dominio e conhecimento juridico | Core | Strategy pode priorizar, mas nao redefine regra juridica. |
| Nucleos, clusters e prioridade editorial | Strategy | Nao altera conhecimento Core nem publicacao direta. |
| Estrutura de ativos | Blueprint System | Nao decide sozinho SEO final, runtime ou publicacao. |
| Descoberta compacta | Registry System | Nao armazena ativo completo nem ownership operacional. |
| Status e governanca operacional | POS Registry | Nao substitui catalogos publicos nem Core. |
| Passos de criacao e atualizacao | Operation System | Nao executa sem gates aplicaveis. |
| Contexto minimo da operacao | Manifest System | Nao vira inventario completo. |
| Padrao de qualidade | Gold Standard | Nao publica nem altera runtime. |
| Exemplos aprovados | Reference System | Nao substitui blueprint nem Core. |
| Comportamento e regressao | Testing | Nao aprova conformidade sozinho. |
| Conformidade | Validation | Nao publica sozinha. |
| Entrada em producao | Publishing | Controla entrada, mas nao redefine conhecimento, design ou relacoes. |

Nenhuma camada deve redefinir ownership de outra. Quando houver conflito, a matriz acima prevalece.

### Fluxos Oficiais de Relacionamento

CREATE NUCLEUS:

```text
input
-> verificar Domain
-> definir Nucleus
-> definir Guide
-> registrar Clusters iniciais
-> aplicar Blueprint
-> aplicar Gold Standard
-> Testing
-> Validation
-> Publishing
```

CREATE CLUSTER:

```text
input
-> verificar Nucleus
-> definir intencao e objetivo
-> definir Calculator principal, quando aplicavel
-> definir Pillar Article
-> definir Satellite Articles
-> definir relacoes
-> Testing
-> Validation
-> Publishing
```

CREATE CALCULATOR:

```text
input
-> identificar Domain
-> identificar Nucleus
-> identificar primaryCluster
-> aplicar Calculator Blueprint
-> aplicar Gold Standard
-> registrar relacoes
-> atualizar catalogos atuais quando aprovado
-> Testing
-> Validation
-> Publishing
```

CREATE ARTICLE:

```text
input
-> identificar Nucleus
-> identificar primaryCluster
-> definir role: pillar ou satellite
-> aplicar Article Blueprint
-> aplicar CTA de calculadora no inicio, meio e final quando aplicavel
-> registrar relacoes
-> atualizar catalogos atuais quando aprovado
-> Testing
-> Validation
-> Publishing
```

UPDATE ASSET:

```text
input
-> localizar relacao canonica
-> localizar dependencias
-> identificar impacto
-> atualizar configuracao
-> Testing
-> Validation
-> Publishing
```

### Preservacao de Design e Logica

- Design vem de Gold Standard, Blueprint System e Reference System.
- Logica juridica vem do Core.
- Relacoes vem deste modelo canonico.
- Operacao vem de Manifest System e Operation System.
- Aprovacao vem de Testing, Validation e Publishing.

Codex nao deve inferir livremente design, logica juridica, relacoes, operacao ou aprovacao. Cada decisao deve apontar para a autoridade correspondente.

## Platform Asset Model

O Platform Asset Model, ou PAM, fica em `/data/blueprints/shared/pam/`.

PAM e o modelo base compartilhado por Nucleus, Guide, Cluster, Calculator e Article Blueprints. Futuramente, Product, Offer, CTA e Campaign podem usar o mesmo vocabulario comum.

PAM define apenas:

- identity;
- relationships;
- lifecycle;
- governance;
- metadata;
- audit.

PAM nao define SEO, layout, componentes, calculos, conteudo, produtos, CTA, campanhas ou publicacao. Essas responsabilidades permanecem nas camadas ja definidas.

PAM nao substitui Blueprints, Registry ou POS. Ele apenas impede que ativos redefinam conceitos basicos de identidade, relacionamento, lifecycle, governanca e auditoria.

Esta e a ultima modelagem transversal da fundacao. Depois dela, a evolucao arquitetural deve priorizar capacidades operacionais como create, update, validate e publish.

## Architecture Evolution Policy

A autoridade permanente para evolucao arquitetural e `/data/constitution/governance/architecture-evolution-policy.json`.

Regra central:

```text
reutilizar -> estender -> justificar -> auditar -> aprovar
```

Architecture Foundation esta `FROZEN`; novas modelagens transversais estao `BLOCKED`; novas camadas sao `EXCEPTION ONLY`; capacidades operacionais estao em `ACTIVE DEVELOPMENT`.

Este documento referencia a politica, mas nao substitui a Constitution.
