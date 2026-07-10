# Reference System

## Objetivo

O Reference System registra os ativos reais aprovados como referencia oficial da plataforma Calcule Trabalhador.

Ele nao define padroes. Quem define padroes e o Gold Standard System.

O Reference System aponta quais implementacoes reais representam a melhor implementacao conhecida desses padroes.

## Filosofia

Gold Standard define o ideal.

Reference System aponta o melhor exemplo real aprovado.

Uma referencia pode mudar futuramente sem alterar o Gold Standard.

Isso permite evoluir a plataforma sem confundir padrao com implementacao.

## Responsabilidades

O Reference System deve:

- registrar metadados de ativos reais aprovados;
- apontar para URLs oficiais;
- declarar tipo, slug, status, owner e versao;
- vincular a referencia ao Gold Standard correspondente;
- registrar criterios aprovados;
- registrar data de aprovacao;
- permitir substituicao futura por `supersedes` e `supersededBy`.

O Reference System nao deve:

- definir padroes;
- copiar HTML;
- copiar conteudo;
- importar paginas;
- criar calculadoras;
- criar artigos;
- modificar runtime;
- modificar SEO;
- modificar URLs;
- modificar sitemap;
- executar validacao;
- executar publicacao.

## Estrutura

```text
data/references/
  registry/
  calculators/
  articles/
  clusters/
  guides/
  components/
  metadata/
  history/
  versioning/
  schemas/
  contracts/
  docs/
```

O ponto de entrada e:

```text
data/references/registry/index.json
```

## Diferenca Entre Gold Standard e Reference System

Gold Standard:

- define o padrao;
- e versionado por qualidade;
- descreve estrutura ideal;
- nao aponta necessariamente para ativo real;
- evolui quando UX, SEO e qualidade evoluem.

Reference System:

- aponta implementacoes reais aprovadas;
- registra URLs e metadados;
- mostra o melhor exemplo conhecido;
- pode trocar uma referencia sem mudar o padrao;
- ajuda o Codex, Blueprint, Validation, Publishing e Admin a entender exemplos reais aprovados.

## Diferenca Entre Reference System e Blueprint

Blueprint define como construir um ativo futuro.

Reference System aponta um ativo real aprovado que pode inspirar decisoes de implementacao sem copiar conteudo.

Um futuro Blueprint pode consultar:

```text
Gold Standard -> qual padrao cumprir
Reference System -> qual implementacao aprovada observar
```

## Diferenca Entre Reference System e Validation

Validation mede conformidade.

Reference System informa quais ativos reais ja foram aprovados como referencia.

Futuramente, Validation podera usar referencias para comparar estrutura, navegacao, componentes e posicionamento de CTA.

## Diferenca Entre Reference System e Publishing

Publishing controla aprovacao, publicacao, rollback, sitemap e canonical.

Reference System nao publica nada. Ele apenas pode ajudar Publishing a identificar referencias aprovadas e assets que seguem um padrao conhecido.

## Referencias Oficiais Iniciais

### Calculadora

```text
https://calculetrabalhador.com.br/calculadora-multa-40-fgts/
```

Status:

```text
official-reference
```

Descricao:

```text
Implementacao oficial aprovada do Calculator Gold Standard v1.
```

### Artigos

```text
https://calculetrabalhador.com.br/blog/clt-ou-pj-vale-a-pena-em-2026/
https://calculetrabalhador.com.br/blog/como-calcular-clt-ou-pj/
https://calculetrabalhador.com.br/blog/vantagens-e-desvantagens-clt-ou-pj/
```

Status:

```text
official-reference
```

Descricao:

```text
Implementacoes oficiais aprovadas do Article Gold Standard v1.
```

## Criterios de Referencia

Os criterios oficiais modelados incluem:

- approved-layout;
- approved-ux;
- approved-seo;
- approved-structure;
- approved-navigation;
- approved-components;
- approved-jsonld;
- approved-accessibility;
- approved-conversion;
- approved-cluster-structure;
- approved-internal-links;
- approved-cta-placement.

## Posicionamento de CTA em Artigos

Para os artigos oficiais, fica registrado declarativamente:

```text
CTA da calculadora: inicio, meio e final
```

Esse passa a ser o posicionamento oficial esperado para futuros artigos.

Nenhum artigo existente foi alterado para registrar isso.

## Como Ajuda Blueprints

Blueprints futuros poderao consultar referencias para entender a melhor implementacao real aprovada.

O Blueprint continua seguindo o Gold Standard. A referencia ajuda a reduzir ambiguidade de implementacao.

## Como Ajuda Validation

Validation futura podera verificar se um novo ativo esta alinhado com:

- Gold Standard declarado;
- criterios de referencia;
- posicionamento de CTA aprovado;
- estrutura aprovada;
- componentes aprovados.

## Como Ajuda Publishing

Publishing futura podera exigir que um ativo esteja alinhado com uma referencia oficial antes de publicacao ou aprovar excecoes manualmente.

## Como Ajuda Automation

Automation futura podera carregar referencias para evitar redescobrir o padrao real de implementacao.

Fluxo futuro:

```text
Manifest -> Gold Standard -> Reference System -> Blueprint -> Validation -> Publishing
```

## Como Ajuda o Painel Administrativo

Um futuro Admin podera mostrar:

- ativos oficiais de referencia;
- Gold Standard correspondente;
- data de aprovacao;
- criterios aprovados;
- referencias substituidas;
- referencias ativas por tipo.

## Troca de Referencias Futuras

Uma referencia pode ser substituida sem alterar o Gold Standard.

Exemplo:

```text
Reference A -> supersededBy -> Reference B
Reference B -> supersedes -> Reference A
```

Isso preserva historico e permite evolucao controlada.

## Limites Desta Fase

Esta fase nao:

- copia HTML;
- copia conteudo;
- importa paginas;
- altera calculadoras;
- altera artigos;
- altera runtime;
- altera SEO;
- altera URL;
- altera sitemap;
- cria integracao operacional;
- cria consumo por runtime.

Ela registra somente metadados e referencias.
