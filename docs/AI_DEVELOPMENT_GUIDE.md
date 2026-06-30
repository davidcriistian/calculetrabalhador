# AI_DEVELOPMENT_GUIDE

Documento mestre de orientacao para qualquer IA ou desenvolvedor trabalhar no projeto Calcule Trabalhador.

Este guia e o ponto de entrada obrigatorio antes de qualquer alteracao no projeto. Ele explica como o projeto funciona, quais documentos consultar, qual fluxo seguir, o que pode ou nao pode ser alterado, como criar artigos, como criar ferramentas, como integrar catalogos, como validar, como fazer commit/push e como lidar com atualizacoes anuais.

## 1. Regra Principal

Antes de editar qualquer arquivo, leia o escopo do pedido e confirme quais superficies estao autorizadas.

O projeto Calcule Trabalhador e governado por regras, mapas, catalogos, validacoes e documentos oficiais. Nenhuma IA deve improvisar uma arquitetura paralela, criar valores soltos ou alterar arquivos fora do escopo aprovado.

Se o pedido disser "nao alterar" alguma area, essa restricao prevalece mesmo que a alteracao pareca util.

## 2. Documentos Obrigatorios

Antes de atuar no projeto, consulte os documentos abaixo conforme o tipo de tarefa.

- `docs/ARCHITECTURE.md`: define a arquitetura oficial do projeto, as camadas principais e o fluxo entre fontes oficiais, rules, brain, mapas, paginas, sitemap e usuario.
- `docs/DATA_ARCHITECTURE.md`: define como dados oficiais devem ser centralizados, versionados, auditados e reutilizados para evitar valores hardcoded em paginas.
- `docs/CATALOG_ARCHITECTURE.md`: define a arquitetura de catalogo para ferramentas, artigos, galerias, busca, Home e sitemap futuro.
- `docs/ARTICLE_LAYOUT_V1.md`: define o padrao oficial para artigos do blog em `/blog/`. Nao se aplica a calculadoras ou ferramentas.
- `docs/TOOL_STANDARD_V2.md`: define o padrao oficial para novas ferramentas e calculadoras, incluindo UX, resultado, SEO, fallback, monetizacao e governanca.
- `docs/RULES_TRANSFORM_INSS.md`: define o contrato tecnico do transformador INSS entre `data/rules/inss.json` e `data/tabelas-trabalhistas.json`.

Quando houver conflito entre documentos, priorize o documento mais especifico para a tarefa e preserve o escopo autorizado pelo usuario.

## 3. Fluxo Oficial

Toda tarefa relevante deve seguir este fluxo:

1. Auditoria.
2. Plano.
3. Aprovacao.
4. Implementacao.
5. Validacao.
6. Integracao.
7. Commit.
8. Push.
9. IndexNow quando aplicavel.

Nem toda tarefa executa todas as etapas no mesmo pedido. Se o usuario pedir apenas auditoria, plano ou HTML inicial, pare nessa fase. Se o usuario autorizar apenas arquivos especificos, nao avance para governanca, catalogo, sitemap, commit ou push sem nova autorizacao.

## 4. Auditoria

Na auditoria, entenda o estado atual antes de editar.

Verifique:

- arquivos existentes;
- padroes aprovados;
- catalogos relevantes;
- mapas de governanca;
- dependencias;
- sitemap;
- scripts de validacao;
- restricoes declaradas pelo usuario.

Use a auditoria para evitar duplicidade, preservar URLs publicadas e identificar impactos em calculadoras, artigos, Home e dados.

## 5. Planejamento

O plano deve separar claramente:

- arquivos que serao alterados;
- arquivos que nao serao alterados;
- sequencia de implementacao;
- validacoes finais;
- riscos conhecidos;
- necessidade ou nao de commit/push.

Se a tarefa envolver regra oficial, calculadora, catalogo ou sitemap, o plano deve prever validacao antes de entrega.

## 6. Regras Para Artigos

Todo novo artigo de blog deve seguir `docs/ARTICLE_LAYOUT_V1.md`.

Regras:

