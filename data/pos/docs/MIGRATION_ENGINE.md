# Migration Engine

## Objetivo

A Migration Engine e o protocolo oficial do Project Operating System para migrar calculadoras e, futuramente, artigos e outros ativos da plataforma.

Na Fase 2, ela cria apenas estrutura, modelos, gates, rollback e documentacao. Nenhuma migracao e executada.

## Responsabilidade

A Migration Engine responde, antes de qualquer mudanca:

- o que sera migrado;
- de onde vem;
- para onde vai;
- quais arquivos podem ser alterados;
- quais arquivos nao podem ser alterados;
- quais testes devem rodar antes;
- quais testes devem rodar depois;
- quais validacoes bloqueiam a migracao;
- como aprovar;
- como reprovar;
- como reverter;
- como gerar relatorio.

## O Que Ela Faz

Ela define um roteiro repetivel para migracoes futuras:

1. registrar o tipo de migracao;
2. classificar risco;
3. mapear origem, destino e arquivos;
4. capturar baseline;
5. declarar testes antes e depois;
6. exigir gates de aprovacao;
7. preparar rollback;
8. registrar decisao e relatorio.

## O Que Ela Nao Faz

A Migration Engine nao:

- altera calculadoras publicadas;
- altera artigos;
- altera HTML, CSS ou JavaScript de producao;
- altera runtime;
- altera `/data/tabelas-trabalhistas.json`;
- altera `/assets/js/tabelas-trabalhistas.js`;
- altera SEO, URLs, sitemap ou layout;
- substitui Core, Compatibility, Legislation, Update ou Shadow;
- executa migracoes em lote;
- implementa automacao operacional.

## Fluxo Completo

O fluxo oficial para migracao futura e:

1. criar um plano a partir de `migration-template.json`;
2. escolher um tipo em `migration-types.json`;
3. definir fase inicial como `planned`;
4. registrar origem, destino e ativo alvo;
5. preencher arquivos permitidos e bloqueados;
6. executar pre-checks definidos no plano;
7. capturar baseline;
8. preparar rascunho da migracao;
9. executar post-checks definidos no plano;
10. validar todos os gates;
11. aguardar aprovacao manual;
12. concluir, reprovar, cancelar ou reverter;
13. gerar relatorio com `migration-report-template.json`.

Na Fase 2, esse fluxo e apenas documentado.

## Gates De Aprovacao

Os gates obrigatorios sao:

- `equivalence-pass`;
- `testing-pass`;
- `validation-pass`;
- `seo-pass`;
- `runtime-safe`;
- `rollback-ready`;
- `manual-approval`.

Qualquer gate obrigatorio ausente ou reprovado bloqueia a migracao futura.

## Rollback

O rollback oficial usa `rollback-template.json`.

Antes de aprovar uma migracao futura, o plano deve documentar:

- baseline anterior;
- arquivos a restaurar;
- arquivos que nunca devem ser restaurados automaticamente;
- verificacoes para confirmar retorno ao estado anterior;
- local do relatorio de rollback;
- status final `rolled-back`, quando aplicavel.

Rollback nao e improviso. Ele e requisito de aprovacao.

## Migracao Individual

Uma migracao individual deve ter:

- `migrationId`;
- tipo;
- ativo alvo;
- origem;
- destino;
- risco;
- fase atual;
- arquivos permitidos;
- arquivos bloqueados;
- pre-checks;
- post-checks;
- gates;
- rollback;
- relatorio.

Esse formato evita redescobrir o processo a cada calculadora.

## Migracao Em Lote

Uma migracao em lote deve usar `migration-batch-template.json`.

O lote deve registrar:

- `batchId`;
- lista de calculadoras;
- ordem;
- risco;
- dependencias;
- status individual;
- status geral;
- regras de parada;
- aprovacao individual;
- aprovacao geral.

Por padrao, lote deve parar na primeira falha e exigir aprovacao individual por ativo.

## Politica De Batch

Todo lote futuro deve declarar:

- `maxItems`;
- `maxEstimatedCredits`;
- `maxEstimatedTime`;
- `stopOnFirstFailure`;
- `allowPartialRollback`;
- `allowFullRollback`;
- `manualApprovalRequired`.

A politica de ondas fica em `migration-waves.json`:

- `wave-1-low-risk`;
- `wave-2-medium-risk`;
- `wave-3-high-risk`;
- `wave-4-critical`.

Ondas existem para reduzir risco e consumo de creditos: itens simples entram primeiro, itens complexos ficam isolados e qualquer falha interrompe o lote quando configurado.

## Relacao Com Core

O Core pode ser origem, destino ou dependencia conceitual de uma migracao futura. A Migration Engine nao altera o Core operacional na Fase 2.

## Relacao Com Compatibility

Compatibility deve ser usado futuramente para confirmar que a estrutura migrada preserva comportamento esperado. A Migration Engine apenas declara essa necessidade.

## Relacao Com Testing Engine

Testing Engine, quando existir, devera executar os testes definidos nos planos. Nesta fase, a Migration Engine apenas lista testes esperados antes e depois.

## Relacao Com Validation Engine

Validation Engine, quando existir, devera validar schema, contratos, dependencias e relacionamentos. Nesta fase, a Migration Engine apenas define o gate `validation-pass`.

## Relacao Com Shadow

Shadow pode fornecer comparacao segura entre comportamento atual e comportamento migrado. Nesta fase, a Migration Engine apenas exige equivalencia antes de aprovacao.

Shadow deve ser tratado como Bridge Layer entre Core e POS Testing para evidencia tecnica, nao como runtime e nao como fonte de conhecimento.

## Como Economiza Creditos Do Codex

A Migration Engine economiza creditos porque transforma migracao em roteiro padronizado:

- reduz analise repetida de escopo;
- reaproveita a mesma lista de gates;
- padroniza arquivos bloqueados;
- separa pre-checks e post-checks;
- evita decidir rollback do zero;
- registra lote, ordem e dependencias;
- deixa claro quando parar.

Em vez de reconstruir o raciocinio para cada calculadora, o Codex pode preencher e executar um checklist previsivel em fase futura.

## Como Executar Uma Migracao Futura

Uma migracao futura devera seguir este roteiro:

1. copiar o modelo de `migration-template.json` para um plano especifico;
2. preencher ativo, origem, destino, risco e arquivos;
3. confirmar arquivos proibidos;
4. executar pre-checks;
5. capturar baseline;
6. preparar alteracao em escopo pequeno;
7. executar post-checks;
8. validar gates;
9. registrar aprovacao manual;
10. gerar relatorio;
11. manter rollback pronto ate a migracao ser considerada estavel.

Esse procedimento exige aprovacao futura explicita. A Fase 2 nao autoriza nenhuma migracao real.
