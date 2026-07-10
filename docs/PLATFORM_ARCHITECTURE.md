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
