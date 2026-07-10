# Cluster Blueprint System

## Objetivo

O Cluster Blueprint System define o Cluster como a unidade estrutural principal da plataforma Calcule Trabalhador.

A partir desta camada declarativa:

- toda calculadora futura deve pertencer a um Cluster;
- todo artigo futuro deve pertencer a um Cluster;
- Calculator Blueprint passa a ser componente do Cluster Blueprint;
- Article Blueprint passa a ser componente do Cluster Blueprint;
- ofertas, CTAs, produtos, publicacao, testing e validation passam a ser planejados no contexto do Cluster.

Esta fase nao cria clusters reais, calculadoras, artigos, paginas, produtos ou automacao.

## Arquitetura

```text
Cluster Blueprint
  -> identidade do cluster
  -> ativos do cluster
    -> calculadora principal
    -> artigo pilar
    -> artigos satelites
    -> guias
    -> FAQ
    -> glossario
    -> ferramentas relacionadas
    -> downloads
  -> SEO
  -> monetizacao
  -> publicacao
  -> testing
  -> validation
  -> relacionamentos
```

O Cluster Blueprint fica em:

```text
data/blueprints/cluster/index.json
```

## Identidade

O Cluster Blueprint modela:

- `clusterId`;
- nome;
- slug;
- nucleo;
- dominio;
- categoria;
- status;
- owner;
- version.

Esses campos identificam o Cluster como unidade de planejamento. Eles nao criam rotas, paginas ou ativos publicados nesta fase.

## Ativos do Cluster

O Cluster pode organizar:

- calculadora principal;
- artigo pilar;
- artigos satelites;
- guias;
- FAQ;
- glossario;
- ferramentas relacionadas;
- downloads.

A calculadora principal referencia o Calculator Blueprint. O artigo pilar e os artigos satelites referenciam o Article Blueprint.

## SEO

O modelo de SEO do Cluster inclui:

- cluster title;
- cluster description;
- keywords;
- canonical;
- breadcrumb;
- schema;
- JSON-LD;
- internal linking;
- related clusters.

O SEO do Cluster coordena a estrategia entre calculadora e artigos, evitando que cada ativo decida isolamento, links e estrutura por conta propria.

## Publicacao

O Cluster Blueprint modela a publicacao como plano declarativo:

- ordem de publicacao;
- dependencias;
- pre-condicoes;
- status;
- versionamento;
- rollback.

Nada e publicado nesta fase. O modelo apenas prepara uma futura Publishing Engine ou Publishing Model para operar com seguranca.

## Monetizacao

O Cluster Blueprint modela monetizacao por slots:

- Offer Slots;
- CTA Slots;
- Product Slots;
- prioridade;
- fallback.

Produtos reais nao sao cadastrados aqui. O Cluster Blueprint apenas reserva a estrutura para que um futuro Product Catalog ou Offers Engine possa preencher os slots por configuracao.

## Testing

Testing no Cluster Blueprint cobre:

- equivalencia;
- regressao;
- SEO;
- estrutura;
- links.

O Cluster nao executa testes. Ele apenas declara quais evidencias e gates serao esperados.

## Validation

Validation no Cluster Blueprint cobre:

- qualidade;
- SEO;
- JSON-LD;
- acessibilidade;
- componentes;
- estrutura.

O Cluster nao valida nada nesta fase. Ele apenas referencia a Validation Engine como gate futuro.

## Relacao com Strategy

Strategy define o motivo do Cluster existir:

- objetivo editorial;
- prioridade;
- publico;
- oportunidade de busca;
- monetizacao;
- relacionamento com nucleos e dominios.

Cluster Blueprint define como esse Cluster sera estruturado em ativos.

Strategy responde "por que e para quem". Cluster Blueprint responde "como organizar".

## Relacao com Constitution

Constitution define os principios permanentes.

Cluster Blueprint deve respeitar:

- configuracao acima de codigo;
- fonte unica da verdade;
- baixo acoplamento;
- alta coesao;
- seguranca;
- repetibilidade;
- baixo consumo de creditos.

## Relacao com Core

Core continua sendo a fonte de conhecimento.

Cluster Blueprint pode referenciar dominios, regras, tabelas e conceitos do Core, mas nao deve conter conhecimento legal como fonte primaria.

Se uma calculadora ou artigo depende de regra trabalhista, essa regra deve vir do Core.

## Relacao com POS

POS governa operacoes, gates, migration, testing e validation.

Cluster Blueprint referencia POS como camada de governanca, mas nao substitui POS Registry, Migration Engine, Testing Engine ou Validation Engine.

## Relacao com Manifest System

Manifest System define o contexto minimo para uma operacao futura.

Operacoes como `create-cluster`, `create-calculator`, `create-article` e `expand-cluster` podem apontar para Cluster Blueprint como componente logico essencial.

Manifest diz o que ler. Cluster Blueprint diz como o ecossistema do Cluster deve ser estruturado.

## Relacao com Operation System

Operation System define playbooks, workflows, pipelines e relatorios.

Cluster Blueprint e usado pelos playbooks como modelo declarativo de organizacao.

O playbook orienta a execucao futura. O blueprint define a estrutura esperada.

## Relacao com Calculator Blueprint

Calculator Blueprint continua existindo e continua valido como modelo proprio.

A mudanca desta fase e que ele tambem passa a ter papel formal de componente dentro do Cluster Blueprint.

Na pratica futura:

```text
Cluster Blueprint -> Primary Calculator -> Calculator Blueprint
```

## Relacao com Article Blueprint

Article Blueprint continua existindo e continua valido como modelo proprio.

A mudanca desta fase e que ele tambem passa a ter papel formal de componente dentro do Cluster Blueprint.

Na pratica futura:

```text
Cluster Blueprint -> Pillar/Satellite Articles -> Article Blueprint
```

## Como reduz creditos

Antes, criar ou expandir um conjunto de ativos exigiria pensar separadamente:

- calculadora;
- artigo pilar;
- artigos satelites;
- links internos;
- FAQ;
- SEO;
- CTA;
- produto;
- testing;
- validation;
- publicacao.

Com Cluster Blueprint, o Codex podera consultar um unico modelo de organizacao e seguir componentes oficiais. Isso reduz leitura, inferencia e repeticao.

## Como melhora repetibilidade

Clusters futuros passam a seguir o mesmo esqueleto:

```text
identidade -> ativos -> SEO -> monetizacao -> publicacao -> testing -> validation -> relatorio
```

Isso permite criar varios clusters com padrao consistente sem reinventar a estrutura.

## Limites desta fase

Esta fase nao:

- cria clusters reais;
- cria calculadoras;
- cria artigos;
- gera paginas;
- publica conteudo;
- cadastra produtos reais;
- altera runtime;
- altera SEO de producao;
- altera URLs;
- altera sitemap;
- executa automacao.

Ela apenas cria o modelo oficial de Cluster Blueprint.
