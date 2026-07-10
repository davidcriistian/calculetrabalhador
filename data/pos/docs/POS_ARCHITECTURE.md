# Project Operating System Architecture

## Objetivo

O Project Operating System, ou POS, sera a camada de organizacao operacional da plataforma Calcule Trabalhador.

Na Fase 1, o POS cria apenas o Registry Engine: um indice declarativo para registrar, classificar e relacionar referencias operacionais da plataforma. Ele nao executa calculos, nao publica conteudo, nao altera paginas e nao alimenta nenhum runtime.

As fronteiras oficiais entre camadas estao em `/docs/PLATFORM_ARCHITECTURE.md`. Este documento detalha apenas a camada POS e nao redefine a autoridade geral da plataforma.

## Filosofia

O POS nasce como uma fundacao separada do funcionamento atual do site.

Seus principios sao:

- configuracao acima de codigo;
- registrar antes de automatizar;
- documentar limites antes de criar engines;
- manter compatibilidade total com o runtime existente;
- preservar calculadoras, artigos, URLs, SEO, sitemap, layout, HTML, CSS e JavaScript;
- tratar cada ativo como uma entidade versionavel, auditavel e relacionavel.

## Fronteira Core Vs POS

A fronteira oficial e:

```text
Core = conhecimento
POS = operacao
```

O Core responde por leis, regras, tabelas, conceitos, fontes, historico e dominios.

O POS responde por criacao, migracao, testes, validacao, produtos, campanhas, automacao e administracao.

O POS nunca deve ser fonte de conhecimento juridico ou trabalhista. Ele apenas consome referencias aprovadas do Core em processos operacionais.

Contratos duplicados entre Core e POS devem ser interpretados assim:

- Core contracts = capacidades de conhecimento;
- POS contracts = processos operacionais.

O contrato `knowledge` do POS representa apenas processo operacional de consulta ao Core, nao armazenamento de conhecimento.

## Responsabilidades

O Registry Engine e responsavel por organizar estruturas para:

- calculadoras;
- artigos;
- dominios;
- nucleos;
- blueprints;
- produtos;
- campanhas;
- engines;
- versoes;
- status;
- dependencias;
- relacionamentos.

No POS Registry, esses registros representam descoberta e governanca operacional: status, gates, aprovacoes, processos, migracoes, testes, validacoes e referencias para engines operacionais.

O POS Registry nao e catalogo mestre de ativos da plataforma. A descoberta particionada de calculadoras, artigos, clusters, nucleos, dominios e futuros produtos pertence ao Registry System em `/data/registry/`.

Na Fase 1, essas listas ficam vazias por desenho. O objetivo e criar a forma oficial de registro, nao alimentar dados automaticamente.

O POS Registry nao deve ser preenchido manualmente em escala. Em fases futuras, ele devera ser alimentado por processos aprovados das Engines Calculator, Content, Offers, Automation e Migration.

O Registry e ponto de descoberta operacional, nao fonte de conhecimento.

## Nao Responsabilidades

O POS nao e responsavel por:

- executar engines;
- calcular valores;
- renderizar paginas;
- publicar artigos;
- alterar regras existentes;
- substituir o Core;
- substituir Compatibility, Legislation, Update ou Shadow;
- modificar SEO, sitemap ou URLs;
- consumir ou alterar arquivos usados em producao.

## Fluxo

O fluxo previsto para fases futuras e:

1. Um ativo e identificado.
2. O ativo recebe um registro declarativo no Registry.
3. O registro aponta seus dominios, status, versoes, dependencias e relacionamentos.
4. Contratos definem quais responsabilidades futuras podem operar sobre o ativo.
5. Validacoes futuras conferem integridade sem alterar o runtime automaticamente.
6. Somente fases posteriores, com aprovacao explicita, poderao criar engines operacionais.

Na Fase 1, o fluxo termina no passo declarativo.

## Dependencias

O ponto de entrada do POS e:

- `/data/pos/registry/index.json`

Arquivos auxiliares:

- `/data/pos/schemas/index.json`
- `/data/pos/contracts/index.json`
- `/data/pos/metadata/pos.json`
- `/data/pos/history/index.json`
- `/data/pos/versioning/index.json`
- `/data/pos/migration/index.json`
- `/data/pos/testing/index.json`
- `/data/pos/validation/index.json`

Esses arquivos dependem apenas entre si como documentacao estruturada. Eles nao sao importados por calculadoras, artigos, runtime ou scripts operacionais.

