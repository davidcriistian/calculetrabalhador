# HOMOLOGATION_ADICIONAL_NOTURNO

Status: homologacao declarativa

Versao: 0.1.0

Criado em: 2026-07-09

## Objetivo

Homologar a representacao declarativa da Calculadora de Adicional Noturno dentro do Core, sem migrar, substituir ou conectar a calculadora publicada.

## Calculadora Atual

Pagina atual:

```text
/calculadora-adicional-noturno/
```

Arquivos operacionais usados pela pagina:

```text
calculadora-adicional-noturno/index.html
assets/js/tabelas-trabalhistas.js
data/tabelas-trabalhistas.json
```

A pagina calcula uma estimativa do adicional noturno com base em salario mensal, jornada mensal, horas noturnas e percentual aplicado.

## Entradas

- `salary`: salario mensal.
- `monthlyHours`: jornada mensal, com valor padrao 220.
- `nightHours`: horas noturnas informadas.
- `percent`: percentual de adicional; 20% como padrao ou valor personalizado.

## Saidas

- Valor da hora normal.
- Percentual aplicado.
- Adicional por hora.
- Horas noturnas informadas.
- Valor total estimado.
- Mensagem explicativa.

## Formula Atual

```text
normalHourValue = salary / monthlyHours
percentDecimal = percent / 100
additionalPerHour = normalHourValue * percentDecimal
totalValue = additionalPerHour * nightHours
```

## Regras Identificadas

- Salario deve ser maior que zero.
- Jornada mensal deve ser maior que zero.
- Horas noturnas devem ser numero finito e maior ou igual a zero.
- Percentual deve ser maior que zero.
- Percentual padrao e 20%.
- Percentual personalizado substitui o percentual padrao.
- Hora reduzida de 52min30s e explicada, mas nao aplicada automaticamente.
- INSS, IRRF, reflexos, hora extra noturna e medias nao entram no calculo atual.

## Dependencias

- Runtime atual: `data/tabelas-trabalhistas.json`.
- Helper atual: `assets/js/tabelas-trabalhistas.js`.
- Regra placeholder atual: `data/rules/adicional-noturno.json`.
- Compatibility Engine: `data/core/compatibility/tools-map.json`.
- Artigos relacionados no cluster de adicional noturno.

## Referencias Legais

- CLT, artigo 73, como referencia para adicional noturno urbano.
- Percentual minimo urbano de 20%.
- Hora noturna reduzida de 52 minutos e 30 segundos.

## Hipoteses

- A homologacao representa o comportamento da calculadora atual, nao uma folha de pagamento completa.
- O usuario informa horas noturnas ja apuradas.
- O percentual personalizado ja incorpora eventual regra coletiva.
- A hora reduzida nao e convertida automaticamente nesta versao.

## Casos Especiais

- Horas noturnas iguais a zero geram total zero e sao consideradas entrada valida.
- Valores decimais sao aceitos.
- Valores muito pequenos podem exibir `R$ 0,00` por formatacao monetaria.
- Percentuais decimais sao aceitos quando personalizados.

## Casos Invalidos

- Salario zero ou negativo.
- Jornada zero ou negativa.
- Horas noturnas negativas.
- Percentual zero, negativo ou ausente.

## Casos De Teste

Foram registrados 20 cenarios em:

```text
data/core/domains/adicional-noturno/examples/index.json
```

Cobertura:

- 9 casos normais;
- 3 casos extremos;
- 4 casos de borda;
- 4 casos invalidos.

## Equivalencia

Grau de equivalencia declarativa obtido: 100% sobre a formula identificada na calculadora publicada.

Escopo da equivalencia:

- entradas mapeadas;
- validacoes mapeadas;
- saidas mapeadas;
- formula mapeada;
- dependencias mapeadas;
- limitacoes mapeadas.

Nao foi executada migracao operacional.

## Riscos

- A calculadora atual documenta hora reduzida, mas nao aplica conversao automatica; uma migracao futura nao deve adicionar essa conversao sem mudar explicitamente o escopo.
- A pagina usa fallback legado caso o helper centralizado divirja; uma migracao futura precisa preservar comportamento ou fallback.
- A representacao atual nao cobre reflexos trabalhistas nem hora extra noturna.

## Resultado Da Homologacao

Resultado: `passed-with-notes`

A calculadora esta apta para futura migracao piloto, desde que a proxima fase preserve exatamente o comportamento atual e execute validacao operacional com a pagina publicada.

## Confirmacao

Nenhum HTML, CSS, JavaScript de producao, runtime, SEO, URL, sitemap, layout ou resultado apresentado ao usuario foi alterado nesta homologacao.
