# Architecture Plan

## 1. Estrutura atual do projeto

O projeto Calcule Trabalhador esta organizado como um site estatico, com uma Home renderizada por React/Vite e calculadoras independentes em HTML.

Estrutura principal:

- `index.html`: entrada da Home.
- `assets/`: bundles JS/CSS gerados para a Home React/Vite.
- `salario-liquido-clt-2026/index.html`: calculadora de salario liquido.
- `calculadora-rescisao-clt-2026/index.html`: calculadora de rescisao.
- `calculadora-ferias-clt-2026/index.html`: calculadora de ferias.
- `calculadora-13-salario-2026/index.html`: calculadora de 13o salario.
- `calculadora-horas-extras-clt-2026/index.html`: calculadora de horas extras.
- `calculadora-seguro-desemprego-2026/index.html`: calculadora de seguro-desemprego.
- `sitemap.xml`: sitemap publico atual.
- `robots.txt`: regras basicas para crawlers.
- `.htaccess`: rewrite para SPA e cache de assets.
- `_redirects`: fallback para `index.html`.
- `docs/PROJECT_CONTEXT.md`: contexto e regras do projeto.

## 2. Problemas encontrados

- A Home depende de bundle minificado em `assets/index-DF-O0wkc.js`, sem codigo-fonte React/Vite disponivel no projeto.
- Existem assets antigos que nao sao referenciados pelo `index.html` atual.
- Ha mistura de padroes entre paginas: React/Vite, HTML com Tailwind CDN e HTML com CSS inline.
- Algumas calculadoras possuem footer e outras nao.
- Algumas URLs existem como rotas React, mas nao como paginas HTML fisicas.
- Algumas URLs sao citadas no bundle ou em documentos, mas nao estao no sitemap.
- O padrao de canonical varia entre URLs com barra final e sem barra final.
- `llms.txt` parece desatualizado em relacao as URLs reais do projeto.
- A Home ainda contem scripts de ambiente Hostinger/Horizons no `index.html`.

## 3. Assets em uso

Assets diretamente referenciados pela Home:

| Arquivo | Uso |
| --- | --- |
| `assets/index-DF-O0wkc.js` | Bundle JS principal da Home React/Vite |
| `assets/index-C4IXwA1g.css` | CSS principal da Home React/Vite |

Referencias encontradas:

- `index.html` carrega `/assets/index-DF-O0wkc.js`.
- `index.html` carrega `/assets/index-C4IXwA1g.css`.
- `.htaccess` aplica regra de cache para `/assets/.*`, mas nao referencia arquivo especifico.

## 4. Assets orfaos

Assets sem referencia direta encontrada:

- `assets/index-0pN5O_i8.js`
- `assets/index-7NI06iCh.js`
- `assets/index-BKzcuBM6.js`
- `assets/index-BtQrDtwm.js`
- `assets/index-CtTF8h7V.js`
- `assets/index-D9f6PfL4.css`
- `assets/index-DcZuN109.css`

Esses arquivos parecem ser builds antigos ou sobras de deploys anteriores. Nao remover sem validacao adicional, pois podem estar em cache ou ainda serem referenciados por versoes antigas servidas em algum ambiente.

## 5. Calculadoras existentes

Calculadoras com pagina HTML propria:

- `/salario-liquido-clt-2026/`
- `/calculadora-rescisao-clt-2026/`
- `/calculadora-ferias-clt-2026/`
- `/calculadora-13-salario-2026/`
- `/calculadora-horas-extras-clt-2026/`
- `/calculadora-seguro-desemprego-2026/`

Calculadora existente dentro do bundle React/Vite:

- `/saque-aniversario-fgts`

A Home lista os seguintes cards de calculadoras:

- Saque Aniversario FGTS 2026
- Salario Liquido CLT 2026
- Calculadora de Rescisao
- Calculadora de 13o Salario
- Calculadora de Ferias CLT
- Calculadora de Hora Extra
- Calculadora Seguro-Desemprego 2026

## 6. Paginas sem footer

Paginas HTML sem `<footer>` detectado:

- `calculadora-13-salario-2026/index.html`
- `calculadora-ferias-clt-2026/index.html`
- `calculadora-horas-extras-clt-2026/index.html`

Paginas HTML com `<footer>` detectado:

- `salario-liquido-clt-2026/index.html`
- `calculadora-rescisao-clt-2026/index.html`
- `calculadora-seguro-desemprego-2026/index.html`

A Home possui footer renderizado pelo bundle React/Vite, nao diretamente no `index.html`.

## 7. Paginas com padroes diferentes

Padrao React/Vite:

- `index.html`
- `assets/index-DF-O0wkc.js`
- `assets/index-C4IXwA1g.css`

Padrao HTML com Tailwind CDN:

- `calculadora-rescisao-clt-2026/index.html`
- `calculadora-ferias-clt-2026/index.html`
- `calculadora-13-salario-2026/index.html`
- `calculadora-horas-extras-clt-2026/index.html`

Padrao HTML com CSS inline:

- `salario-liquido-clt-2026/index.html`
- `calculadora-seguro-desemprego-2026/index.html`

Essa diferenca de padroes aumenta o risco de inconsistencia visual, SEO desigual, navegacao quebrada e manutencao mais lenta.

## 8. Riscos atuais

