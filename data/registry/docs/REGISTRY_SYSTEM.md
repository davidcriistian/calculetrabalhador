# Registry Partitioning System

## Objetivo

O Registry Partitioning System cria a arquitetura oficial de registries particionaveis do Calcule Trabalhador.

O objetivo e preparar a plataforma para crescer por muitos anos sem transformar registries em arquivos JSON gigantes.

Esta fase nao migra registries existentes, nao popula ativos, nao cria integracao operacional e nao altera producao.

As fronteiras oficiais entre camadas estao em `/docs/PLATFORM_ARCHITECTURE.md`. Este documento detalha apenas o Registry System e nao redefine a autoridade geral da plataforma.

## Filosofia

Registries sao indices.

Eles servem para descoberta rapida, nao para conhecimento, regras, SEO, operacao ou conteudo canonico.

Um registry pode dizer que um ativo existe e apontar para sua fonte correta. Ele nao deve copiar esse ativo.

Os catalogos publicos atuais continuam sendo `data/tools.json` e `data/articles.json` ate futura migracao aprovada. O Registry System nao substitui esses arquivos nesta fase.

Principios:

- index-only;
- no asset duplication;
- no knowledge storage;
- no legal source;
- no SEO source;
- no operational logic;
- partition before scale;
- configuration over code;
- low Codex context.

## Estrutura

```text
data/registry/
  index.json
  by-type/
  by-domain/
  by-nucleus/
  by-cluster/
  by-status/
  by-version/
  by-owner/
  shared/
  schemas/
  contracts/
  metadata/
  history/
  versioning/
  docs/
```

O ponto de entrada e:

```text
data/registry/index.json
```

## Particionamento

O sistema prepara os seguintes eixos de descoberta:

- `by-type`: calculadoras, artigos, clusters, produtos, campanhas, blueprints, engines, dominios e nucleos;
- `by-domain`: ativos relacionados a um dominio juridico ou editorial;
- `by-nucleus`: ativos agrupados por nucleo;
- `by-cluster`: ativos agrupados por cluster;
- `by-status`: ativos por estado de ciclo de vida;
- `by-version`: ativos por versao;
- `by-owner`: ativos por responsavel.

Nesta fase, cada particao possui apenas `index.json` vazio.

No futuro, quando crescer, uma particao podera ser quebrada em arquivos menores, por exemplo:

```text
data/registry/by-type/calculator/index.json
data/registry/by-domain/rescisao/index.json
data/registry/by-cluster/ferias/index.json
data/registry/by-status/published/index.json
```

## Formato de Entrada

Cada entrada futura deve usar apenas:

```json
{
  "id": "example-asset-id",
  "type": "example-type",
  "slug": "/example-slug/",
  "status": "draft",
  "owner": "Calcule Trabalhador",
  "version": "0.1.0",
  "references": {
    "canonicalSource": "logical-component-reference"
  }
}
```

Campos fora desse shape devem ser evitados.

Registries nao devem armazenar:

- conteudo completo;
- HTML completo;
- calculos;
- regras juridicas;
- SEO canonico;
- produtos reais completos;
- logica operacional;
- resultados de testing;
- resultados de validation.

## Escalabilidade

Esta arquitetura prepara o projeto para:

- 500+ calculadoras;
- 1000+ artigos;
- 200+ produtos;
- centenas de clusters;
- dezenas de nucleos;
- multiplos dominios;
- multiplas versoes.

O ganho vem de evitar um unico arquivo central com milhares de entradas e de permitir leitura seletiva por eixo de descoberta.

## Indices

O arquivo `data/registry/index.json` e apenas o indice mestre da camada.

Ele aponta para as particoes e para os contratos, schemas, metadados, historico, versionamento e documentacao.

Ele nao deve receber todos os ativos diretamente.

## Responsabilidades

O Registry System deve:

- indicar onde procurar;
- reduzir leitura de contexto;
- apontar para fontes canonicas;
- permitir descoberta por varias dimensoes;
- suportar crescimento sem arquivos gigantes;
- ajudar Admin e Automation no futuro.