- aplicar `ARTICLE_LAYOUT_V1` apenas em paginas dentro de `/blog/`;
- respeitar a tipografia aprovada;
- nao alterar CSS global;
- nao alterar JS global;
- nao alterar header ou footer sem pedido explicito;
- criar o HTML primeiro quando o usuario pedir etapa page-local;
- integrar depois em `data/articles.json`, `data/maps/content-map.json`, `data/brain/clusters.json` e `sitemap.xml` quando essa etapa for autorizada;
- rodar `node scripts/validate-governance.js` depois da integracao;
- fazer commit/push somente com autorizacao;
- enviar IndexNow quando aplicavel e autorizado.

Artigos devem aprofundar o assunto. Ferramentas respondem a duvida pratica do calculo; artigos explicam contexto, variacoes, direitos, exemplos e riscos.

## 7. Regras Para Ferramentas

Toda nova ferramenta deve seguir `docs/TOOL_STANDARD_V2.md`.

Regras:

- usar UX simples e mobile first;
- usar helper central quando existir;
- manter fallback local;
- nao introduzir regra anual hardcoded sem justificativa;
- tratar `data/rules/` como fonte oficial;
- tratar `data/tabelas-trabalhistas.json` como agregador/runtime;
- preservar formulas e memoria de calculo ao migrar origem de dados;
- incluir resultado, resumo, memoria de calculo e tabela;
- incluir acoes secundarias: baixar relatorio, imprimir e copiar resultado;
- incluir conteudo SEO de aproximadamente 800 a 1.200 palavras;
- incluir FAQ;
- incluir Schema quando aplicavel;
- preparar espaco `FUTURE_PRODUCT_SLOT`;
- garantir que relatorio e produto nao compitam com o calculo principal.

Qualquer migracao de dados deve provar equivalencia numerica entre helper central e fallback local.

## 8. Governanca De Ferramentas

Toda nova ferramenta oficial deve ser registrada em:

- `data/tools.json`;
- `data/maps/tools-map.json`;
- `data/brain/dependencies.json`;
- `data/maps/update-map.json`;
- `sitemap.xml`.

Regras:

- `/ferramentas/` mostra ferramentas publicadas em `data/tools.json`;
- Home mostra apenas ferramentas com `showOnHome=true`;
- novas ferramentas devem usar `showOnHome=false` por padrao;
- nao definir `homeOrder` quando `showOnHome=false`;
- registrar dependencias de regras e arquivos runtime;
- registrar impactos de atualizacao no update-map;
- adicionar a URL ao sitemap uma unica vez;
- validar com `node scripts/validate-governance.js`.

Nao altere `data/brain/clusters.json` ou qualquer outro arquivo se a etapa autorizar somente um subconjunto de governanca.

## 9. Arquitetura De Regras

Fluxo oficial das regras:

```text
data/rules/
↓
scripts/transform-rules.js
↓
data/tabelas-trabalhistas.json
↓
assets/js/tabelas-trabalhistas.js
↓
calculadoras
```

Principios:

- `data/rules/` e a fonte oficial;
- `data/tabelas-trabalhistas.json` e agregador/runtime;
- `assets/js/tabelas-trabalhistas.js` e helper de consumo no frontend;
- calculadoras nao devem depender diretamente de `data/rules/` sem contrato aprovado;
- qualquer mudanca anual comeca em `data/rules/`;
- `scripts/transform-rules.js` deve validar equivalencia antes de qualquer substituicao de runtime.

O contrato atual do agregador deve ser preservado ate que uma migracao seja comprovada por testes.

## 10. Atualizacoes Anuais

Fluxo oficial:

1. Atualizar `data/rules/`.
2. Rodar `node scripts/transform-rules.js`.
3. Validar equivalencia numerica.
4. Atualizar agregador quando aprovado.
5. Rodar `node scripts/validate-governance.js`.
6. Testar calculadoras afetadas.
7. Fazer commit/push somente com autorizacao.

Atualizacoes anuais devem registrar fontes oficiais, vigencia, data de consulta e impacto em ferramentas/artigos.

## 11. Categorias Do Blog

Estrategia futura:

- manter URLs atuais dos artigos;
- criar paginas de categoria como camada nova;
- nao substituir clusters por categorias.

Exemplos de categorias futuras:

- `/blog/categoria/clt/`;
- `/blog/categoria/inss/`;
- `/blog/categoria/previdencia/`;
- `/blog/categoria/fgts/`;
- `/blog/categoria/mei/`;
- `/blog/categoria/imposto-de-renda/`.

Categorias sao camadas de navegacao editorial. Clusters continuam sendo estrutura de governanca e estrategia tematica.

## 12. Home

A Home deve ser tratada como area governada, nao como pagina para edicao manual solta.

Diretrizes:

- Home modular por nucleos;
- ultimos artigos automaticos: 6;
- cada nucleo pode ter carrossel de ferramentas e guias;
- botao "Ver todos" leva a categoria ou colecao completa;
- destaques da Home devem ser controlados por catalogo;
- nao mexer em Home, header ou footer sem pedido explicito.

Ferramentas novas nao devem entrar na Home por padrao. Use `showOnHome=false`, sem `homeOrder`.

## 13. Monetizacao

Toda ferramenta deve nascer preparada para produto.

Diretrizes:

- `FUTURE_PRODUCT_SLOT` fica pos-resultado;
- produto deve ser contextual;
- relatorio e acao secundaria;
- CTA de produto nao deve competir com calculo;
- monetizacao nao deve esconder memoria de calculo, tabela, FAQ ou fontes oficiais.

Em artigos, siga o padrao de monetizacao previsto em `ARTICLE_LAYOUT_V1` e documentos relacionados.

## 14. Validacoes Obrigatorias

Comandos gerais:

```bash
node scripts/validate-governance.js
node scripts/transform-rules.js
git diff --check
git status --short
```

Use conforme o escopo:

- artigo HTML apenas: validar HTML, schemas e escopo de arquivos;
- artigo integrado: validar `articles.json`, `content-map`, `clusters`, sitemap e governance;
- ferramenta: validar catalogo, tools-map, dependencies, update-map, sitemap e comportamento da pagina;
- regra anual: validar transformador, equivalencia numerica e calculadoras afetadas.

Sempre entregue os resultados dos comandos pedidos pelo usuario.

## 15. Commit, Push E IndexNow

Commit e push so podem acontecer com autorizacao explicita.

Fluxo recomendado quando autorizado:

1. Conferir `git status --short`.
2. Conferir diff dos arquivos autorizados.
3. Rodar validacoes.
4. Fazer commit com mensagem objetiva.
5. Fazer push.
6. Enviar IndexNow quando houver publicacao ou atualizacao relevante de URL publica.

Nunca use commit/push para "finalizar" uma tarefa se o usuario proibiu ou nao autorizou.

## 16. Regras De Seguranca

Regras obrigatorias:

- nao alterar arquivos fora do escopo aprovado;
- nao fazer commit sem autorizacao;
- nao fazer push sem autorizacao;
- nao mexer em Home/Header/Footer sem pedido explicito;
- nao alterar URLs publicadas sem plano de redirect;
- nao duplicar brain, rules ou catalogos;
- nao criar nova arquitetura paralela;
- nao conectar calculadoras diretamente a `data/rules/` sem contrato;
- nao remover fallback local sem testes de equivalencia;
- nao alterar formulas quando o pedido for apenas origem de dados, layout ou catalogo;
- nao normalizar ou reformatar arquivos inteiros sem necessidade.

Se aparecerem mudancas preexistentes no worktree, trate-as como trabalho do usuario e nao reverta sem pedido explicito.

## 17. Entrega Padrao

Ao finalizar uma tarefa, retorne:

- arquivos criados ou alterados;
- resumo objetivo do que foi feito;
- validacoes executadas;
- resultado de `git diff --check`;
- resultado de `git status --short`;
- pendencias ou riscos, se existirem.

Quando o usuario pedir contagem, unicidade ou confirmacao de catalogo/sitemap, inclua os numeros concretos.

## 18. Conclusao

Este documento e a porta de entrada para qualquer IA ou desenvolvedor atuar no Calcule Trabalhador.

O principio central e simples: crescer com seguranca. Cada alteracao deve respeitar documentos oficiais, escopo aprovado, contratos de dados, governanca, validacoes e fluxo de publicacao.
