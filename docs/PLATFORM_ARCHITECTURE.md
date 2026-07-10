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
