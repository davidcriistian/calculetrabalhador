# Calcule Trabalhador - Arquitetura Oficial

Status: Em implementacao

Versao: V1

## 1. Visao Geral

Este documento define a arquitetura oficial do projeto Calcule Trabalhador. Ele deve ser usado como referencia principal por ChatGPT, Codex, desenvolvedores, auditorias, manutencoes anuais e futuras expansoes do projeto para CLT, MEI, PJ, simuladores e SaaS.

A arquitetura segue o fluxo:

```text
FONTES OFICIAIS
↓
RULES
↓
BRAIN
↓
TOOLS MAP / CONTENT MAP / UPDATE MAP
↓
CALCULADORAS / ARTIGOS
↓
SITEMAP
↓
USUARIO
```

O projeto deve evoluir de paginas e catalogos mantidos manualmente para uma estrutura governada por regras, mapas e validacoes.

## 2. Objetivo da Arquitetura

O objetivo da arquitetura e garantir que calculos, conteudos, catalogos e sitemap evoluam com seguranca, rastreabilidade e consistencia.

Ela deve permitir:

- Atualizar regras trabalhistas sem depender da memoria do operador.
- Identificar quais calculadoras e artigos sao afetados por uma mudanca.
- Validar alteracoes antes de publicar.
- Crescer o projeto sem perder controle sobre dependencias.
- Separar regra oficial, interpretacao, catalogo, pagina e sitemap.
- Reduzir risco de divergencia entre calculadoras, artigos e fontes oficiais.

## 3. Principios Fundamentais

### Fonte unica da verdade

Cada informacao critica deve ter uma fonte principal declarada. Regras oficiais devem viver em `data/rules/`. Catalogos de exibicao devem permanecer em `data/tools.json` e `data/articles.json`. Mapas de governanca devem viver em `data/maps/`.

### Separacao entre regras, mapas e paginas

Regras nao devem depender de HTML. Mapas nao devem executar calculos. Paginas nao devem ser a fonte primaria de regras oficiais.

### Validacao antes de alteracao

Toda mudanca relevante deve ser validada antes de ser publicada. Isso inclui JSON valido, sitemap coerente, IDs unicos, slugs unicos, dependencias declaradas e paginas existentes.

### Atualizacao segura

Nenhuma regra critica deve ser migrada ou substituida sem comparacao com o comportamento anterior, testes de regressao e revisao das fontes oficiais.

### Crescimento escalavel

A arquitetura deve permitir novas calculadoras, novos artigos, novas categorias, novos regimes de trabalho e novos produtos sem reorganizar o projeto a cada expansao.

### Nao depender da memoria do operador

O projeto deve registrar dependencias, clusters, regras usadas, frequencias de atualizacao e fontes oficiais em arquivos versionados.

## 4. Camadas da Arquitetura

### Fontes Oficiais

Sao as origens externas de verdade normativa ou operacional. Exemplos: Receita Federal, INSS, Ministerio do Trabalho e Emprego, Caixa Economica Federal, leis, portarias, tabelas oficiais e comunicados vigentes.

Fontes oficiais nao sao copiadas informalmente para paginas. Elas devem alimentar Rules com fonte, vigencia e data de revisao.

### Rules

Rules sao arquivos estruturados com regras oficiais, parametros, formulas, faixas, percentuais, tetos, pisos, vigencia e fonte.

Exemplos:

- `data/rules/inss.json`
- `data/rules/irrf.json`
- `data/rules/fgts.json`
- `data/rules/salario-minimo.json`
- `data/rules/seguro-desemprego.json`

Rules respondem: "qual e a regra oficial vigente?"

### Brain

Brain e a camada de interpretacao e governanca. Ele nao substitui Rules nem catalogos. Ele declara relacoes, dependencias, clusters e regras de validacao.

Brain responde:

- Quais regras afetam cada ferramenta?
- Quais paginas sao impactadas por uma mudanca?
- Quais clusters existem?
- Quais validacoes sao obrigatorias?

### Tools Map

Tools Map descreve as calculadoras sob perspectiva tecnica e de governanca.

Ele deve declarar, para cada ferramenta:

- ID
- slug
- categoria
- rules usadas
- dependencies
- artigos relacionados
- status de publicacao
- frequencia de atualizacao
- impacto no sitemap

### Content Map

Content Map descreve artigos e conteudos sob perspectiva editorial e de governanca.

Ele deve declarar, para cada artigo:

- ID
- slug
- cluster
- relatedTool
- links internos obrigatorios
- intencao editorial
- dependencias de regra
- frequencia de revisao
- impacto no sitemap

### Update Map

Update Map define manutencao periodica e impacto de mudancas.

