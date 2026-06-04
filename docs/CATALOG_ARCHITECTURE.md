# Arquitetura Oficial de Catálogo

## 1. Objetivo

Este documento define a arquitetura oficial de catálogo do projeto Calcule Trabalhador.

O catálogo será a fonte única de verdade para:

- Calculadoras.
- Artigos.
- Galerias.
- Busca.
- Home.
- Sitemap futuro.

Princípio oficial:

> Cadastrar uma vez, reutilizar em todo o projeto.

Toda nova página publicada deve ser registrada no catálogo para que o projeto cresça com consistência, menos retrabalho e menor risco de links esquecidos.

## 2. Problema Atual

O modelo manual cria riscos conforme o projeto cresce.

Riscos principais:

- Criar cards manualmente em várias páginas.
- Atualizar a Home manualmente.
- Atualizar galerias manualmente.
- Esquecer links internos.
- Esquecer a busca.
- Esquecer o sitemap.
- Criar divergência entre título, URL, descrição e categoria.
- Publicar página nova sem aparecer nos pontos de descoberta do site.

Com poucas páginas, esse risco é administrável. Com dezenas ou centenas de ferramentas e artigos, o processo manual se torna frágil.

## 3. Arquitetura Desejada

Estrutura conceitual:

```text
data/
├── tools.json
└── articles.json
```

Função de cada arquivo:

- `tools.json`: catálogo central de calculadoras e ferramentas.
- `articles.json`: catálogo central de artigos, guias e conteúdos editoriais.

A partir desses arquivos, o projeto poderá alimentar galerias, busca, Home, links internos e sitemap futuro.

## 4. Estrutura De tools.json

Campos obrigatórios:

- `id`
- `title`
- `slug`
- `category`
- `description`
- `published`
- `featured`
- `updatedAt`

Explicação dos campos:

- `id`: identificador único e estável da ferramenta.
- `title`: título público da calculadora ou ferramenta.
- `slug`: caminho público da página, sem domínio.
- `category`: categoria principal da ferramenta.
- `description`: resumo curto para cards, busca e galerias.
- `published`: indica se a ferramenta está publicada.
- `featured`: indica se a ferramenta pode aparecer em destaque.
- `updatedAt`: data da última atualização relevante.

Exemplo conceitual:

```json
{
  "id": "salario-liquido-clt-2026",
  "title": "Calculadora de Salário Líquido CLT 2026",
  "slug": "/salario-liquido-clt-2026/",
  "category": "Salário",
  "description": "Calcule salário líquido com INSS, IRRF e dependentes.",
  "published": true,
  "featured": true,
  "updatedAt": "2026-05-01"
}
```

## 5. Estrutura De articles.json

Campos obrigatórios:

- `id`
- `title`
- `slug`
- `category`
- `description`
- `publishedAt`
- `updatedAt`
- `featured`

Explicação dos campos:

- `id`: identificador único e estável do artigo.
- `title`: título público do artigo.
- `slug`: caminho público da página, sem domínio.
- `category`: categoria editorial principal.
- `description`: resumo curto para cards, busca e galerias.
- `publishedAt`: data de publicação.
- `updatedAt`: data da última atualização relevante.
- `featured`: indica se o artigo pode aparecer em destaque.

Exemplo conceitual:

```json
{
  "id": "saque-aniversario-fgts-2026",
  "title": "Saque-Aniversário FGTS 2026",
  "slug": "/blog/saque-aniversario-fgts-2026/",
  "category": "FGTS",
  "description": "Entenda regras, calendário e cuidados sobre o saque-aniversário.",
  "publishedAt": "2026-05-01",
  "updatedAt": "2026-05-01",
  "featured": true
}
```

## 6. Integração Com Home

A Home deve consumir o catálogo para exibir:

- Ferramentas em destaque.
- Últimas ferramentas.
- Últimos artigos.
- Busca.

A Home não deve depender de listas duplicadas ou cards criados manualmente.

Quando uma nova ferramenta ou artigo for cadastrado no catálogo, a Home deve conseguir reutilizar esses dados sem edição manual de cards.

## 7. Integração Com Galeria De Ferramentas

A galeria de ferramentas deve ser gerada a partir de `tools.json`.

Regras:

- Sem cards manuais.
- Sem listas duplicadas.
- Exibir apenas ferramentas com `published: true`.
- Permitir destaque com `featured: true`.
- Permitir filtros por `category`.
- Usar `title`, `slug` e `description` vindos do catálogo.

## 8. Integração Com Galeria De Artigos

A galeria de artigos deve ser gerada a partir de `articles.json`.

Regras:

- Sem cards manuais.
- Sem listas duplicadas.
- Exibir artigos publicados.
- Permitir destaque com `featured: true`.
- Permitir filtros por `category`.
- Usar `title`, `slug`, `description`, `publishedAt` e `updatedAt` vindos do catálogo.

## 9. Integração Com Busca

A busca deve consultar:

- `tools.json`
- `articles.json`

Não deve existir lista duplicada apenas para busca.

Campos mínimos pesquisáveis:

- `title`
- `description`
- `category`
- `slug`

Com isso, a busca permanece sincronizada com ferramentas, artigos, galerias e Home.

## 10. Integração Com Sitemap Futuro

O catálogo poderá alimentar `sitemap.xml` automaticamente.

Possível regra futura:

- Ferramentas publicadas em `tools.json` entram no sitemap.
- Artigos publicados em `articles.json` entram no sitemap.
- Páginas institucionais podem vir de um catálogo próprio ou lista controlada.

Benefícios:

- Menos risco de esquecer URLs.
- Mais consistência entre site e sitemap.
- Publicação mais previsível.
- Melhor manutenção em escala.

## 11. Integração Com Templates

Novas páginas devem nascer de templates oficiais:

- `calculadora-template`
- `artigo-template`
- `institucional-template`

Esses templates devem conter:

- Favicon.
- Header.
- Footer.
- SEO.
- Monetização preparada.
- Estrutura compatível com links internos.
- Espaços adequados para schemas quando necessário.

O catálogo e os templates devem trabalhar juntos: o template cria a página, o catálogo registra a página e o restante do projeto reutiliza os dados cadastrados.

## 12. Processo Oficial De Criação

Nova calculadora:

1. Criar página.
2. Adicionar em `tools.json`.

Fim.

Novo artigo:

1. Criar página.
2. Adicionar em `articles.json`.

Fim.

Todo o restante deve ser derivado do catálogo.

Isso inclui:

- Cards.
- Galerias.
- Busca.
- Links internos futuros.
- Sitemap futuro.
- Blocos de destaque.

## 13. Roadmap

### Fase Atual

- Páginas manuais.
- Cards manuais.
- Atualizações manuais em galerias, Home e sitemap.

### Fase Intermediária

- Catálogo centralizado.
- `tools.json`.
- `articles.json`.
- Registro obrigatório de novas páginas.

### Fase Avançada

- Geração automática de galerias.
- Busca consumindo catálogo.
- Home consumindo catálogo.
- Menos edição manual.

### Fase Futura

- Build automático.
- Sitemap gerado a partir do catálogo.
- Templates integrados ao fluxo de criação.
- Publicação mais previsível e escalável.

## 14. Regra Final

Toda nova página deve ser integrada ao catálogo.

Nenhuma galeria deve depender de cards manuais.

O catálogo deve ser tratado como fonte única de verdade para descoberta, organização e distribuição interna das páginas do Calcule Trabalhador.
