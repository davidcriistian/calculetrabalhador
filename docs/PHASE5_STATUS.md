# Fase 5 — Padronização das Calculadoras

## Objetivo

A Fase 5 tem como objetivo padronizar as calculadoras do projeto Calcule Trabalhador sem alterar suas regras de cálculo, SEO, FAQ ou funcionamento existente.

O foco desta fase é melhorar a consistência estrutural das páginas de calculadoras, principalmente em footer, links internos, links institucionais e canonical.

## Etapa 1 — Footer + Links + Canonical

Status: Concluída

### Calculadoras concluídas

- calculadora-13-salario-2026
- calculadora-ferias-clt-2026
- calculadora-horas-extras-clt-2026
- calculadora-rescisao-clt-2026
- salario-liquido-clt-2026
- calculadora-seguro-desemprego-2026

### O que foi aplicado

- Footer padrão
- Links institucionais
- Links internos
- Canonical corrigido ou validado
- SEO preservado
- FAQ preservado
- Scripts preservados

### Commits realizados

- efea53a — Padroniza footer da calculadora de 13 salario
- 5a622ac — Padroniza footer da calculadora de férias CLT 2026
- 440a86a — Padroniza footer da calculadora de horas extras CLT 2026
- 6992fc5 — Padroniza footer da calculadora de rescisão CLT 2026
- 6bdf950 — Padroniza footer da calculadora de salário líquido CLT 2026
- fc7cbce — Padroniza footer da calculadora de seguro-desemprego 2026

### Regras seguidas

- Uma alteração por vez
- Não alterar cálculos
- Validar antes de commitar
- Commit antes de push
- Preservação de SEO
- Preservação de FAQ visual e FAQ Schema
- Preservação dos scripts das calculadoras
- Alterar somente o arquivo aprovado em cada etapa

## Etapa 2 — Padronização de Header

Status: Não iniciada

### Objetivo

Padronizar o header das calculadoras para criar uma experiência visual e estrutural mais consistente entre as páginas, mantendo identidade do projeto, navegação clara e compatibilidade com os padrões já aplicados nos footers.

### Riscos

- Alterar a estrutura do H1 indevidamente e afetar SEO.
- Quebrar layout em páginas que usam Tailwind CDN.
- Quebrar layout em páginas que usam CSS próprio.
- Criar inconsistência entre páginas HTML estáticas e páginas ainda controladas pelo bundle React/Vite.
- Afetar links de navegação já publicados.
- Alterar acidentalmente scripts ou elementos usados pelas calculadoras.

### Estratégia

A Etapa 2 deve começar com análise completa antes de qualquer alteração.

Para cada página, o processo deve seguir:

- analisar o header atual;
- identificar H1, logo, links e estrutura visual;
- comparar páginas com Tailwind e páginas com CSS próprio;
- propor a alteração antes de aplicar;
- aguardar aprovação;
- alterar uma página por vez;
- validar SEO, H1 único, links, responsividade e preservação dos scripts;
- commitar somente após validação aprovada.
