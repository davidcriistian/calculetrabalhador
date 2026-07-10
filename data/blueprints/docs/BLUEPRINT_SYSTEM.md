# Blueprint System

## Objetivo

O Blueprint System define, de forma declarativa, como qualquer ativo futuro do Calcule Trabalhador devera ser construido.

Nesta fase, ele nao gera calculadoras, nao gera artigos, nao altera paginas existentes e nao executa automacao.

## Filosofia

O Blueprint System segue o principio de configuracao acima de codigo.

Ele transforma padroes recorrentes em modelos declarativos para que futuras fases possam criar ativos com menos improviso, menor consumo de creditos e mais consistencia.

O modelo canonico de dominio, nucleo, guia, cluster, calculadora, artigo, produto e CTA esta em `/docs/PLATFORM_ARCHITECTURE.md`. Blueprints devem consumir esse modelo e nao redefinir relacoes de ownership.

O Platform Asset Model fica em `/data/blueprints/shared/pam/index.json` e define a estrutura comum minima de ativos. Ele nao substitui Blueprints; cada Blueprint herda o PAM e adiciona apenas campos especificos do seu tipo.

## Estrutura

```text
data/blueprints/
  registry/
  nucleus/
  guide/
  cluster/
  calculator/
  article/
  shared/
    pam/
  schemas/
  contracts/
  metadata/
  history/
  versioning/
  docs/
```

O ponto de entrada e:

```text
data/blueprints/registry/index.json
```

## Fluxo

Fluxo futuro previsto:

1. identificar o Nucleus quando aplicavel;
2. carregar o Nucleus Blueprint e o Guide Blueprint quando a operacao envolver guia publico;
3. escolher o Cluster;
4. carregar o Cluster Blueprint;
5. carregar Calculator Blueprint e Article Blueprint como componentes quando necessario;
6. preencher identidade, dominio, nucleo, SEO e estrutura;
7. selecionar componentes compartilhados;
8. declarar campos, slots, links, CTA, produto e tracking;
9. preparar Testing;
10. preparar Validation;
11. preparar Publishing;
12. solicitar aprovacao;
13. somente em fase futura, gerar arquivos.

## Nucleus Blueprint

O Nucleus Blueprint fica em:

```text
data/blueprints/nucleus/index.json
```

Ele modela a organizacao estrategica de um nucleo futuro, incluindo `primaryDomain`, `primaryGuide`, relacoes com clusters, calculadoras, artigos, produtos elegiveis, governanca e growth.

Nesta fase, nenhum nucleo real e criado.

Ele usa o PAM como estrutura base para identity, relationships, lifecycle, governance, metadata e audit.

## Guide Blueprint

O Guide Blueprint fica em:

```text
data/blueprints/guide/index.json
```

Ele modela a pagina publica principal futura de um nucleo, incluindo estrutura visual, SEO, conteudo dinamico, ordenacao, destaques, Testing, Validation e Publishing.

Nesta fase, nenhuma pagina publica e criada.

Ele usa o PAM como estrutura base para identity, relationships, lifecycle, governance, metadata e audit.

## Cluster Blueprint

O Cluster Blueprint fica em:

```text
data/blueprints/cluster/index.json
```

Ele passa a ser a unidade estrutural principal do Blueprint System.

Calculator Blueprint e Article Blueprint continuam existindo e continuam validos, mas agora tambem sao componentes formais do Cluster Blueprint.

Nesta fase, nenhum cluster real e criado.

Ele deve usar o PAM como estrutura base antes de adicionar campos especificos de ecossistema de cluster.

## Como Gerar Calculadoras Futuramente

Uma futura Calculator Engine devera usar `calculator/index.json` como contrato de construcao.

O blueprint define identificacao, categoria, nucleo, slug, SEO, estrutura visual, componentes, campos, calculos, resultado, cards, FAQ, JSON-LD, links internos, ferramentas relacionadas, artigos relacionados, produto, CTA, tracking, Testing, Validation e Publishing.

Quando a calculadora fizer parte de um ecossistema maior, ela devera ser organizada pelo Cluster Blueprint.

Toda Calculator Blueprint deve preservar uma relacao principal unica, como `primaryDomain`, `primaryNucleus` e `primaryCluster`, separando relacoes secundarias em campos proprios.

Ela deve usar o PAM como estrutura base antes de adicionar campos especificos de calculo.

Nesta fase, nenhuma calculadora e gerada.

## Como Gerar Artigos Futuramente

Uma futura Content Engine devera usar `article/index.json` como contrato de construcao.

O blueprint define identificacao, categoria, nucleo, slug, SEO, estrutura, secoes, componentes, imagens, links internos, calculadoras relacionadas, produtos, CTA, FAQ, JSON-LD, Breadcrumb, schema, Testing, Validation e Publishing.

Quando o artigo fizer parte de um ecossistema maior, ele devera ser organizado pelo Cluster Blueprint.

Toda Article Blueprint deve preservar uma relacao principal unica, como `primaryNucleus`, `primaryCluster` e role `pillar` ou `satellite`, separando relacoes secundarias em campos proprios.

Ela deve usar o PAM como estrutura base antes de adicionar campos especificos de conteudo.

Nesta fase, nenhum artigo e gerado.

## Componentes Compartilhados

Componentes reutilizaveis ficam em:

```text
data/blueprints/shared/index.json
```

Componentes iniciais:

- Hero;
- FAQ;
- CTA;
- Offer Slot;
- Related Content;
- Calculator Card;
- Article Card;
- Disclaimer;
- Table;
- Section;
- Breadcrumb;
- Result Card;
- Info Card;
- Alert;
- Banner.

## Integracao Futura Com Testing

Blueprints declaram quais evidencias de Testing serao exigidas antes de qualquer geracao ou publicacao futura.

## Integracao Futura Com Validation

Blueprints declaram quais validacoes serao obrigatorias para garantir conformidade com SEO, estrutura, runtime safety, layout, links e padroes do projeto.

## Integracao Futura Com Offers

Blueprints preveem produto, CTA e Offer Slot sem implementar monetizacao nesta fase.

## Integracao Futura Com Automation

Automation futura podera consumir blueprints aprovados para criar planos de geracao, mas nao deve escrever arquivos sem Testing, Validation e Publishing gates.

## Integracao Futura Com Publishing

Publishing futura devera transformar blueprints aprovados em paginas ou dados publicaveis. Nesta fase, Publishing e apenas um requisito declarativo.

## Estado Atual

O Blueprint System esta em modo `foundation` e `not-consumed`.

Nenhum ativo e gerado nesta fase.