## Migration Engine

A Fase 2 adiciona a Migration Engine em `/data/pos/migration/`.

Ela e o protocolo oficial para futuras migracoes de calculadoras e, depois, artigos. A Migration Engine define tipos, fases, riscos, gates, templates de plano, templates de lote, relatorio e rollback.

Ela nao executa migracoes, nao altera calculadoras publicadas e nao cria consumo operacional. Seu papel e reduzir improviso em migracoes futuras, deixando um roteiro padrao para o Codex preencher e seguir quando uma fase futura autorizar execucao.

## Testing Engine

A Fase 3 adiciona a Testing Engine em `/data/pos/testing/`.

Ela e a autoridade declarativa de testes da plataforma. A Testing Engine define tipos de testes, status, baseline, equivalencia, regressao, performance, suites, relatorios e matriz de aprovacao.

Ela nao executa testes reais, nao corrige falhas e nao altera nenhum arquivo operacional. Seu papel e padronizar como futuras migracoes, validacoes, atualizacoes e automacoes deverao provar que continuam seguras.

## Shadow Como Bridge Layer

Shadow e oficialmente uma Bridge Layer entre:

```text
Core <-> POS Testing
```

Ele existe para produzir evidencia tecnica de comparacao e equivalencia. Shadow nao e conhecimento puro, nao e runtime e nao altera producao.

## Validation Engine

A Fase 4 adiciona a Validation Engine em `/data/pos/validation/`.

Ela e a autoridade declarativa de conformidade da plataforma. A Validation Engine define tipos de validacao, status, severidade, evidencias aceitas, checklist oficial, regras de conformidade, relatorio e aprovacao.

Ela nao executa validacoes reais, nao corrige problemas e nao altera nenhum arquivo operacional. Seu papel e verificar, em fases futuras, se qualquer componente continua obedecendo aos padroes arquiteturais, visuais, tecnicos e de SEO do Calcule Trabalhador.

## Contratos

Os contratos definem limites para futuras responsabilidades:

- Migration;
- Testing;
- Validation;
- Knowledge;
- Calculator;
- Content;
- Offers;
- Automation;
- Admin.

Cada contrato descreve objetivo, escopo, entradas esperadas, saidas esperadas, dependencias e nao responsabilidades. Eles funcionam como interfaces de governanca para futuras engines, mas nao implementam engines.

## Boas Praticas

Para evoluir o POS:

- manter o POS Registry como fonte de descoberta e governanca operacional;
- manter o Registry System em `/data/registry/` como indice particionado de ativos;
- registrar ativos com identificadores estaveis;
- separar metadados de execucao operacional;
- controlar funcionalidade recorrente por configuracao antes de codigo;
- versionar mudancas de estrutura;
- documentar dependencias antes de automatizar;
- criar engines apenas em fases futuras e explicitas;
- validar JSON antes de integrar qualquer consumidor;
- preservar compatibilidade com o site existente.

## Roadmap

### Fase 1 - Registry Engine

Criar estrutura, schemas, contratos, metadados, historico, versionamento e documentacao. Nenhum consumo operacional.

### Fase 2 - Migration Engine

Definir protocolo oficial de migracao, gates de aprovacao, rollback, relatorio e modelo de migracao em lote. Nenhum consumo operacional.

### Fase 3 - Testing Engine

Definir autoridade oficial de testes, baseline, equivalencia, regressao, performance, suites, relatorios e matriz de aprovacao. Nenhum teste real executado.

### Fase 4 - Validation Engine

Definir autoridade oficial de conformidade, checklist, regras, severidade, evidencia, relatorios e aprovacao. Nenhuma validacao real executada.

### Fase 5 - Population Governance

Definir criterios para alimentar o Registry manualmente ou por processos controlados.

### Fase 6 - Validation Layer

Criar validacoes de integridade para registros, contratos, dependencias e relacionamentos.

### Fase 7 - Operational Adapters

Projetar adaptadores de leitura, ainda sem alterar runtime existente.

### Fase 8 - Engine Activation

Somente com aprovacao explicita, implementar engines operacionais que consumam o POS.

## Estado Atual

O POS esta em modo `foundation` e `not-consumed`.

Nenhuma funcionalidade existente deve depender do POS nesta fase.

Os catalogos publicos atuais continuam sendo `data/tools.json` e `data/articles.json` ate futura migracao aprovada. O POS Registry nao substitui esses catalogos e nao cria consumo operacional.
