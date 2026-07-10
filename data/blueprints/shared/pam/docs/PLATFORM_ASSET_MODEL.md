# Platform Asset Model

## Objetivo

Platform Asset Model, ou PAM, define a estrutura minima comum usada por ativos da plataforma.

PAM nao e uma Engine, nao e uma nova camada operacional, nao substitui Blueprints, nao substitui Registry e nao substitui POS.

Ele existe apenas para padronizar identidade, relacionamentos, lifecycle, governanca, metadata e auditoria.

## Localizacao

O PAM fica dentro do Blueprint System:

```text
data/blueprints/shared/pam/
```

Essa localizacao evita criar nova raiz em `data/` e preserva o Architecture Freeze.

## Blocos

### Identity

Campos comuns:

- `id`;
- `type`;
- `slug`;
- `title`;
- `owner`;
- `status`;
- `version`;
- `createdAt`;
- `updatedAt`;
- `createdBy`;
- `updatedBy`.

### Relationships

Campos comuns:

- `primaryDomain`;
- `primaryNucleus`;
- `primaryGuide`;
- `primaryCluster`;
- `secondaryRelations`;
- `relatedAssets`;
- `parentAsset`;
- `childrenAssets`;
- `ownership`.

Todos os relacionamentos respeitam o Domain Relationship Model em `/docs/PLATFORM_ARCHITECTURE.md`.

### Lifecycle

Estados oficiais:

- `planned`;
- `draft`;
- `in-development`;
- `testing`;
- `validation`;
- `approved`;
- `ready-to-publish`;
- `published`;
- `deprecated`;
- `archived`;
- `cancelled`.

O PAM declara transicoes permitidas, estados bloqueantes e estados finais. Ele nao executa logica operacional.

### Governance

Referencias declarativas:

- `constitutionVersion`;
- `strategyVersion`;
- `blueprintVersion`;
- `goldStandardVersion`;
- `referenceVersion`;
- `testingVersion`;
- `validationVersion`;
- `publishingVersion`.

Essas referencias nao criam dependencias obrigatorias.

### Metadata

Campos comuns:

- `featured`;
- `priority`;
- `visibility`;
- `language`;
- `tags`;
- `labels`;
- `searchKeywords`;
- `notes`;
- `customMetadata`.

### Audit

Campos comuns:

- `history`;
- `approvals`;
- `reviews`;
- `lastValidation`;
- `lastTesting`;
- `lastPublishing`;
- `changeLog`;
- `revision`.

Nenhum historico real e registrado nesta fase.

## Heranca

Os Blueprints abaixo usam PAM como estrutura base:

- Nucleus Blueprint;
- Guide Blueprint;
- Cluster Blueprint;
- Calculator Blueprint;
- Article Blueprint.

Cada Blueprint adiciona apenas campos especificos do seu tipo.

## Nao Responsabilidades

PAM nao define:

- SEO;
- layout;
- componentes;
- calculos;
- conteudo;
- produtos;
- CTA;
- campanhas;
- publicacao.

Essas responsabilidades permanecem nas camadas ja definidas.

## Compatibilidade

PAM e compativel com Constitution, Strategy, Core, POS, Registry, Blueprints, Gold Standards, Reference System, Operation System, Manifest System, Migration, Testing, Validation e Publishing porque nao altera responsabilidades dessas camadas.

## Limites

PAM nao:

- cria ativos;
- altera producao;
- altera paginas;
- altera runtime;
- altera SEO;
- altera URLs;
- altera catalogos publicos;
- executa automacao.

Esta e a ultima modelagem transversal da fundacao. As proximas fases devem priorizar capacidades operacionais.
