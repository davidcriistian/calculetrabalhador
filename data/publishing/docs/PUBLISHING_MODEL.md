# Publishing Model

## Objetivo

O Publishing Model define o ciclo oficial de publicacao de qualquer ativo futuro do Calcule Trabalhador.

Nesta fase, ele e apenas declarativo.

Ele nao publica nada, nao executa deploy, nao altera sitemap, nao chama IndexNow e nao modifica producao.

## Filosofia

Publishing controla a entrada em producao.

Ele nao define qualidade. Gold Standard define qualidade.

Ele nao executa Testing. Ele exige Testing aprovado.

Ele nao executa Validation. Ele exige Validation aprovada.

Ele nao cria ativos. Blueprint define a especificacao do ativo.

Ele nao executa procedimentos. Operation System define procedimentos e Automation futura podera executa-los.

## Responsabilidades

Publishing deve modelar:

- draft;
- preview;
- review;
- approval;
- readiness;
- release;
- deploy;
- sitemap;
- indexing;
- rollback;
- logs;
- historico de publicacao.

Publishing nao deve:

- alterar paginas;
- alterar runtime;
- alterar HTML, CSS ou JavaScript;
- alterar SEO existente;
- alterar URLs;
- alterar sitemap.xml;
- executar deploy;
- chamar IndexNow;
- chamar servicos externos.

## Lifecycle

Estados oficiais:

```text
draft
preview-ready
in-review
changes-requested
approved
ready-to-publish
publishing
published
deploying
deployed
failed
rollback-requested
rolling-back
rolled-back
archived
cancelled
```

Transicoes permitidas sao modeladas em:

```text
data/publishing/lifecycle/index.json
```

Transicoes arbitrarias nao sao permitidas.

## Gates

Gates obrigatorios:

```text
gold-standard-compliance
reference-alignment
testing-pass
validation-pass
seo-pass
runtime-safe
links-pass
jsonld-pass
responsive-pass
accessibility-pass
performance-pass
rollback-ready
manual-approval
sitemap-ready
indexing-ready
deploy-ready
```

Publicacao deve ser bloqueada quando existir:

- falha critica;
- Testing reprovado;
- Validation reprovada;
- Gold Standard non-compliant;
- ausencia de rollback;
- ausencia de aprovacao manual;
- canonical invalido;
- URL invalida;
- sitemap inconsistente;
- dependencia ausente;
- referencia quebrada;
- erro de JSON-LD;
- runtime inseguro.

## Preview

Preview e modelado para:

- calculadora;
- artigo;
- cluster;
- guia;
- produto;
- CTA;
- oferta;
- atualizacao legal.

Campos:

```text
previewId
assetId
assetType
version
sourceVersion
generatedAt
expiresAt
status
url
evidence
notes
```

Nenhum preview real e gerado nesta fase.

## Review

Review registra:

```text
reviewId
assetId
reviewer
reviewType
startedAt
completedAt
findings
severity
decision
requestedChanges
evidence
notes
```

## Approval

Toda publicacao futura deve possuir aprovacao manual.

Approval registra:

```text
approvalId
assetId
approvedBy
approvedAt
approvalType
scope
gatesPassed
exceptions
status
notes
```

## Release

Release registra a versao publicavel:

```text
releaseId
assetId
assetType
draftVersion
publishedVersion
goldStandardVersion
blueprintVersion
strategyVersion
coreVersion
createdAt
approvedAt
publishedAt
status
checksum
changelog
dependencies
```

## Deploy

Deploy e apenas modelado.

Ambientes previstos:

```text
local
development
staging
production
```

Campos:

```text
deployId
releaseId
environment
branch
commitHash
startedAt
completedAt
status
filesAffected
rollbackPlan
evidence
notes
```

Nenhum deploy real ocorre nesta fase.

## Sitemap

O modelo de sitemap prepara:

- adicionar URL;
- atualizar URL;
- remover URL;
- preservar canonical;
- validar duplicidade;
- validar URLs com sufixos antigos;
- registrar lastmod;
- gerar evidencia;
- bloquear publicacao quando inconsistente.

`sitemap.xml` nao e alterado nesta fase.

## Indexing

Indexing modela integracao futura com:

- IndexNow;
- Google Search Console;
- outros mecanismos quando aplicavel.

Campos:

```text
provider
url
submittedAt
status
response
retryCount
notes
```

Nenhuma chamada externa e feita nesta fase.

## Rollback

Rollback oficial registra:

```text
rollbackId
releaseId
sourceVersion
targetVersion
reason
requestedBy
approvedBy
filesToRestore
registryChanges
sitemapChanges
indexingChanges
startedAt
completedAt
status
verification
notes
```

Suporta:

- rollback parcial;
- rollback completo;
- rollback de conteudo;
- rollback de calculo;
- rollback de SEO;
- rollback de produto/CTA.

## Logs

Logs registram:

```text
logId
timestamp
operation
assetId
assetType
version
actor
status
filesAffected
gates
evidence
notes
```

## Integracoes Futuras

Publishing se relaciona com:

- Constitution: limites e principios;
- Strategy: prioridade, posicionamento e contexto;
- Gold Standard: qualidade exigida;
- Reference System: alinhamento com implementacoes aprovadas;
- Blueprint System: especificacao do ativo;
- Operation System: procedimento operacional;
- Manifest System: contexto minimo;
- Registry System: descoberta;
- Core: conhecimento e versao de regras;
- POS: governanca operacional;
- Migration: mudancas e rollback;
- Testing: gates de comportamento;
- Validation: gates de conformidade;
- Shadow: evidencia e baseline quando aplicavel;
- Automation futura: execucao do procedimento.

## Testing vs Validation vs Publishing vs Automation

Testing prova comportamento tecnico.

Validation prova conformidade estrutural e de qualidade.

Publishing controla entrada em producao.

Automation futura executa procedimentos aprovados.

Publishing nao substitui nenhuma dessas camadas.

## Autoridade no Grafo

As fronteiras oficiais entre camadas estao em `/docs/PLATFORM_ARCHITECTURE.md`.

Publishing e o controlador unico de entrada em producao. Constitution, Strategy, Core, Gold Standard, Reference System, Blueprint, Registry, Manifest, Operations, Migration, Shadow, Testing e Validation podem informar ou bloquear uma publicacao, mas nao publicam diretamente.

Quando uma publicacao envolver dominio, nucleo, guia, cluster, calculadora, artigo, produto ou CTA, Publishing deve conferir o Domain Relationship Model em `/docs/PLATFORM_ARCHITECTURE.md` antes de aprovar entrada em producao.

Nesta fase, Publishing continua declarativo e `not-consumed`; nenhuma integracao operacional, deploy, alteracao de pagina, sitemap, SEO, URL ou runtime e criada.

## Limites Desta Fase

Esta fase nao:

- publica nada;
- altera sitemap;
- altera paginas;
- altera producao;
- executa deploy;
- chama IndexNow;
- chama servicos externos.

Ela cria somente o modelo oficial e seguro de publicacao da plataforma.
