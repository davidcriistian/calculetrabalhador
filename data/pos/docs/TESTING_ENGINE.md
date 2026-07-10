# Testing Engine

## Objetivo

A Testing Engine e a autoridade oficial de testes do Project Operating System.

Na Fase 3, ela define como componentes da plataforma deverao ser testados antes e depois de alteracoes futuras. Ela nao executa testes reais, nao corrige falhas, nao altera arquivos e nao executa migracoes.

## Filosofia

A Testing Engine existe para transformar aprovacao tecnica em um processo repetivel.

Seus principios sao:

- testar antes de aprovar;
- comparar contra baseline;
- separar evidencia de decisao;
- definir tolerancia antes do resultado;
- bloquear alteracoes quando houver regressao;
- preservar runtime, SEO, URLs, layout e comportamento publicado.

## Responsabilidades

A Testing Engine define:

- tipos de testes;
- status de testes;
- severidade;
- evidencia minima;
- nivel de bloqueio;
- dono de aprovacao;
- templates de plano;
- baseline oficial;
- equivalencia;
- regressao;
- performance;
- suites de teste;
- relatorios;
- matriz de aprovacao.

Ela deve responder:

- o que sera testado;
- quais entradas utilizar;
- quais resultados esperar;
- qual tolerancia aceitar;
- quando aprovar;
- quando reprovar;
- quais testes sao obrigatorios;
- como registrar um baseline;
- como comparar versoes;
- como gerar relatorio.

## O Que Testa

Os tipos declarativos definidos sao:

- `calculator-equivalence`;
- `article-integrity`;
- `seo-regression`;
- `runtime-regression`;
- `layout-regression`;
- `performance-regression`;
- `offer-regression`;
- `automation-regression`.

## O Que Nao Testa

Na Fase 3, a Testing Engine nao:

- executa testes reais;
- corrige falhas;
- altera calculadoras;
- altera artigos;
- altera HTML, CSS ou JavaScript;
- altera runtime;
- altera SEO, URLs, sitemap ou layout;
- altera Core, Compatibility, Legislation, Update, Shadow ou Migration;
- aprova producao automaticamente.

## Baseline

O baseline oficial usa `baseline-template.json`.

Ele registra:

- versao;
- timestamp;
- casos executados;
- entradas;
- saidas esperadas;
- saidas obtidas;
- diferencas;
- tolerancia;
- resultado;
- checksum reservado;
- observacoes.

O baseline e a fotografia tecnica usada para comparar mudancas futuras.

## Equivalencia

A equivalencia usa `equivalence-template.json`.

Ela compara:

- entrada;
- resultado esperado;
- resultado obtido;
- diferenca;
- percentual;
- tolerancia;
- status.

Para calculadoras, equivalencia deve ser tratada como gate bloqueante em migracoes futuras.

## Regressao

A regressao usa `regression-template.json`.

Ela compara uma versao anterior contra uma versao atual ou futura. Pode ser usada para runtime, SEO, layout, ofertas, automacoes e integridade de artigos.

Uma regressao bloqueante impede aprovacao tecnica.

## Performance

Performance usa `performance-template.json`.

O modelo registra metricas, baseline, valor obtido, diferenca, tolerancia, ambiente e resultado. Na Fase 3, ele nao mede performance; apenas define como a evidencia devera ser registrada.

## Aprovacao

A aprovacao tecnica usa `approval-matrix.json`.

Nenhum componente podera ser considerado aprovado sem:

- `equivalence-pass`;
- `required-tests-pass`;
- `no-runtime-regression`;
- `no-seo-regression`;
- `no-layout-regression`;
- `baseline-match`;
- `manual-approval`.

Cada plano, suite e relatorio futuro deve declarar:

- `severity`;
- `evidence`;
- `blockingLevel`;
- `approvalOwner`;
- `minimumEvidence`.

Severidades oficiais:

- `low`;
- `medium`;
- `high`;
- `critical`.

Evidencias minimas oficiais:

- `calculation-baseline`;
- `json-output`;
- `html-snapshot`;
- `seo-snapshot`;
- `schema-snapshot`;
- `link-check`;
- `performance-metric`;
- `manual-review`.

## Reprovacao

Um componente deve ser reprovado quando:

- qualquer item obrigatorio da matriz falhar;
- evidencia estiver ausente;
- tolerancia nao estiver definida;
- baseline nao existir;
- regressao tecnica for detectada;
- aprovacao manual nao for registrada.

## Integracao Futura Com Migration

Migration devera usar a Testing Engine para pre-checks, post-checks, baseline e aprovacao tecnica. A Testing Engine nao executa a migracao.

## Integracao Futura Com Validation

Validation devera verificar se planos, baselines, suites e relatorios seguem os contratos corretos. A Testing Engine prepara a evidencia que Validation podera validar.

## Integracao Futura Com Knowledge

Knowledge podera relacionar testes a conceitos, fontes, dominios e justificativas tecnicas.

## Integracao Futura Com Calculator

Calculator devera usar equivalencia e baseline para preservar resultados antes e depois de alteracoes.

## Integracao Futura Com Content

Content devera usar integridade de artigo, SEO regression e baseline editorial quando houver alteracoes futuras.

## Integracao Futura Com Offers

Offers devera usar offer regression para confirmar que posicionamento, elegibilidade e metadados permanecem corretos.

## Integracao Futura Com Automation

Automation devera usar automation regression para provar que fluxos automatizados preservam limites e resultados esperados.

## Economia De Creditos Do Codex

A Testing Engine reduz consumo de creditos porque:

- evita redesenhar criterios de teste a cada tarefa;
- padroniza baselines, suites e relatorios;
- transforma aprovacao em matriz objetiva;
- deixa tolerancias explicitas;
- separa testes obrigatorios e opcionais;
- permite reaproveitar evidencia entre Migration e Validation;
- ajuda o Codex a seguir um roteiro curto em vez de redescobrir o processo.

## Preparacao Para Validation

A Testing Engine prepara a Validation Engine ao tornar explicitos severidade, evidencia minima, nivel de bloqueio e dono de aprovacao. A Validation Engine podera validar a completude desses campos sem executar testes reais.

## Estado Atual

A Testing Engine esta em modo `foundation` e `not-consumed`.

Nenhum teste real e executado nesta fase.
