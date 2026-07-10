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
  defaults/
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

O playbook generico `create-asset` fica em:

```text
data/operations/playbooks/asset/index.json
```

Ele e o fluxo base para provisionamento interno draft de qualquer ativo suportado. Operacoes como `create-calculator`, `create-article`, `create-cluster`, `create-guide` e `create-nucleus` devem herdar esse fluxo e acrescentar somente regras especificas do tipo.

Playbooks que envolvem dominio, nucleo, guia, cluster, calculadora, artigo, produto ou CTA devem seguir o Domain Relationship Model em `/docs/PLATFORM_ARCHITECTURE.md`.

Nucleus Operations ficam em:

```text
data/operations/playbooks/nucleus/index.json
```

Elas cobrem `create-nucleus`, `expand-nucleus`, `update-nucleus`, `validate-nucleus` e `publish-nucleus`.

## Workflows

Workflows definem a ordem declarativa:

```text
Entrada
-> Relacao canonica
-> Pre-condicoes
-> Blueprint
-> Core
-> Testing
-> Validation
-> Publishing
-> Relatorio
```

Workflows de nucleo ficam em:

```text
data/operations/workflows/nucleus/index.json
```

Eles reutilizam PAM, Nucleus Blueprint, Guide Blueprint, Testing, Validation e Publishing.

O workflow generico `create-asset` fica em:

```text
data/operations/workflows/asset/index.json
```

Ele segue a ordem: Manifest, Operational Defaults, PAM, Blueprint, Gold Standard, Reference System, Registry, Testing Plan, Validation Plan, Publishing Draft e Reports.

## Checklists

Checklists de nucleo ficam em:

```text
data/operations/checklists/nucleus/index.json
```

Eles organizam pre-operation, execution, post-operation, approval e rollback-readiness.

## Defaults

Defaults oficiais ficam em:

```text
data/operations/defaults/index.json
```

Eles resolvem campos opcionais ausentes por regras deterministicas, nunca por inferencia ou IA.

Toda aplicacao de default deve aparecer no relatorio da operacao com `resolvedByDefault`.

Documentacao complementar:

```text
data/operations/docs/OPERATIONAL_DEFAULTS_POLICY.md
```

## Reports

Templates genericos de relatorio para `create-asset` ficam em:

```text
data/operations/reports/asset/index.json
```

Todo provisionamento generico deve produzir Asset Specification, Relationship Map, Registry Entry, Publishing Entry, Testing Plan, Validation Plan, Rollback Plan, Operation Report e Audit Report.

Modelos de relatorio de nucleo ficam em:

```text
data/operations/reports/nucleus/index.json
```

Eles padronizam relatorios para criar, expandir, atualizar, validar e publicar nucleos.

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

Nucleus Operations sao capacidades declarativas. Elas nao criam nucleos reais, nao criam paginas publicas, nao alteram runtime, nao alteram SEO, nao alteram URLs, nao alteram sitemap e nao executam deploy.

Operational Defaults sao politica declarativa. Eles nao alteram Core, Constitution, Strategy, Blueprints, Gold Standard, Reference System, runtime, paginas ou producao.
