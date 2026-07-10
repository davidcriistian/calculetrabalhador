# Operation System

## Objetivo

O Operation System define como as operacoes da plataforma deverao ser executadas.

Ele nao executa operacoes, nao altera paginas, nao automatiza nada e nao modifica producao.

## Arquitetura

```text
data/operations/
  registry/
  playbooks/
  workflows/
  pipelines/
  templates/
  checklists/
  decision-trees/
  prompt-library/
  best-practices/
  reports/
  schemas/
  contracts/
  metadata/
  history/
  versioning/
  docs/
```

## Playbooks

Playbooks descrevem operacoes repetiveis como criar calculadora, criar cluster, criar artigo, atualizar lei, validar ativo, publicar, rollback, migrar, trocar produto, trocar CTA, criar campanha, atualizar SEO, criar dominio e expandir cluster.

Eles reduzem improviso e consumo de creditos.

## Workflows

Workflows definem a ordem declarativa:

```text
Entrada
-> Pre-condicoes
-> Blueprint
-> Core
-> Testing
-> Validation
-> Publishing
-> Relatorio
```

## Pipelines

Pipelines sao sequencias reutilizaveis:

- Calculator Pipeline;
- Article Pipeline;
- Cluster Pipeline;
- Migration Pipeline;
- Publishing Pipeline;
- Validation Pipeline;
- SEO Pipeline.

## Prompt Library

A Prompt Library modela objetivo, entradas, saidas, pre-condicoes, dependencias, restricoes e validacao. Ela nao armazena prompts completos nesta fase.

## Integracao Com Constitution

Toda operacao deve respeitar a Constitution.

## Integracao Com Strategy

Toda operacao deve considerar a Strategy atual antes de criar ou alterar ativos futuros.

## Integracao Com Core

Operacoes que envolvem conhecimento juridico ou trabalhista devem consumir o Core como fonte de conhecimento.

## Integracao Com POS

Operacoes futuras devem passar por POS quando envolverem Migration, Testing, Validation, Admin, Automation ou Publishing gates.

## Integracao Com Blueprint System

Operacoes de criacao devem usar blueprints aprovados antes de qualquer geracao futura.

## Estado Atual

O Operation System esta em modo `foundation` e `not-consumed`.

Nenhuma operacao e executada nesta fase.
