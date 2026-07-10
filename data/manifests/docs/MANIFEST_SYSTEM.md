# Operational Manifest System

## Objetivo

O Operational Manifest System e a porta de entrada oficial para futuras operacoes do Calcule Trabalhador.

Sua funcao e reduzir o contexto necessario para executar uma tarefa, definindo previamente:

- quais camadas consultar;
- quais componentes logicos ler;
- quais blueprints utilizar;
- quais playbooks seguir;
- quais testes considerar;
- quais validacoes aplicar;
- quais restricoes respeitar;
- quais superficies nunca alterar durante aquela operacao.

Esta fase cria apenas a fundacao declarativa. Ela nao executa automacao, nao cria calculadoras, nao cria artigos, nao publica conteudo e nao altera producao.

## Filosofia

Antes desta camada, uma operacao podia exigir leitura ampla de Constitution, Strategy, Core, POS, Blueprint System, Operation System, Testing, Validation e documentos relacionados.

Com manifestos operacionais, cada tarefa futura deve comecar por um manifesto pequeno. O manifesto informa o menor conjunto de contexto necessario para agir com seguranca.

Principios:

- manifest first;
- contexto minimo;
- componentes logicos em vez de listas gigantes de arquivos;
- configuracao acima de codigo;
- restricoes explicitas;
- relatorio obrigatorio;
- baixa repeticao de decisoes;
- baixo consumo de creditos.

## Estrutura

```text
data/manifests/
  registry/
  operations/
  contexts/
  dependencies/
  restrictions/
  schemas/
  contracts/
  metadata/
  history/
  versioning/
  docs/
```

## Registry

`data/manifests/registry/index.json` e o ponto de entrada da camada.

Ele aponta para:

- catalogo de operacoes;
- contextos minimos;
- mapa de dependencias;
- restricoes oficiais;
- schemas;
- contratos;
- metadados;
- historico;
- versionamento;
- documentacao.

O Registry de Manifests complementa o POS Registry. Ele nao substitui o POS, nao alimenta runtime e nao executa nenhuma operacao.

## Operations

`data/manifests/operations/index.json` contem os manifestos oficiais para operacoes futuras.

Cada manifesto define:

- `operationId`;
- objetivo;
- descricao;
- pre-condicoes;
- camadas obrigatorias;
- arquivos ou componentes logicos obrigatorios;
- componentes opcionais;
- blueprints necessarios;
- playbooks necessarios;
- testing necessario;
- validation necessaria;
- restricoes;
- arquivos ou superficies bloqueadas;
- dependencias;
- resultado esperado;
- relatorio esperado.

Os manifestos nao devem conter inventarios fisicos extensos. Eles devem apontar para componentes logicos, como `Calculator Blueprint`, `Core Domain`, `Strategy Cluster`, `Testing Engine` ou `Publishing Model`.

## Contexts

`data/manifests/contexts/index.json` define o contexto minimo por operacao.

O objetivo e impedir que uma tarefa simples exija leitura de toda a plataforma.

Um agente futuro deve:

1. identificar o `operationId`;
2. carregar o manifesto correspondente;
3. carregar apenas o contexto minimo;
4. expandir contexto somente se houver bloqueio tecnico;
5. registrar qualquer expansao no relatorio final.

## Dependencies

`data/manifests/dependencies/index.json` modela dependencias logicas entre operacoes e componentes.

Exemplo conceitual:

```text
create-calculator
  requires Calculator Blueprint
  requires Core Domain
  requires Testing Engine
  requires Validation Engine
```

Esse mapa nao executa nada. Ele apenas evita que uma operacao futura ignore dependencias essenciais.

## Restrictions

`data/manifests/restrictions/index.json` contem restricoes oficiais.

Exemplos:

- nunca alterar Constitution durante operacoes comuns;
- nunca alterar runtime diretamente;
- nunca alterar Core durante criacao de artigo ou calculadora;
- nunca alterar Strategy durante Publishing;
- validacoes sao read-only por padrao;
- migracoes exigem rollback pronto;
- publicacoes exigem aprovacao.

As restricoes sao declarativas nesta fase. Futuras Engines devem trata-las como gates.

## Relacao com Constitution

Constitution define principios permanentes.

