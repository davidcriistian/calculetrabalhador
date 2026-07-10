# COMPATIBILITY_ENGINE

Status: camada declarativa de compatibilidade

Versao: 2.0.0

Criado em: 2026-07-09

## 1. Objetivo

A Compatibility Engine mapeia o relacionamento entre o Core Engine e a arquitetura atual do Calcule Trabalhador.

Ela existe para responder, de forma declarativa:

- quais dados atuais existem;
- onde eles estao hoje;
- quais dominios do Core eles correspondem;
- quais regras impactam ferramentas e artigos;
- quais itens podem ser avaliados para migracao futura;
- quais itens devem permanecer no runtime atual.

Esta fase nao implementa migracao, nao altera calculos e nao faz nenhuma pagina consumir `data/core/`.

## 2. Por Que Ela Existe

O Core Engine foi criado em paralelo ao runtime atual. Antes de qualquer integracao, a plataforma precisa de uma camada que explique a compatibilidade entre os dados novos e os dados ja usados em producao.

A Compatibility Engine funciona como um mapa tecnico de transicao. Ela reduz o risco de uma futura migracao trocar fonte de dados sem saber quais ferramentas, artigos, regras, tabelas e mapas seriam impactados.

## 3. Como Evita Quebra Do Runtime

Todos os arquivos da Compatibility Engine usam:

```text
coreStatus: not-connected
migrationStatus: future
```

Isso significa que os mapas sao apenas inventario e planejamento. O runtime oficial continua sendo:

```text
data/tabelas-trabalhistas.json
assets/js/tabelas-trabalhistas.js
```

Nenhum arquivo HTML, calculadora, artigo, sitemap, URL, SEO, script de runtime ou tabela atual deve depender destes mapas nesta fase.

## 4. Mapeamento Core Sistema Atual

O ponto de entrada da camada e:

```text
data/core/compatibility/index.json
```

Esse indice referencia:

```text
runtime-map.json
rules-map.json
tables-map.json
tools-map.json
articles-map.json
dependencies-map.json
migration-readiness.json
```

O mapeamento usa os dominios ja previstos pelo Core:

```text
clt
fgts
inss
mei
pj
irrf
beneficios
aposentadoria
shared
```

Quando uma relacao nao esta declarada diretamente nos arquivos atuais, ela e registrada como inferencia por slug, categoria, titulo, mapa existente ou dependencia ja catalogada.

## 5. Arquivos Da Compatibility Engine

### index.json

Ponto de entrada da camada. Lista todos os mapas e declara os arquivos protegidos que nao devem ser alterados por esta fase.

### runtime-map.json

Registra o runtime atual:

```text
data/tabelas-trabalhistas.json
assets/js/tabelas-trabalhistas.js
```

Ambos permanecem com:

```text
status: current-runtime
coreStatus: not-connected
migrationStatus: future
```

### rules-map.json

Mapeia `data/rules/`, identifica o dominio provavel no Core, status atual, tipo de regra, se esta em draft e se pode ser compativel futuramente.

### tables-map.json

Mapeia os grupos de `data/tabelas-trabalhistas.json` para dominios do Core, como INSS, FGTS, IRRF, beneficios, CLT, MEI, PJ e dados compartilhados.

### tools-map.json

Mapeia cada ferramenta de `data/tools.json`, incluindo slug, titulo, categoria, dependencias atuais, dominio principal, dominios secundarios, regras relacionadas e prontidao sugerida para migracao futura.

### articles-map.json

Mapeia cada artigo de `data/articles.json`, incluindo slug, titulo, categoria, cluster, ferramenta relacionada, dependencias, dominio principal, dominios secundarios, regras relacionadas e prontidao sugerida.

### dependencies-map.json

Relaciona:

```text
data/brain/dependencies.json
data/maps/update-map.json
data/maps/content-map.json
data/maps/tools-map.json
```

com os dominios provaveis do Core.

### migration-readiness.json

Classifica ferramentas e artigos para estudos futuros de migracao.

## 6. Arquivos Que Nao Podem Ser Alterados

Esta camada nao deve alterar:

```text
calculadoras
artigos
URLs
SEO
sitemap
layout
data/tabelas-trabalhistas.json
data/rules/
data/maps/
data/brain/
data/tools.json
data/articles.json
assets/js/tabelas-trabalhistas.js
```

## 7. Migration Readiness

Os niveis usados sao:

- `ready`: pode ser avaliado em piloto futuro apos validacao de equivalencia e fontes;
- `partial`: tem dependencias multiplas, alto risco ou precisa de modelagem adicional;
- `blocked`: depende de regra ausente ou contrato insuficiente;
- `legacy`: deve permanecer no runtime atual por decisao arquitetural;
- `unknown`: nao ha sinal suficiente para classificar.

Nenhum nivel autoriza migracao automatica.

## 8. Criterios Para Piloto Futuro

Uma ferramenta ou artigo so deve ser considerado para piloto na Fase 3 se:

- estiver marcado como `ready`;
- tiver dependencias pequenas e bem mapeadas;
- possuir regra correspondente no Core ou em `data/rules/`;
- tiver fonte atual identificada;
- puder ser validado contra o runtime atual;
- nao exigir alteracao de URL, SEO, layout ou sitemap;
- permitir rollback simples para o runtime atual.

Itens `partial` devem permanecer no runtime atual ate que os modelos Core equivalentes estejam completos.

## 9. Uso Na Fase 3

Na Fase 3, estes mapas poderao orientar a escolha de um piloto controlado.

A ordem recomendada e:

1. consultar `data/core/compatibility/index.json`;
2. verificar `migration-readiness.json`;
3. validar dependencias em `tools-map.json` ou `articles-map.json`;
4. conferir regras em `rules-map.json`;
5. comparar com `runtime-map.json` e `tables-map.json`;
6. executar validacao de equivalencia antes de qualquer consumo real do Core.

Enquanto essa validacao nao existir, a plataforma continua operando exclusivamente pelo runtime atual.