O Registry System nao deve:

- ser fonte de conhecimento;
- ser fonte juridica;
- ser fonte de SEO;
- ser fonte operacional;
- substituir Core;
- substituir POS;
- substituir Blueprints;
- substituir Manifests;
- alimentar runtime.

## Relacao com Core

Core continua sendo a fonte de conhecimento.

O Registry System pode apontar para um dominio, regra, tabela ou conceito do Core, mas nunca deve copiar conhecimento juridico.

## Relacao com POS

POS continua sendo a camada de governanca operacional.

O Registry System complementa descoberta rapida e particionamento. Ele nao substitui o POS Registry nem executa Migration, Testing, Validation ou Publishing.

O POS Registry governa operacoes, gates, aprovacoes, status operacionais e processos. O Registry System apenas aponta para ativos minimos por particao.

## Relacao com Blueprint System

Blueprint System define como ativos devem ser construidos.

O Registry System pode indexar blueprints e ativos derivados no futuro, mas nao deve armazenar a estrutura completa de um blueprint.

## Relacao com Operation System

Operation System define playbooks, workflows e rotinas.

O Registry System pode ajudar uma operacao futura a encontrar ativos por tipo, cluster, dominio, status ou owner.

Ele nao define como executar a operacao.

## Relacao com Manifest System

Manifest System define o contexto minimo de uma operacao.

O Registry System pode ser uma fonte de descoberta consultada por um manifesto futuro, mas nao substitui o manifesto.

Manifest responde "o que ler para operar". Registry responde "onde encontrar referencias".

## Como Evita JSONs Gigantes

O sistema evita crescimento centralizado por tres mecanismos:

1. o indice mestre aponta para particoes;
2. cada particao agrupa entradas por uma dimensao;
3. particoes podem ser quebradas em subparticoes quando crescerem.

Assim, uma operacao futura pode ler apenas:

```text
by-cluster/ferias
```

em vez de carregar todos os ativos da plataforma.

## Como Melhora Performance

Mesmo sem runtime nesta fase, a arquitetura melhora performance futura porque reduz:

- leitura de arquivos grandes;
- parse de JSONs enormes;
- busca em listas globais;
- conflitos de edicao;
- consumo de contexto pelo Codex.

## Como Melhora Manutencao

Particoes pequenas sao mais faceis de revisar, versionar e auditar.

Tambem reduzem conflito quando varias operacoes futuras trabalham em dominios, clusters ou tipos diferentes.

## Como Reduz Consumo de Creditos

O Codex podera localizar ativos por particao em vez de ler registries grandes.

Exemplo futuro:

```text
operationId -> manifest -> registry partition -> canonical source
```

Isso reduz leitura e evita redescoberta manual.

## Preparacao para Product Catalog

Produtos futuros poderao ser descobertos por:

- tipo;
- cluster;
- dominio;
- status;
- owner;
- version.

O Registry System nao armazena o produto completo. Ele apenas aponta para o Product Catalog quando esse existir.

## Preparacao para Admin

Um futuro painel administrativo podera usar registries particionados para listar ativos por:

- status;
- owner;
- cluster;
- dominio;
- tipo;
- versao.

Nesta fase, nenhuma integracao de Admin e criada.

## Preparacao para Automation

Automacoes futuras poderao consultar particoes para descobrir escopo de trabalho.

Exemplo:

```text
validar todos os artigos do cluster X
```

A automacao futura consultaria uma particao por cluster e depois seguiria manifests, playbooks, testing e validation.

Nesta fase, nenhuma automacao e implementada.

## Limites Desta Fase

Esta fase nao:

- migra registries existentes;
- popula ativos;
- duplica calculadoras;
- duplica artigos;
- duplica clusters;
- duplica produtos;
- altera Core;
- altera POS;
- altera Blueprints;
- altera Operations;
- altera Manifests;
- cria consumo operacional;
- altera producao.

Ela apenas cria a arquitetura oficial de Registry Partitioning para crescimento futuro.