O Manifest System consulta esses principios como limite superior de qualquer operacao futura. Nenhum manifesto deve contrariar Constitution.

## Relacao com Strategy

Strategy define direcao editorial, clusters, produtos, CTAs, monetizacao e prioridades.

Manifests apontam para componentes logicos de Strategy quando uma operacao depende de decisao estrategica, como criar artigo, expandir cluster ou alterar CTA.

## Relacao com Core

Core e a fonte de conhecimento juridico e tecnico.

Manifests apontam para Core quando uma operacao depende de regra, tabela, lei, dominio ou fonte oficial.

Criacao de artigo ou calculadora nao deve alterar Core. Alteracoes de Core devem ocorrer por operacoes especificas, como `update-law` ou `update-table`.

## Relacao com POS

POS continua sendo a camada de governanca operacional, Registry, Migration, Testing e Validation.

O Manifest System nao substitui POS. Ele reduz o contexto necessario para acionar partes do POS em futuras operacoes.

## Relacao com Blueprint System

Blueprint System define como ativos devem ser construidos.

Manifests indicam qual blueprint usar em cada operacao, por exemplo:

- Calculator Blueprint;
- Article Blueprint;
- Cluster Blueprint;
- Shared Components;
- CTA Component;
- Offer Slot.

Os manifestos nao geram ativos. Eles apenas indicam quais modelos consultar.

## Relacao com Operation System

Operation System define playbooks, workflows, pipelines, checklists e relatorios.

Manifests indicam qual playbook seguir. O playbook descreve como executar; o manifesto diz qual contexto minimo carregar antes da execucao.

## Como reduz contexto

Cada manifesto substitui a leitura ampla por uma leitura direcionada.

Sem manifesto:

```text
ler muitas camadas + interpretar responsabilidades + decidir gates + decidir restricoes
```

Com manifesto:

```text
operationId -> manifesto -> contexto minimo -> playbook -> gates -> relatorio
```

## Como reduz consumo de creditos

O sistema reduz creditos porque:

- evita leitura repetida de documentos grandes;
- evita redescobrir dependencias;
- evita reexplicar restricoes;
- evita consultar camadas irrelevantes;
- reduz ambiguidade antes da execucao;
- padroniza relatorios;
- permite que futuras operacoes comecem pelo mesmo roteiro.

## Como melhora repetibilidade

Operacoes do mesmo tipo passam a ter:

- mesmo ponto de entrada;
- mesmo contexto minimo;
- mesmas restricoes;
- mesmas dependencias;
- mesmos gates;
- mesmo formato de relatorio.

Isso reduz variacao entre execucoes e facilita auditoria futura.

## Como melhora automacao

Futuras automacoes poderao:

1. receber um `operationId`;
2. buscar o manifesto;
3. carregar contexto minimo;
4. verificar restricoes;
5. seguir playbook;
6. executar testes;
7. executar validacoes;
8. gerar relatorio.

Nesta fase, essa automacao nao existe. A camada apenas prepara o contrato oficial.

## Operacoes cobertas

Os manifestos iniciais cobrem:

- create-calculator;
- create-cluster;
- create-article;
- update-calculator;
- update-article;
- update-law;
- update-table;
- validate-calculator;
- validate-article;
- publish;
- rollback;
- migrate-calculator;
- migrate-article;
- change-product;
- change-cta;
- change-campaign;
- expand-cluster.

## Limites desta fase

Esta fase nao:

- cria automacao;
- cria calculadoras;
- cria artigos;
- executa migracoes;
- publica conteudo;
- altera runtime;
- altera SEO;
- altera URLs;
- altera sitemap;
- altera Core;
- altera POS;
- altera Blueprint System;
- altera Operation System;
- altera Strategy;
- altera Constitution.

## Roadmap futuro

1. Criar manifests particionados por operacao quando o catalogo crescer.
2. Criar `Cluster Blueprint` formal caso ainda nao exista como componente proprio.
3. Criar Publishing Model antes de operacoes reais de publicacao.
4. Criar Offers/Product Model antes de campanhas reais.
5. Conectar futuras Engines aos manifestos como gates, sem consumo pelo runtime.
6. Registrar relatorios padronizados por operacao.
7. Criar verificacao automatica de manifestos quando a camada entrar em operacao.
