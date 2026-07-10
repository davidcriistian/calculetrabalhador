# CALCULATION_EQUIVALENCE

Status: protocolo oficial de equivalencia numerica

Versao: 1.0.0

Criado em: 2026-07-09

## Objetivo

Definir como provar que uma calculadora futura produz exatamente os mesmos resultados da calculadora atual antes de qualquer migracao.

## Casos De Teste

Cada calculadora deve ter casos simples, medios, complexos, extremos, invalidos, de borda, com valores zerados, com valores altos, com datas limite e com arredondamento sensivel.

## Entradas

Cada caso deve registrar todos os inputs usados pela calculadora atual:

- valores monetarios;
- datas;
- seletores;
- flags;
- quantidades;
- percentuais;
- dependentes;
- tipo de contrato ou desligamento, quando aplicavel.

## Saidas Esperadas

As saidas devem incluir resultado final, subtotais, descontos, bases de calculo, arredondamentos, mensagens e observacoes exibidas.

## Comparacao

A comparacao deve executar:

```text
resultado atual
vs
resultado futuro
```

Todo campo exibido ao usuario deve ser comparado.

## Tolerancia

A tolerancia padrao e:

- R$ 0,00 para valores monetarios finais;
- 0 dias para contagens;
- 0 pontos percentuais para aliquotas;
- diferenca textual zero para labels, quando o texto estiver no escopo da homologacao.

Qualquer tolerancia diferente precisa ser justificada no registro da homologacao.

## Criterios De Aprovacao

- Todos os casos passam.
- Nenhuma diferenca numerica sem justificativa.
- Arredondamentos equivalentes.
- Mensagens preservadas ou aprovadas.
- Runtime atual preservado como fallback.

## Casos Extremos

Devem testar limites maximos, tetos, pisos, datas antigas, datas futuras, salarios altos, salarios baixos e duracoes longas.

## Casos Invalidos

Devem testar campos vazios, valores negativos, datas incoerentes, formatos invalidos e combinacoes nao permitidas.

## Casos De Borda

Devem testar exatamente os pontos de troca de faixa, limite de dias, teto, piso, inicio de vigencia e fim de vigencia.

## Registros

Cada equivalencia deve registrar calculadora, versao atual, versao futura, data, responsavel, casos executados, divergencias e decisao final.

## Versionamento

Casos de equivalencia devem ser versionados por calculadora e por ano-base quando a regra depender de tabela anual.

## Resultado

Resultado permitido:

- `passed`
- `passed-with-notes`
- `failed`
- `blocked`
