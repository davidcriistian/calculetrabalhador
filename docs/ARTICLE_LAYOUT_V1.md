# ARTICLE_LAYOUT_V1

Status: oficial e aprovado.

`ARTICLE_LAYOUT_V1` define a arquitetura obrigatoria para novos artigos do blog do Calcule Trabalhador.

## Objetivo

A regra existe para padronizar a publicacao editorial, melhorar a experiencia mobile, organizar a distribuicao dos espacos de monetizacao, reforcar a conversao para calculadoras relacionadas e manter consistencia visual entre artigos.

Todo novo artigo deve preservar qualidade editorial, leitura confortavel, SEO, schemas estruturados e links internos estrategicos.

## Escopo

`ARTICLE_LAYOUT_V1` deve ser aplicado somente a artigos publicados dentro de:

```text
/blog/
```

Nao aplicar esta regra em:

```text
/calculadora-*/
/saque-aniversario-fgts/
/salario-liquido-clt/
/ferramentas/
/index.html
paginas institucionais
paginas de ferramentas
paginas de calculadoras
```

`CTA_CARD_V1` tambem fica restrito ao contexto de artigos, como componente do `ARTICLE_LAYOUT_V1`.

## Estrutura Obrigatoria

Todo novo artigo em `/blog/` deve seguir a sequencia abaixo.

## 1. Hero Padrao

Manter exatamente o padrao visual atual dos artigos:

- Hero azul.
- Breadcrumb dentro do Hero.
- Badge da categoria.
- H1.
- Subtitulo.
- Metadados de leitura e atualizacao.

Nao alterar a identidade visual do projeto.

## 2. CTA_CARD_V1 Principal

Posicao obrigatoria: imediatamente apos o Hero.

Objetivo: levar o usuario para a calculadora principal relacionada ao artigo.

Estrutura obrigatoria:

- Icone de calculadora.
- Fundo verde claro.
- Borda verde suave.
- Cantos arredondados.
- Titulo compacto em negrito.
- Texto auxiliar menor.
- Botao verde forte com texto branco.
- Botao com largura confortavel no mobile.

O card deve parecer uma chamada para ferramenta/calculadora, nao uma caixa informativa generica.

## 3. Conteudo Inicial

Abrir o artigo com introducao clara, contexto do problema e os primeiros blocos explicativos.

Estrutura esperada:

- Introducao.
- Primeiros H2.
- Explicacoes iniciais.
- Links internos quando fizer sentido.

## 4. Ads01

Posicao obrigatoria: apos os primeiros blocos de conteudo.

Estrutura sugerida:

```text
Introducao
H2
H2
Ads01
```

Objetivo: criar a primeira pausa natural de leitura sem prejudicar o Hero nem o CTA principal.

Nao inserir anuncio antes do Hero, dentro do Hero ou antes do CTA principal.

## 5. Conteudo Intermediario

Usar esta area para aprofundar o tema:

- Regras.
- Passo a passo.
- Explicacoes praticas.
- Exemplos.
- Cuidados comuns.

## 6. Tabela Principal

Quando o artigo exigir comparacao, regra por faixas, valores, percentuais ou exemplos tabulares, a primeira tabela importante deve seguir o padrao responsivo do projeto.

Requisito:

- Tabela com rolagem horizontal em telas pequenas.
- Leitura preservada no desktop.
- Sem quebra de layout no mobile.

## 7. Ads02

Posicao obrigatoria: apos a primeira tabela principal.

Objetivo: aproveitar a pausa natural depois da leitura de dados, sem interromper explicacoes essenciais antes da tabela.

## 8. CTA_CARD_V1 Secundario

Posicao obrigatoria: apos a secao central do conteudo.

Objetivo: reforcar o uso da calculadora depois que o usuario ja entendeu a regra principal.

Deve seguir o mesmo padrao visual do CTA principal:

- Icone de calculadora.
- Fundo verde claro.
- Borda verde suave.
- Titulo em negrito.
- Texto auxiliar menor.
- Botao verde forte.
- Mobile first.

## 9. Conteudo Final

Usar esta area para complementar a experiencia editorial:

- Casos praticos.
- Vantagens e desvantagens.
- Quando vale a pena.
- Como conferir documentos.
- Erros comuns.
- Links internos estrategicos.

## 10. FAQ

FAQ e obrigatorio em novos artigos.

Requisitos:

- FAQ visual no corpo do artigo.
- FAQ Schema no JSON-LD.
- Entre 12 e 16 perguntas.
- Perguntas reais e uteis.
- Nao inserir anuncios entre perguntas do FAQ.

## 11. Ads03

Posicao obrigatoria: apos o FAQ.

Objetivo: monetizacao apos consumo completo do conteudo principal.

## 12. Area Reservada Para Monetizacao Futura

Entre `Ads03` e `Fontes Oficiais`, pode existir uma area reservada para futuras estrategias de monetizacao editorial, desde que nao prejudique:

- Leitura.
- SEO.
- FAQ.
- Fontes oficiais.
- Disclaimer.
- Experiencia mobile.

Esta area deve permanecer controlada e nao deve substituir `Ads03`, `Fontes Oficiais`, `Ads04` ou `Disclaimer`.

## 13. Fontes Oficiais

Secao obrigatoria.

Deve reunir fontes confiaveis e documentos de conferencia relacionados ao tema do artigo, como legislacao, orgaos oficiais, canais publicos, normas e documentos aplicaveis.

## 14. Ads04

Posicao obrigatoria: apos Fontes Oficiais e antes do Disclaimer.

Objetivo: monetizacao final sem misturar anuncio com aviso juridico/editorial.

## 15. Disclaimer

Secao obrigatoria.

Deve seguir o padrao atual do projeto, deixando claro que o conteudo e informativo e educacional, nao substitui documentos oficiais, analise profissional, sindicato, contador, advogado, RH ou canais oficiais quando aplicavel.

## Regras De Monetizacao

Nao inserir anuncios:

- Antes do Hero.
- Dentro do Hero.
- Antes do CTA principal.
- Antes do resultado de calculadoras.
- Entre perguntas do FAQ.

Componentes oficiais em artigos:

- `CTA_CARD_V1`.
- `Ads01`.
- `Ads02`.
- `Ads03`.
- `Ads04`.

## Mobile First

Todo novo artigo deve ser pensado primeiro para mobile e manter compatibilidade total com tablet e desktop.

Validar:

- CTA principal no mobile.
- CTA secundario no mobile.
- Botao com area de toque confortavel.
- Texto sem compressao excessiva.
- Tabelas responsivas.
- Espacamento dos anuncios.
- FAQ legivel.
- Desktop sem exagero visual.

## Qualidade Editorial

Requisitos minimos:

- Conteudo autoral.
- Minimo de 2200 palavras.
- Meta ideal entre 2500 e 3200 palavras.
- Profundidade tematica.
- Linguagem clara.
- Exemplos praticos.
- Links internos estrategicos.
- SEO preservado.
- Article Schema.
- Breadcrumb Schema.
- FAQ Schema.
- Canonical.
- Open Graph.

## Calculadoras

`ARTICLE_LAYOUT_V1` nao deve ser aplicado em calculadoras, ferramentas ou paginas fora de `/blog/`.

Paginas de ferramentas e calculadoras devem manter o padrao atual existente ate que uma regra propria seja criada, testada e aprovada.

`CALCULATOR_LAYOUT_V1` ainda nao existe, nao foi testado e nao esta aprovado.

Estado atual:

```text
HOME_LAYOUT_V8: oficial
ARTICLE_LAYOUT_V1: oficial somente para artigos em /blog/
CTA_CARD_V1: oficial somente dentro de artigos
CALCULATOR_LAYOUT_V1: futuro / nao aprovado
```
