# Validation Engine

## Objetivo

A Validation Engine e a autoridade oficial de conformidade do Project Operating System.

Na Fase 4, ela define como validar se qualquer componente da plataforma esta em conformidade com os padroes oficiais do projeto. Ela nao executa validacoes reais, nao corrige problemas, nao altera paginas e nao executa migracoes.

## Filosofia

A Validation Engine existe para separar evidencia, conformidade e decisao.

Seus principios sao:

- validar antes de aprovar;
- preservar runtime, SEO, URLs, layout e comportamento publicado;
- exigir evidencia aceita;
- bloquear inconformidade critica;
- manter Core como conhecimento e POS como operacao;
- aplicar configuracao acima de codigo.

## Responsabilidades

A Validation Engine define:

- tipos de validacao;
- status de validacao;
- severidade;
- evidencias aceitas;
- checklist oficial;
- regras de conformidade;
- template de plano;
- template de relatorio;
- template de aprovacao.

Ela responde:

- o que validar;
- quais criterios utilizar;
- quais padroes sao obrigatorios;
- quais evidencias aceitar;
- quando aprovar;
- quando reprovar;
- como registrar inconformidades;
- como gerar relatorio.

## O Que Valida

Tipos declarativos:

- `seo-validation`;
- `html-validation`;
- `jsonld-validation`;
- `schema-validation`;
- `link-validation`;
- `navigation-validation`;
- `layout-validation`;
- `responsive-validation`;
- `accessibility-validation`;
- `performance-validation`;
- `runtime-validation`;
- `content-structure-validation`;
- `calculator-structure-validation`;
- `offer-placement-validation`.

## O Que Nao Valida

Na Fase 4, a Validation Engine nao:

- executa validacoes reais;
- corrige problemas;
- altera calculadoras;
- altera artigos;
- altera HTML, CSS ou JavaScript;
- altera runtime;
- altera SEO, URLs, sitemap ou layout;
- altera Core, Compatibility, Legislation, Update, Shadow, Migration ou Testing;
- aprova producao automaticamente.

## Testing Vs Validation

Testing prova comportamento tecnico por baseline, equivalencia, regressao e evidencia de teste.

Validation prova conformidade com padroes oficiais: SEO, HTML, JSON-LD, schema, links, navegacao, layout, responsividade, acessibilidade, performance, runtime safety, configuracao, arquitetura e padroes do projeto.

Testing responde: "funciona como esperado?"

Validation responde: "esta conforme os padroes oficiais?"

## Checklist

O checklist oficial fica em `validation-checklist.json`.

Ele cobre:

- SEO;
- Canonical;
- Meta Description;
- Title;
- Open Graph;
- Twitter Card;
- JSON-LD;
- Schema.org;
- Breadcrumb;
- Heading hierarchy;
- Internal Links;
- Related Content;
- Responsive;
- Layout;
- Performance;
- Accessibility;
- Runtime Safety;
- Configuracao;
- Arquitetura;
- Padroes do projeto.

## Aprovacao

Nenhum componente podera ser considerado validado sem:

- Testing aprovado;
- migracao aprovada, quando existir;
- todos os itens obrigatorios atendidos;
- nenhuma inconformidade critica;
- manual approval.

## Severidade

Niveis oficiais:

- `low`;
- `medium`;
- `high`;
- `critical`.

Inconformidades `high` e `critical` bloqueiam aprovacao por padrao. Inconformidade `critical` nunca pode permanecer aberta em um componente validado.

## Evidencia

Evidencias aceitas:

- `html-report`;
- `seo-report`;
- `jsonld-report`;
- `performance-report`;
- `responsive-report`;
- `accessibility-report`;
- `manual-review`;
- `snapshot`.

## Integracao Com Migration

Migration fornece contexto de alteracao, escopo, rollback e aprovacao quando uma validacao estiver ligada a migracao.

Validation nao executa migracao.

## Integracao Com Testing

Testing fornece baseline, equivalencia, regressao e aprovacao tecnica.

Validation depende de Testing aprovado para validar conformidade final.

## Integracao Com Core

Core permanece fonte de conhecimento: leis, regras, tabelas, conceitos, fontes, historico e dominios.

Validation verifica conformidade operacional sem transformar POS em fonte de conhecimento.

## Integracao Com Shadow

Shadow fornece evidencia tecnica de comparacao entre Core e comportamento atual quando aplicavel.

Validation pode aceitar referencia a evidencia Shadow, mas nao executa Shadow.

## Integracao Com Offers

Offers futuras deverao usar `offer-placement-validation` para comprovar que posicionamento, contexto, SEO e limites de monetizacao estao conformes.

## Integracao Com Calculator

Calculator futura devera usar `calculator-structure-validation`, `runtime-validation`, `schema-validation` e evidencias de Testing antes de qualquer aprovacao.

## Integracao Com Content

Content futura devera usar `content-structure-validation`, `seo-validation`, `html-validation`, `jsonld-validation` e `link-validation`.

## Integracao Com Automation

Automation futura devera consultar regras de conformidade antes de executar fluxos recorrentes. Qualquer automacao deve ser configuration-led e auditavel.

## Estado Atual

A Validation Engine esta em modo `foundation` e `not-consumed`.

Nenhuma validacao real e executada nesta fase.
