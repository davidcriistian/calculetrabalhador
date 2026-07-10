# SHADOW_MODE

Status: framework ativo para pilotos controlados

Versao: 0.2.0

Criado em: 2026-07-09

Atualizado em: 2026-07-09

## Objetivo

Shadow Mode compara a calculadora publicada com a representacao homologada no Core sem alterar o resultado apresentado ao usuario.

O usuario continua recebendo exclusivamente o resultado do runtime atual.

As fronteiras oficiais entre camadas estao em `/docs/PLATFORM_ARCHITECTURE.md`. Este documento detalha apenas Shadow Mode e nao redefine a autoridade geral da plataforma.

## Papel Arquitetural

Shadow e oficialmente uma Bridge Layer.

Ele conecta:

```text
Core <-> POS Testing
```

para produzir evidencia tecnica de comparacao e equivalencia.

Shadow e uma camada temporaria de evidencia tecnica e baseline. Ele serve para comparar arquitetura legada e nova, registrar equivalencia, fornecer evidencia para Testing e Validation e apoiar migracoes controladas.

Shadow nao e conhecimento puro, nao e runtime, nao e fonte de resultado para usuario, nao e fonte juridica, nao e catalogo, nao e camada permanente de execucao e nao altera producao. Ele tambem nao substitui Testing nem Validation.

## Fluxo

```text
1. Runtime atual calcula o resultado.
2. Core calcula o mesmo cenario em paralelo na camada Shadow.
3. Framework compara runtime x Core.
4. Se forem iguais, registra status equal.
5. Se houver diferenca, registra status divergent.
6. Se o Core falhar, registra erro tecnico.
7. Em qualquer situacao, o resultado entregue ao usuario continua sendo o do runtime atual.
```

## Arquitetura Reutilizavel

```text
data/core/shadow/
  index.json
  registry.json
  calculators/
    adicional-noturno/
    aviso-previo/
  comparisons/
    aviso-previo/
  logs/
    aviso-previo.json
```

O piloto legado de Adicional Noturno permanece em:

```text
data/core/shadow/adicional-noturno/
```

Um adaptador tambem foi criado em:

```text
data/core/shadow/calculators/adicional-noturno/index.json
```

## Comparacao

Cada calculadora define seus campos comparaveis em:

```text
data/core/shadow/calculators/[id]/index.json
```

Cada execucao registra:

```text
id
calculadora
versao
input
resultadoRuntime
resultadoCore
diferenca
status
timestamp
```

## Fallback

Fallback e obrigatorio.

```text
Core falha -> runtime atual responde
Divergencia -> runtime atual responde
Validacao incompleta -> runtime atual responde
```

Nenhum fluxo visual deve depender do Core durante Shadow Mode.

## Como Registrar Nova Calculadora

1. Criar ou confirmar o dominio homologado em `data/core/domains/[dominio]/`.
2. Criar configuracao em `data/core/shadow/calculators/[dominio]/index.json`.
3. Registrar a calculadora em `data/core/shadow/registry.json`.
4. Criar comparacoes em `data/core/shadow/comparisons/[dominio]/index.json`.
5. Criar log resumido em `data/core/shadow/logs/[dominio].json`.
6. Criar validador em `scripts/validate-shadow-[dominio].js`.
7. Executar validacoes JSON, governance, transform-rules e o validador Shadow.

## Como Homologar

- Cobrir casos normais.
- Cobrir casos extremos.
- Cobrir casos invalidos.
- Cobrir casos de borda.
- Cobrir todas as modalidades da calculadora.
- Comparar todos os campos numericos relevantes.
- Preservar status e mensagens de erro quando o runtime atual interrompe o calculo.
- Registrar divergencias sem corrigir automaticamente.

## Como Interpretar Divergencias

- `equal`: runtime e Core estao equivalentes dentro da tolerancia.
- `divergent`: existe diferenca numerica ou estrutural.
- `core-error`: a regra Core falhou; runtime atual permanece como fonte.
- `legacy-error`: a simulacao do runtime antigo falhou; nao migrar.
- `invalid-equal`: ambos rejeitaram a entrada do mesmo modo.

Divergencia nao deve acionar correcao automatica nem substituicao do resultado.

## Como Desligar Shadow

Shadow Mode so pode ser desligado para uma calculadora quando:

- houver varias rodadas com 100% de equivalencia;
- os cenarios cobrirem casos reais, extremos, invalidos e bordas;
- houver revisao tecnica dos registros;
- houver plano de rollback;
- houver aprovacao explicita para migracao definitiva.

## Sunset Oficial

Shadow deve entrar em sunset por ativo quando:

- equivalencia aprovada;
- Testing aprovado;
- Validation aprovado;
- migracao concluida;
- periodo de observacao encerrado;
- rollback validado;
- aprovacao manual registrada.

O sunset nao apaga historico automaticamente. Evidencias e logs devem permanecer auditaveis conforme a politica de versionamento da plataforma.

## Criterios Para Migracao Definitiva

- Zero divergencias pendentes.
- Performance sem impacto perceptivel.
- Nenhuma alteracao de SEO, URL, JSON-LD, sitemap, layout ou UX.
- Teste visual aprovado.
- Teste de equivalencia numerica aprovado.
- Aprovacao explicita para permitir que o Core substitua o runtime antigo em Sprint futura.

## Confirmacao

Shadow Mode Framework nao substitui calculadoras publicadas. O resultado apresentado ao usuario continua vindo exclusivamente do runtime atual.
