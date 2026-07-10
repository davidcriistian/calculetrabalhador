# HOMOLOGATION_AVISO_PREVIO

Status: homologacao declarativa

Versao: 0.2.0

Criado em: 2026-07-09

## Objetivo

Homologar a representacao declarativa da Calculadora de Aviso Previo dentro do Core, sem migrar, substituir ou conectar a calculadora publicada.

## Calculadora Atual

Pagina atual:

```text
/calculadora-aviso-previo/
```

Arquivos operacionais usados pela pagina:

```text
calculadora-aviso-previo/index.html
assets/js/tabelas-trabalhistas.js
data/tabelas-trabalhistas.json
```

A pagina simula dias e valor estimado do aviso previo trabalhado, indenizado ou descontado no pedido de demissao.

## Entradas

- `salary`: salario bruto mensal.
- `startDate`: data de admissao.
- `endDate`: data de desligamento.
- `noticeType`: tipo de aviso, podendo ser `indenizado`, `trabalhado` ou `desconto`.

## Saidas

- Tempo de empresa.
- Anos completos.
- Dias base.
- Dias adicionais.
- Dias totais de aviso.
- Valor diario.
- Valor estimado.
- Nota dinamica por tipo de aviso.

## Formulas

```text
fullYears = anos completos entre admissao e desligamento
baseDays = 30
rawAdditionalDays = fullYears * 3
totalDays = min(90, baseDays + rawAdditionalDays)
additionalDays = totalDays - baseDays
dailyValue = salary / 30
estimatedValue = totalDays * dailyValue
```

## Regras Identificadas

- Salario deve ser maior que zero.
- Data de admissao e desligamento devem ser validas.
- Data de desligamento nao pode ser anterior a data de admissao.
- Aviso com menos de um ano completo mantem 30 dias.
- Cada ano completo adiciona 3 dias.
- O total e limitado a 90 dias.
- O valor diario e sempre salario dividido por 30.
- O tipo `indenizado` apresenta valor como verba estimada.
- O tipo `trabalhado` apresenta dias a cumprir e valor como referencia salarial.
- O tipo `desconto` apresenta valor como possivel desconto.

## Dependencias

- Runtime atual: `data/tabelas-trabalhistas.json`.
- Helper atual: `assets/js/tabelas-trabalhistas.js`.
- Regra placeholder atual: `data/rules/aviso-previo.json`.
- Compatibility Engine: `data/core/compatibility/rules-map.json` e `tools-map.json`.
- Artigos relacionados no cluster de aviso previo.

## Hipoteses

- A homologacao representa o comportamento da calculadora atual, nao uma rescisao completa.
- Salario mensal informado e a base usada para `salary / 30`.
- A pagina nao calcula medias variaveis, reflexos, FGTS, INSS ou IRRF.
- Datas sao interpretadas no padrao do input HTML `date`.

## Limitacoes

- Nao calcula impacto do aviso projetado em outras verbas.
- Nao calcula convencao coletiva.
- Nao calcula dispensa do cumprimento no pedido de demissao.
- Nao diferencia regras especificas por modalidade de desligamento alem da nota exibida.
- Para `desconto`, a calculadora atual usa os mesmos dias proporcionais no valor estimado.

## Casos De Teste

Foram registrados 20 cenarios em:

```text
data/core/domains/aviso-previo/examples/index.json
```

Cobertura:

- 6 casos normais;
- 4 casos extremos;
- 5 casos de borda;
- 5 casos invalidos;
- tipos `indenizado`, `trabalhado` e `desconto`.

## Referencias Legais

- Lei 12.506/2011, como referencia para aviso previo proporcional.
- CLT, como referencia geral de aviso previo.

## Equivalencia

Grau de equivalencia declarativa obtido: 100% sobre a formula, validacoes e saidas identificadas na calculadora publicada.

Escopo da equivalencia:

- entradas mapeadas;
- saidas mapeadas;
- formulas mapeadas;
- validacoes mapeadas;
- dependencias mapeadas;
- casos de teste executados.

Resultado: `passed-with-notes`.

## Riscos Para Migracao Futura

- A migracao nao deve alterar a regra de anos completos.
- A migracao nao deve trocar o divisor diario de 30.
- A migracao nao deve aplicar desconto fixo de 30 dias no tipo `desconto`, porque a pagina atual estima pelo total proporcional.
- A migracao deve preservar fallback caso o helper centralizado divirja.
- Qualquer inclusao de reflexos, medias ou verbas rescisorias mudaria o escopo funcional.

## Aptidao

A calculadora esta apta para futura migracao piloto, desde que a proxima fase preserve exatamente o comportamento atual e execute validacao operacional com a pagina publicada.

## Confirmacao

Nenhum HTML, CSS, JavaScript de producao, runtime, SEO, URL, sitemap, layout ou resultado apresentado ao usuario foi alterado nesta homologacao.
