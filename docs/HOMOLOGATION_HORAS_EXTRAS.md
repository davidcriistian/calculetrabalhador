# HOMOLOGATION_HORAS_EXTRAS

Status: homologacao declarativa

Versao: 0.1.0

Criado em: 2026-07-09

## Objetivo

Homologar a representacao declarativa da Calculadora de Horas Extras dentro do Core, sem migrar, substituir ou conectar a calculadora publicada.

## Calculadora Atual

Pagina atual:

```text
/calculadora-horas-extras-clt/
```

Arquivos operacionais usados pela pagina:

```text
calculadora-horas-extras-clt/index.html
assets/js/tabelas-trabalhistas.js
data/tabelas-trabalhistas.json
```

A pagina calcula o valor estimado de horas extras a partir do salario mensal bruto, da jornada semanal e da quantidade de horas extras 50% e 100%.

## Entradas

- `salarioBruto`: salario mensal bruto.
- `jornadaTipo`: `44`, `40` ou `custom`.
- `jornadaCustom`: jornada semanal personalizada, usada somente quando `jornadaTipo` e `custom`.
- `horas50`: quantidade de horas extras com adicional de 50%.
- `horas100`: quantidade de horas extras com adicional de 100%.

## Saidas

- Divisor mensal.
- Valor da hora normal.
- Valor da hora extra 50%.
- Valor da hora extra 100%.
- Subtotal das horas 50%.
- Subtotal das horas 100%.
- Total de horas extras.
- Total estimado a receber.
- Jornada exibida no resultado.

## Formulas

```text
divisor = 220, quando jornadaTipo = 44
divisor = 200, quando jornadaTipo = 40
divisor = jornadaCustom * 4.33 * 1.2, quando jornadaTipo = custom

valorHoraNormal = salarioBruto / divisor
valorHoraExtra50 = valorHoraNormal * 1.5
valorHoraExtra100 = valorHoraNormal * 2
subtotal50 = horas50 * valorHoraExtra50
subtotal100 = horas100 * valorHoraExtra100
totalHoras = horas50 + horas100
totalReceber = subtotal50 + subtotal100
```

## Regras Identificadas

- Salario mensal bruto deve ser maior que zero.
- Jornada 44h usa divisor 220.
- Jornada 40h usa divisor 200.
- Jornada personalizada exige `jornadaCustom` maior que zero.
- Jornada personalizada usa `jornadaCustom * 4.33 * 1.2`.
- Horas 50% nao podem ser negativas.
- Horas 100% nao podem ser negativas.
- Campos de horas vazios equivalem a zero.
- Hora extra 50% usa multiplicador 1.5.
- Hora extra 100% usa multiplicador 2.
- A pagina calcula primeiro pela formula local.
- O helper centralizado e usado apenas se os valores principais forem equivalentes dentro de tolerancia 0.01.
- Se o helper centralizado divergir ou falhar, a pagina mantem o calculo local.

## Validacoes

```text
salarioBruto ausente ou <= 0 -> alerta e calculo interrompido
jornadaTipo custom com jornadaCustom ausente ou <= 0 -> alerta e calculo interrompido
horas50 < 0 ou horas100 < 0 -> alerta e calculo interrompido
```

Mensagens atuais representadas:

```text
Informe um salario mensal bruto valido.
Informe uma jornada semanal personalizada valida.
As quantidades de horas extras nao podem ser negativas.
```

## Excecoes E Comportamentos De Borda

- Quantidade zero de horas e aceita e gera total a receber igual a zero.
- Horas fracionadas sao aceitas.
- Salarios muito baixos ou muito altos sao aceitos se forem maiores que zero.
- Jornada personalizada decimal e aceita se for maior que zero.
- Nao ha validacao de teto de salario, limite maximo de horas ou limite maximo de jornada personalizada na calculadora atual.

## Hipoteses

- A homologacao representa o comportamento da calculadora publicada, nao uma folha de pagamento completa.
- A pagina usa aritmetica numerica JavaScript sem arredondamento interno antes da exibicao.
- A exibicao monetaria usa formatacao BRL.
- A exibicao de numeros em horas usa duas casas decimais em textos visiveis.

## Limitacoes

- Nao calcula DSR sobre horas extras.
- Nao calcula reflexos em ferias, decimo terceiro ou FGTS.
- Nao calcula INSS ou IRRF.
- Nao calcula banco de horas.
- Nao identifica calendario real de domingos e feriados.
- Nao aplica convencao coletiva.
- Nao permite percentual personalizado informado pelo usuario.

## Referencias Legais

- Constituicao Federal, art. 7, XVI, como referencia para adicional minimo de 50%.
- CLT, art. 59, como referencia geral sobre duracao do trabalho e horas suplementares.

## Dependencias

- Runtime atual: `data/tabelas-trabalhistas.json`.
- Helper atual: `assets/js/tabelas-trabalhistas.js`.
- Pagina atual: `calculadora-horas-extras-clt/index.html`.
- Compatibility Engine: `data/core/compatibility/tools-map.json`.
- Dominio pai: `clt`.

## Casos De Teste

Foram registrados 25 cenarios em:

```text
data/core/domains/horas-extras/examples/index.json
```

Cobertura:

- 9 casos normais;
- 4 casos extremos;
- 5 casos de borda;
- 7 casos invalidos;
- jornada 44h;
- jornada 40h;
- jornada personalizada;
- horas 50%;
- horas 100%;
- valores fracionados;
- quantidade zero;
- quantidade negativa;
- entradas invalidas.

## Equivalencia

Grau de equivalencia declarativa obtido: 100% sobre a formula, validacoes, dependencias, percentuais e saidas identificadas na calculadora publicada.

Escopo da equivalencia:

- entradas mapeadas;
- saidas mapeadas;
- formulas mapeadas;
- validacoes mapeadas;
- dependencias mapeadas;
- percentuais mapeados;
- casos de teste executados.

Resultado: `passed-with-notes`.

## Riscos Para Migracao Futura

- A migracao nao deve substituir o divisor personalizado `jornadaCustom * 4.33 * 1.2`.
- A migracao nao deve aplicar arredondamento antes da exibicao.
- A migracao nao deve transformar campos vazios de horas em erro, pois hoje eles equivalem a zero.
- A migracao nao deve adicionar percentuais personalizados sem mudar explicitamente o escopo funcional.
- A migracao deve preservar o fallback local se o helper centralizado divergir.
- Qualquer inclusao de DSR, reflexos, banco de horas ou convencao coletiva alteraria o comportamento publicado.

## Aptidao

A calculadora esta apta para futura migracao piloto, desde que a proxima fase preserve exatamente o comportamento atual e execute validacao operacional com a pagina publicada.

## Confirmacao

Nenhum HTML, CSS, JavaScript de producao, runtime, SEO, URL, sitemap, layout ou resultado apresentado ao usuario foi alterado nesta homologacao.