Ele deve declarar:

- item atualizado
- frequencia
- fonte oficial
- regras afetadas
- ferramentas afetadas
- artigos afetados
- validacoes obrigatorias

### Calculadoras

Calculadoras sao interfaces de uso e execucao de calculo. Elas podem consumir regras centralizadas, mas nao devem ser a fonte principal da regra oficial.

Durante a migracao, calculadoras podem manter fallback local ate que a equivalencia com Rules seja validada.

### Artigos

Artigos sao conteudos editoriais. Eles explicam regras, orientam usuarios e conectam clusters. Artigos nao devem introduzir regras numericas sem fonte ou sem vinculo com Rules quando a regra existir.

### Sitemap

Sitemap e a lista publica de URLs indexaveis. Ele deve refletir ferramentas, artigos, paginas institucionais e paginas especiais publicadas.

No estado inicial, ele pode ser mantido manualmente. A meta e que ele seja validado contra catalogos e maps.

### Usuario

Usuario e a camada final. O usuario recebe calculadoras, artigos e navegacao coerente. Ele nao deve ser exposto a divergencias entre fonte oficial, calculadora, artigo e sitemap.

## 5. Responsabilidade de Cada Diretorio

### `data/rules/`

Guarda regras oficiais estruturadas. Cada arquivo deve conter versao, status, fonte, ano, vigencia quando aplicavel e dados da regra.

### `data/brain/`

Guarda inteligencia de governanca: dependencias, clusters e regras de validacao.

### `data/maps/`

Guarda mapas de ferramentas, conteudos e atualizacoes. E a ponte entre catalogos, regras, paginas e sitemap.

### `data/tools.json`

Catalogo de exibicao das ferramentas. Deve continuar simples e estavel para Home, listagens e paginas de ferramentas.

### `data/articles.json`

Catalogo de exibicao dos artigos. Deve continuar simples e estavel para blog, Home e componentes editoriais.

### `docs/`

Guarda documentacao oficial da arquitetura, processos, auditorias e planos de manutencao.

## 6. O Que Cada Camada Pode Fazer

Rules pode:

- Declarar dados oficiais.
- Registrar fonte, vigencia, ano e status.
- Servir como base para calculos.
- Ser versionada e auditada.

Brain pode:

- Declarar dependencias.
- Declarar clusters.
- Declarar validacoes.
- Identificar impacto de mudancas.

Maps podem:

- Conectar ferramentas, artigos, regras e sitemap.
- Registrar frequencia de atualizacao.
- Apoiar validacoes read-only.
- Definir contratos para novas paginas.

Catalogos podem:

- Alimentar listagens publicas.
- Controlar exibicao na Home.
- Manter metadados basicos de ferramentas e artigos.

Calculadoras podem:

- Executar simulacoes.
- Exibir resultados ao usuario.
- Usar Rules quando migradas.
- Manter fallback ate validacao completa.

Artigos podem:

- Explicar regras.
- Linkar ferramentas.
- Fortalecer clusters.
- Apoiar navegacao e SEO.

Sitemap pode:

- Listar URLs publicas.
- Informar prioridade, frequencia e `lastmod`.
- Ser validado contra catalogos e maps.

## 7. O Que Cada Camada NAO Pode Fazer

Rules nao pode:

- Depender de HTML.
- Conter texto editorial longo.
- Declarar clusters.
- Controlar exibicao na Home.

Brain nao pode:

- Inventar regra oficial.
- Substituir fonte oficial.
- Executar calculo final para o usuario.
- Ser usado como catalogo publico.

Maps nao podem:

- Duplicar formulas oficiais.
- Substituir `tools.json` ou `articles.json` na exibicao publica.
- Corrigir paginas automaticamente sem validacao.

Catalogos nao podem:

- Ser a unica fonte de dependencias.
- Armazenar regra oficial complexa.
- Substituir Rules, Brain ou Maps.

Calculadoras nao podem:

- Ser a unica fonte de regra oficial.
- Remover fallback sem teste.
- Alterar formula critica sem validacao.

Artigos nao podem:

- Publicar orientacao juridica sem fonte.
- Declarar numeros oficiais sem rastreabilidade.
- Ficar fora de cluster quando houver ferramenta relacionada.

Sitemap nao pode:

- Conter URLs sem pagina existente.
- Omitir ferramenta ou artigo publicado.
- Ser atualizado sem validacao.

## 8. Contrato para Novas Calculadoras

Toda nova calculadora deve declarar:

- Entrada em `data/tools.json`.
- Entrada em `data/maps/tools-map.json`.
- Dependencias em `data/brain/dependencies.json`.
- Rules usadas em `data/rules/`.
- Cluster relacionado em `data/brain/clusters.json`, quando aplicavel.
- Frequencia de atualizacao em `data/maps/update-map.json`.
- URL no `sitemap.xml`.
- Pagina HTML existente.
- Validacoes obrigatorias antes de publicacao.

Se a calculadora nao usar regra dinamica, isso deve ser declarado explicitamente no Tools Map.

## 9. Contrato para Novos Artigos

Todo novo artigo deve declarar:

- Entrada em `data/articles.json`.
- Entrada em `data/maps/content-map.json`.
- `relatedTool` valido, salvo excecao justificada.
- Cluster editorial.
- Links internos obrigatorios.
- Frequencia de revisao em `data/maps/update-map.json`.
- URL no `sitemap.xml`.
- Pagina HTML existente.
- Fontes oficiais quando tratar de regra juridica ou numerica.

Artigos de cluster devem linkar para a ferramenta principal e, quando fizer sentido, para artigos irmaos.

## 10. Fluxo de Atualizacao Anual

Exemplo para INSS:

```text
Fonte oficial atualiza INSS
↓
Rules e atualizado
↓
Brain identifica impacto
↓
Update Map lista paginas afetadas
↓
Calculadoras sao validadas
↓
Artigos sao revisados
↓
Sitemap e atualizado
```

Fluxo operacional recomendado:

1. Confirmar fonte oficial.
2. Atualizar Rule correspondente.
3. Rodar validacoes de JSON.
4. Identificar impacto via Brain e Update Map.
5. Validar calculadoras afetadas contra cenarios conhecidos.
6. Revisar artigos afetados.
7. Validar sitemap.
8. Rodar `git diff --check`.
9. Revisar `git status --short`.

## 11. Regras de Seguranca

- Nunca alterar calculo sem validacao.
- Nunca remover fallback sem teste.
- Nunca atualizar artigo juridico sem fonte.
- Nunca publicar sem `git diff --check`.
- Nunca publicar sem validar JSON.
- Nunca publicar sem validar sitemap.
- Nunca criar nova calculadora sem Tools Map.
- Nunca criar novo artigo sem Content Map.
- Nunca alterar regra oficial sem registrar fonte e vigencia.
- Nunca misturar migracao de calculadora com alteracao editorial ampla.
- Nunca usar memoria do operador como unica justificativa de mudanca.

## 12. Estado Atual

Estado conhecido na criacao desta documentacao:

- 11 calculadoras.
- 35 artigos.
- 57 URLs no sitemap.
- Estrutura base criada na Fase A.1.
- `data/maps/` criado, ainda nao populado.
- `data/brain/` criado, ainda em draft.
- `data/rules/` criado, ainda em draft.
- `tools.json` existente e estruturado.
- `articles.json` existente e estruturado.
- `data/tabelas-trabalhistas.json` ainda funciona como camada inicial de regras.
- Calculadoras ainda podem conter logica local e fallbacks.
- Reciprocidade calculadora -> artigos ainda nao e contrato obrigatorio implementado.

## 13. Roadmap de Implementacao

- Fase A.1: estrutura criada.
- Fase A.2: documentacao oficial da arquitetura.
- Fase A.3: popular `tools-map`.
- Fase A.4: popular `content-map`.
- Fase A.5: popular `update-map`.
- Fase A.6: popular Brain.
- Fase A.7: criar validacoes read-only.
- Fase B: migracao gradual das Rules.
- Fase C: conexao gradual das calculadoras.

Cada fase deve ser pequena, validavel e reversivel.

## 14. Glossario

### Rule

Arquivo estruturado que representa uma regra oficial, com fonte, vigencia, ano, status e dados aplicaveis.

### Brain

Camada de governanca que interpreta dependencias, clusters e validacoes. Nao e regra oficial e nao e catalogo publico.

### Map

Arquivo declarativo que conecta entidades do projeto, como ferramentas, artigos, regras, atualizacoes e sitemap.

### Cluster

Grupo tematico formado por uma ferramenta principal e seus artigos relacionados.

### Dependency

Relacao em que uma ferramenta, artigo ou regra depende de outra informacao para permanecer correto.

### Source of Truth

Fonte primaria de uma informacao. Para regra oficial, deve ser uma fonte oficial registrada em Rules.

### Fallback

Logica ou dado alternativo mantido temporariamente para preservar comportamento enquanto uma migracao e validada.

### Validation

Processo de checar consistencia antes de alterar ou publicar. Inclui JSON valido, sitemap coerente, IDs unicos, slugs unicos, dependencias declaradas e ausencia de erros em `git diff --check`.
