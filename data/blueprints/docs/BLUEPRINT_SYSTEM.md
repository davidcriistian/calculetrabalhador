# Blueprint System

## Objetivo

O Blueprint System define, de forma declarativa, como qualquer ativo futuro do Calcule Trabalhador devera ser construido.

Nesta fase, ele nao gera calculadoras, nao gera artigos, nao altera paginas existentes e nao executa automacao.

## Filosofia

O Blueprint System segue o principio de configuracao acima de codigo.

Ele transforma padroes recorrentes em modelos declarativos para que futuras fases possam criar ativos com menos improviso, menor consumo de creditos e mais consistencia.

## Estrutura

```text
data/blueprints/
  registry/
  cluster/
  calculator/
  article/
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
data/blueprints/registry/index.json
```

## Fluxo

Fluxo futuro previsto:

1. escolher o Cluster;
2. carregar o Cluster Blueprint;
3. carregar Calculator Blueprint e Article Blueprint como componentes quando necessario;
4. preencher identidade, dominio, nucleo, SEO e estrutura;
5. selecionar componentes compartilhados;
6. declarar campos, slots, links, CTA, produto e tracking;
7. preparar Testing;
8. preparar Validation;
9. preparar Publishing;
10. solicitar aprovacao;
11. somente em fase futura, gerar arquivos.

## Cluster Blueprint

O Cluster Blueprint fica em:

```text
data/blueprints/cluster/index.json
```

Ele passa a ser a unidade estrutural principal do Blueprint System.

Calculator Blueprint e Article Blueprint continuam existindo e continuam validos, mas agora tambem sao componentes formais do Cluster Blueprint.

Nesta fase, nenhum cluster real e criado.

## Como Gerar Calculadoras Futuramente

Uma futura Calculator Engine devera usar `calculator/index.json` como contrato de construcao.

O blueprint define identificacao, categoria, nucleo, slug, SEO, estrutura visual, componentes, campos, calculos, resultado, cards, FAQ, JSON-LD, links internos, ferramentas relacionadas, artigos relacionados, produto, CTA, tracking, Testing, Validation e Publishing.

Quando a calculadora fizer parte de um ecossistema maior, ela devera ser organizada pelo Cluster Blueprint.

Nesta fase, nenhuma calculadora e gerada.

## Como Gerar Artigos Futuramente

Uma futura Content Engine devera usar `article/index.json` como contrato de construcao.

O blueprint define identificacao, categoria, nucleo, slug, SEO, estrutura, secoes, componentes, imagens, links internos, calculadoras relacionadas, produtos, CTA, FAQ, JSON-LD, Breadcrumb, schema, Testing, Validation e Publishing.

Quando o artigo fizer parte de um ecossistema maior, ele devera ser organizado pelo Cluster Blueprint.

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
