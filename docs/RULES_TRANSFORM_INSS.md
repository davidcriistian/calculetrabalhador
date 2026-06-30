# Especificacao Tecnica: Transformador INSS

## 1. Objetivo

Este documento especifica o transformador futuro de:

```text
data/rules/inss.json
```

para:

```text
data/tabelas-trabalhistas.json
```

O objetivo do transformador sera gerar, de forma controlada e repetivel, os campos de INSS ja existentes em `data/tabelas-trabalhistas.json` a partir da estrutura mais detalhada de `data/rules/inss.json`.

Esta especificacao nao implementa o transformador, nao altera calculadoras e nao muda o contrato runtime atual.

## 2. Fonte Oficial

`data/rules/inss.json` deve ser tratado como a fonte oficial futura para regras de INSS porque possui uma estrutura dedicada ao dominio:

- versionamento por ano em `versions`;
- metadados de vigencia;
- moeda, localidade, pais e timezone;
- fontes oficiais e datas de consulta;
- salario minimo;
- teto previdenciario;
- tabela progressiva CLT;
- estruturas futuras para contribuinte individual e MEI;
- notas legais e notas de manutencao.

Atualizacoes anuais de INSS devem comecar em `data/rules/inss.json`. Esse arquivo deve concentrar a revisao normativa, a auditoria de fontes e a preparacao dos valores que poderao alimentar os agregadores do projeto.

Enquanto o arquivo estiver com `status: "draft"` em qualquer nivel relevante, os dados devem ser considerados preparados para revisao, nao automaticamente conectados a calculadoras de producao.

## 3. Camada De Compatibilidade

`data/tabelas-trabalhistas.json` deve continuar como camada de compatibilidade e agregador/runtime.

Esse arquivo ja reune varias bases usadas pelo projeto, incluindo INSS, IRRF, seguro-desemprego, FGTS, ferias, decimo terceiro, aviso previo, adicional noturno, insalubridade, horas extras, rescisao e comparativos. O contrato atual de `data/tabelas-trabalhistas.json` deve ser preservado para evitar regressao nas calculadoras e nos fluxos que ja dependem desse formato.

Nenhuma calculadora deve consumir `data/rules/inss.json` diretamente ainda. A migracao deve ser feita em fases: primeiro o transformador gera a camada agregada, depois testes de equivalencia numerica confirmam que o resultado preserva o comportamento atual, e somente entao qualquer conexao com calculadoras pode ser considerada.

## 4. Mapeamento Campo A Campo

O transformador deve ler a versao vigente de `data/rules/inss.json`, preferencialmente indicada por `currentYear`, e projetar os campos necessarios no contrato atual de `data/tabelas-trabalhistas.json`.

| Origem em `data/rules/inss.json` | Destino em `data/tabelas-trabalhistas.json` | Regra |
| --- | --- | --- |
| `versions[currentYear].minimumWage.value` | `salarioMinimo.valor` | Copiar o valor numerico sem arredondamento adicional. |
| `versions[currentYear].inssCeiling.value` | `inss.teto` | Copiar o valor numerico sem arredondamento adicional. |
| `versions[currentYear].clt.calculationMode` | `inss.metodo` | Converter o modo para o vocabulario de compatibilidade. `progressive` deve gerar `progressivo`. |
| `versions[currentYear].clt.progressiveTable[].max` | `inss.faixas[].ate` | Copiar cada limite superior mantendo a ordem da tabela progressiva. |
| `versions[currentYear].clt.progressiveTable[].rate` | `inss.faixas[].aliquota` | Copiar cada aliquota decimal mantendo a ordem da tabela progressiva. |
| Campo ainda inexistente em `rules` | `inss.faixas[].deducao` | Manter `0` como padrao enquanto nao existir equivalente em `data/rules/inss.json`. |

Exemplo conceitual do destino gerado:

```json
{
  "salarioMinimo": {
    "valor": 1621.0
  },
  "inss": {
    "teto": 8475.55,
    "metodo": "progressivo",
    "faixas": [
      {
        "ate": 1621.0,
        "aliquota": 0.075,
        "deducao": 0
      }
    ]
  }
}
```

O transformador nao deve remover campos existentes de `data/tabelas-trabalhistas.json`. Ele deve atualizar apenas os campos explicitamente mapeados quando a implementacao futura for autorizada.

## 5. Campos Ainda Sem Equivalente

Os seguintes campos de `data/tabelas-trabalhistas.json` nao devem ser derivados de `data/rules/inss.json` nesta etapa:

- `anoBase`;
- `ultimaRevisao`;
- `vigencia`;
- `moeda`;
- `salarioMinimo.ano`;
- `salarioMinimo.observacao`;
- `inss.ano`;
- todos os blocos nao relacionados a INSS, como `irrf`, `seguroDesemprego`, `fgts`, `saqueAniversario`, `ferias`, `decimoTerceiro`, `avisoPrevio`, `adicionalNoturno`, `insalubridade`, `horasExtras`, `fontes`, `rescisao` e `cltOuPj`.

Os seguintes campos existentes em `data/rules/inss.json` tambem nao devem ser projetados para `data/tabelas-trabalhistas.json` no primeiro transformador:

- `domain`;
- `status`;
- `currentYear`;
- metadados completos de `versions[year]`;
- `officialSourceName`;
- `officialSourceUrl`;
- `sourceUpdatedAt`;
- `consultedAt`;
- `notes`;
- `minimumWage.validFrom`;
- `minimumWage.sourceName`;
- `minimumWage.sourceUrl`;
- `minimumWage.description`;
- `inssCeiling.validFrom`;
- `inssCeiling.sourceName`;
- `inssCeiling.sourceUrl`;
- `inssCeiling.description`;
- `clt.appliesCeiling`;
- `progressiveTable[].order`;
- `progressiveTable[].min`;
- `progressiveTable[].description`;
- `individualContributor`;
- `mei`;
- `legalNotes`.