- Alterar bundles minificados manualmente pode quebrar a Home e dificulta auditoria.
- Remover assets antigos sem validar cache/CDN pode quebrar usuarios que ainda carreguem HTML antigo.
- Paginas sem footer podem prejudicar padrao visual, navegacao interna e SEO.
- Links para rotas React sem pagina HTML fisica dependem do fallback SPA.
- URLs de blog citadas no bundle podem gerar rotas sem conteudo especifico.
- Inconsistencia de canonical pode gerar duplicidade ou sinais SEO mistos.
- Mistura de Tailwind CDN e CSS inline dificulta padronizacao futura.
- A ausencia do codigo-fonte original da Home limita evolucao segura.

## 9. Plano de migracao em fases

Observacao: A Home React atual ainda controla rotas importantes. Por isso, a migracao da Home deve acontecer apenas depois que essas rotas tiverem paginas HTML equivalentes, evitando quebra de URLs ja publicadas.

### Ordem exata das fases

1. Documentar e commitar o plano de arquitetura.
2. Criar paginas HTML equivalentes para rotas React importantes:
   - `/saque-aniversario-fgts/`
   - `/sobre/`
   - `/contato/`
   - `/politica-de-privacidade/`
   - `/blog/saque-aniversario-fgts-2026/`
3. Padronizar footer nas calculadoras que ainda nao tem footer:
   - `calculadora-13-salario-2026`
   - `calculadora-ferias-clt-2026`
   - `calculadora-horas-extras-clt-2026`
4. Padronizar header nas calculadoras.
5. Criar estrutura real de blog em HTML.
6. Criar nova Home HTML pura em arquivo de teste:
   - `index-novo.html`
7. Testar a nova Home localmente.
8. Substituir `index.html` somente apos validacao.
9. Atualizar `sitemap.xml` e `llms.txt`.
10. Validar links, SEO, responsividade e navegacao.
11. Remover dependencia dos bundles React/Vite somente no final.
12. Limpar assets orfaos somente depois de tudo validado.

### Fase 1: Documentacao e commit do plano

- Manter inventario atualizado das paginas reais, rotas React, assets ativos e assets orfaos.
- Registrar o plano de arquitetura antes de iniciar alteracoes estruturais.
- Preservar todas as URLs publicadas.

### Fase 2: Criacao de paginas HTML equivalentes

- Criar paginas HTML para rotas hoje controladas pela Home React.
- Garantir que `/saque-aniversario-fgts/`, `/sobre/`, `/contato/`, `/politica-de-privacidade/` e `/blog/saque-aniversario-fgts-2026/` funcionem sem depender do bundle da Home.
- Manter conteudo, SEO e navegacao equivalentes antes de substituir a Home.

### Fase 3: Padronizacao de footer

- Adicionar footer nas calculadoras que ainda nao possuem.
- Usar como referencia o padrao aprovado do projeto.
- Nao alterar calculos ou funcionalidades.

### Fase 4: Padronizacao de header

- Padronizar header nas calculadoras.
- Preservar links internos e URLs publicadas.
- Testar responsividade em cada pagina alterada.

### Fase 5: Estrutura real de blog

- Criar estrutura HTML para o blog.
- Criar indice do blog e paginas de artigos.
- Conectar artigos as calculadoras relacionadas.

### Fase 6: Nova Home em teste

- Criar `index-novo.html` como Home HTML pura de teste.
- Reproduzir conteudo, cards, links, metas e estrutura SEO da Home atual.
- Nao substituir `index.html` nesta fase.

### Fase 7: Testes locais

- Testar a nova Home localmente.
- Validar links, layout, SEO basico, responsividade e navegacao.
- Comparar com a Home atual antes da troca.

### Fase 8: Substituicao controlada da Home

- Substituir `index.html` somente apos validacao.
- Manter backup da Home atual.
- Garantir que as rotas React importantes ja tenham paginas HTML equivalentes.

### Fase 9: Atualizacao de SEO tecnico

- Atualizar `sitemap.xml`.
- Atualizar `llms.txt`.
- Validar canonical, robots e links internos.

### Fase 10: Validacao geral

- Validar links internos.
- Validar SEO, responsividade e navegacao.
- Conferir funcionamento de todas as calculadoras.

### Fase 11: Remocao da dependencia React/Vite

- Remover dependencia dos bundles React/Vite somente depois da Home HTML estar validada.
- Evitar apagar arquivos enquanto houver risco de cache/CDN.

### Fase 12: Limpeza controlada de assets

- Confirmar em producao quais assets ainda sao carregados.
- Verificar cache/CDN antes de remover arquivos antigos.
- Fazer backup antes de qualquer exclusao.
- Remover assets orfaos somente depois de tudo validado e com aprovacao explicita.

## 10. Regras para futuras alteracoes

- Antes de qualquer alteracao: analisar, explicar, apresentar checklist e aguardar aprovacao.
- Nunca alterar arquivos sem autorizacao.
- Nunca fazer commit sem autorizacao.
- Nunca fazer push sem autorizacao.
- Nunca apagar arquivos sem autorizacao explicita.
- Preservar funcionalidades existentes.
- Preservar URLs existentes.
- Preservar estrutura SEO.
- Identificar todos os arquivos que serao alterados antes da execucao.
- Preferir criar novo codigo a alterar codigo antigo quando houver risco.
- Alterar uma area por vez.
- Testar pagina afetada apos cada mudanca aprovada.
- Nao editar assets minificados salvo quando for a unica opcao aprovada.