Esses campos podem ser usados em validacoes futuras, documentacao ou interfaces administrativas, mas nao fazem parte do contrato minimo de compatibilidade descrito aqui.

## 6. Autonomo E MEI No Futuro

`data/rules/inss.json` ja possui estruturas para contribuinte individual e MEI:

- `individualContributor.normal20`;
- `individualContributor.simplified11`;
- `mei.defaultInssRate`;
- `mei.cargoTransportInssRate`;
- `mei.types`.

Esses dados nao possuem equivalente direto no bloco `inss` atual de `data/tabelas-trabalhistas.json`. Por isso, nao devem ser conectados automaticamente no primeiro transformador.

Uma fase futura pode adicionar uma area de compatibilidade propria para autonomo e MEI em `data/tabelas-trabalhistas.json`, desde que:

- o contrato seja documentado antes;
- as calculadoras consumidoras sejam identificadas;
- os cenarios de contribuinte individual e MEI tenham testes de equivalencia;
- a migracao preserve os resultados numericos atuais;
- a estrutura nao misture faixas CLT progressivas com planos fixos de contribuicao.

## 7. Riscos De Migracao

Principais riscos:

- divergencia entre `progressive` e `progressivo`;
- mudanca de arredondamento em valores monetarios;
- perda de ordem nas faixas progressivas;
- interpretacao errada de limites `min` e `max`;
- aplicacao indevida de deducao diferente de `0`;
- conexao prematura de calculadoras a `data/rules/inss.json`;
- sobrescrita acidental de outros blocos de `data/tabelas-trabalhistas.json`;
- mistura de dados `draft` com runtime de producao;
- alteracao silenciosa do contrato consumido por calculadoras existentes;
- ausencia de testes numericos antes da troca de origem dos dados.

Qualquer migracao precisa passar por testes de equivalencia numerica antes de qualquer conexao com calculadoras.

## 8. Regras De Compatibilidade

O transformador futuro deve obedecer as seguintes regras:

- preservar o contrato atual de `data/tabelas-trabalhistas.json`;
- nao exigir que calculadoras conhecam `data/rules/inss.json`;
- tratar `data/tabelas-trabalhistas.json` como agregador/runtime;
- manter `deducao: 0` nas faixas de INSS enquanto nao houver campo equivalente em `rules`;
- manter a ordem de `progressiveTable`;
- falhar de forma explicita se `currentYear` nao existir em `versions`;
- falhar se campos obrigatorios do mapeamento estiverem ausentes;
- nao alterar blocos nao mapeados;
- nao normalizar valores monetarios de modo que altere resultado numerico;
- registrar diferencas antes de gravar qualquer arquivo em implementacao futura;
- impedir o uso automatico de dados com status inadequado, caso a politica de status seja definida antes da implementacao.

## 9. Plano De Implementacao Futura

Implementacao futura sugerida:

1. Criar testes de leitura para `data/rules/inss.json`.
2. Criar testes de contrato para o bloco `inss` de `data/tabelas-trabalhistas.json`.
3. Implementar uma funcao pura que receba o objeto de regras INSS e retorne apenas o patch de compatibilidade.
4. Validar o mapeamento de `calculationMode`, incluindo `progressive` para `progressivo`.
5. Validar que a quantidade e a ordem das faixas sejam preservadas.
6. Validar que `deducao` continue `0` enquanto nao existir em `rules`.
7. Criar modo dry-run para comparar origem e destino sem gravar.
8. Criar geracao controlada do bloco de compatibilidade.
9. Rodar testes de equivalencia numerica em todos os cenarios de INSS afetados.
10. Somente depois avaliar qualquer integracao com calculadoras.

O primeiro escopo de implementacao deve ser restrito ao INSS CLT progressivo. Autonomo e MEI devem ficar para uma fase propria.

## 10. Checklist De Validacao Antes De Conectar Calculadoras

Antes de qualquer calculadora consumir dados derivados do transformador, validar:

- `data/rules/inss.json` esta com fonte, vigencia e ano corretos;
- `currentYear` aponta para uma versao existente;
- `minimumWage.value` corresponde a `salarioMinimo.valor`;
- `inssCeiling.value` corresponde a `inss.teto`;
- `clt.calculationMode` foi convertido corretamente para `inss.metodo`;
- todas as faixas de `progressiveTable` foram preservadas em `inss.faixas`;
- cada `max` foi copiado para `ate`;
- cada `rate` foi copiado para `aliquota`;
- cada `deducao` permaneceu `0`;
- nenhuma calculadora consome `data/rules/inss.json` diretamente;
- `data/tabelas-trabalhistas.json` continua sendo o agregador/runtime;
- os blocos nao relacionados a INSS permaneceram inalterados;
- testes de equivalencia numerica passaram para CLT;
- testes de equivalencia numerica passaram para autonomo, se a fase futura incluir autonomo;
- testes de equivalencia numerica passaram para MEI, se a fase futura incluir MEI;
- `git diff --check` nao aponta problemas de whitespace;
- `git status --short` confirma que apenas os arquivos autorizados foram alterados na etapa correspondente.

Regra final: atualizacoes anuais devem comecar em `data/rules/inss.json`, mas o runtime atual deve continuar preservado em `data/tabelas-trabalhistas.json` ate que a migracao seja comprovada por testes.
