# Arquitetura Oficial de Dados

## 1. Objetivo

Este documento define a arquitetura oficial de dados do projeto Calcule Trabalhador.

O projeto precisa estar preparado para suportar dezenas ou centenas de calculadoras no futuro. Como dados oficiais mudam com frequência, a manutenção precisa ser escalável, previsível e consistente.

Objetivos principais:

- Evitar atualização manual em dezenas de páginas.
- Centralizar informações sempre que possível.
- Reduzir divergências entre calculadoras.
- Facilitar revisão anual, legal e técnica.
- Tornar a manutenção mais rápida e segura.

Princípio oficial:

> Atualizar dados deve ser mais fácil que atualizar páginas.

## 2. Problema Atual

O principal risco atual é o uso de valores hardcoded espalhados por páginas diferentes.

Exemplo:

Calculadora A:

- INSS próprio.

Calculadora B:

- INSS próprio.

Calculadora C:

- INSS próprio.

Esse modelo cria riscos importantes:

- Divergência entre tabelas.
- Esquecimento de atualização em alguma página.
- Retrabalho manual.
- Dificuldade para validar mudanças.
- Maior chance de erro em cálculos oficiais.

Quanto mais calculadoras existirem, maior será o risco de inconsistência se cada página mantiver seus próprios dados isolados.

## 3. Arquitetura Desejada

A arquitetura desejada é centralizar dados oficiais em uma estrutura própria, separada das páginas e das regras visuais.

Estrutura conceitual:

```text
dados/
├─ inss.json
├─ irrf.json
├─ salario-minimo.json
├─ fgts.json
├─ seguro-desemprego.json
├─ mei.json
```

As ferramentas devem consumir dados centralizados sempre que isso for possível.

Benefícios:

- Atualização única.
- Consistência entre calculadoras.
- Menos erros.
- Menos retrabalho.
- Facilidade para auditar fontes.
- Melhor preparação para automação futura.

## 4. Tipos De Dados Compartilhados

Dados que podem ser compartilhados entre calculadoras:

- INSS.
- IRRF.
- Salário Mínimo.
- FGTS.
- Seguro-Desemprego.
- MEI.
- Tabelas trabalhistas.
- Benefícios oficiais.

Classificação por frequência:

### Anual

- INSS.
- IRRF, quando houver atualização anual.
- Salário Mínimo.
- Seguro-Desemprego.
- MEI, quando vinculado ao salário mínimo.

### Semestral

- Dados que dependam de políticas públicas, limites administrativos ou mudanças regulatórias intermediárias.
- Eventuais tabelas que possam ser revisadas dentro do ano.

### Eventual

- FGTS.
- Regras trabalhistas.
- Benefícios oficiais.
- Mudanças legais extraordinárias.

A frequência deve ser documentada em cada base de dados.

## 5. Estrutura Recomendada Dos Dados

Cada conjunto de dados deve ter estrutura clara, versionada e auditável.

Exemplo conceitual para `inss.json`:

- `ano`
- `data_vigencia`
- `faixas`
- `teto`
- `fonte`

Exemplo conceitual:

```json
{
  "ano": 2026,
  "versao": "2026.1",
  "data_vigencia": "2026-01-01",
  "data_consulta": "2026-01-10",
  "fonte": {
    "orgao": "Governo Federal",
    "url": "https://..."
  },
  "teto": 0,
  "faixas": []
}
```

Exemplo conceitual para `irrf.json`:

- `ano`
- `data_vigencia`
- `faixas`
- `deducoes`
- `fonte`

Exemplo conceitual:

```json
{
  "ano": 2026,
  "versao": "2026.1",
  "data_vigencia": "2026-01-01",
  "data_consulta": "2026-01-10",
  "fonte": {
    "orgao": "Receita Federal",
    "url": "https://..."
  },
  "deducoes": {},
  "faixas": []
}
```

Cada conjunto de dados deve possuir:

- Versão.
- Vigência.
- Fonte.
- Data da consulta.

Esses metadados são tão importantes quanto os valores numéricos.

## 6. Política De Versionamento

Existem duas estratégias possíveis.

### Opção 1: Arquivos Por Ano

Exemplo:

```text
inss-2026.json
inss-2027.json
```

Vantagens:

- Preserva histórico naturalmente.
- Facilita comparação entre anos.
- Reduz risco de sobrescrever dados antigos.

Desvantagens:

- Pode aumentar a quantidade de arquivos.
- Exige organização clara para consumo pela ferramenta.

### Opção 2: Arquivo Atual Com Versão Interna

Exemplo:

```text
inss.json
```

Com conteúdo:

```json
{
  "versao": 2026
}
```

Vantagens:

- Simples de consumir.
- Menos arquivos.
- Mais direto para calculadoras que usam apenas a regra vigente.

Desvantagens:

- Histórico pode se perder se não houver controle externo.
- Comparações entre anos ficam menos claras.

### Estratégia Preferida

A estratégia preferida é usar arquivos por ano para dados oficiais com histórico relevante.

Exemplo:

```text
dados/
├─ inss/
│  ├─ 2026.json
│  └─ 2027.json
├─ irrf/
│  ├─ 2026.json
│  └─ 2027.json
```

Essa abordagem preserva histórico, facilita auditoria e prepara o projeto para artigos e calculadoras que dependem de versões anuais.

Quando uma ferramenta precisar apenas da versão vigente, ela poderá apontar para o arquivo do ano atual ou para um índice futuro.

## 7. Relação Entre Ferramentas E Dados

Cada ferramenta deve declarar quais bases oficiais consome.

Tabela conceitual:

| Ferramenta | Dados Consumidos |
| --- | --- |
| Calculadora Salário Líquido | INSS, IRRF, Salário Mínimo |
| Calculadora Rescisão | FGTS, Salário Mínimo, regras trabalhistas |
| Calculadora Férias CLT | INSS, IRRF, regras trabalhistas |
| Calculadora 13º Salário | INSS, regras trabalhistas |
| Calculadora Horas Extras | Regras trabalhistas, jornada |
| Calculadora Seguro-Desemprego | Seguro-Desemprego, Salário Mínimo |
| Calculadora Saque-Aniversário FGTS | FGTS, tabela de alíquotas |

Exemplos:

Calculadora Salário Líquido:

- INSS.
- IRRF.
- Salário Mínimo.

Calculadora Rescisão:

- FGTS.
- Salário Mínimo.

Calculadora Seguro-Desemprego:

- Seguro-Desemprego.
- Salário Mínimo.

Essa relação deve ser documentada sempre que uma nova ferramenta for criada.

## 8. Política Para Novas Ferramentas

Toda nova ferramenta deve responder:

- Quais dados consome?
- Quais dados compartilha?
- Quais dados podem mudar?
- Qual frequência de atualização?

Antes de criar uma nova ferramenta, deve-se verificar:

- Se já existe uma base de dados compatível.
- Se a ferramenta pode reaproveitar constantes existentes.
- Se a regra muda anualmente, semestralmente ou eventualmente.
- Se há fonte oficial confiável.
- Se a ferramenta pode compartilhar dados com outras páginas.

Ferramentas novas não devem iniciar com dados duplicados se já houver base oficial reutilizável.

## 9. Política De Fontes Oficiais

Toda base deve registrar:

- Órgão responsável.
- URL.
- Data da consulta.
- Data de vigência.

Exemplos de órgãos e fontes:

- Governo Federal.
- Receita Federal.
- Caixa Econômica Federal.
- Ministério do Trabalho.

Regras:

- A fonte deve ser preferencialmente oficial.
- A URL deve ser registrada junto aos dados.
- A data da consulta deve ser informada.
- A vigência deve ser informada quando existir.
- Dados sem fonte oficial devem ser tratados como provisórios.

## 10. Roadmap De Evolução

### Fase Atual

- Dados dentro das páginas.
- Constantes e tabelas mantidas localmente.
- Atualização manual por arquivo.

### Fase Intermediária

- Constantes agrupadas.
- Tabelas mais organizadas dentro das páginas.
- Melhor documentação das fontes.
- Redução de duplicações óbvias.

### Fase Avançada

- Dados centralizados.
- Arquivos separados por tipo de dado e ano.
- Calculadoras consumindo bases compartilhadas.
- Histórico preservado.

### Fase Futura

- Atualização semiautomática.
- Validação automatizada.
- Comparação entre versões.
- Alertas para dados vencidos.

## 11. Benefícios Esperados

A arquitetura de dados centralizada deve trazer ganhos em:

- Manutenção.
- Velocidade.
- Consistência.
- Escalabilidade.
- Redução de erros.

Benefícios práticos:

- Atualizar uma tabela em um só lugar.
- Evitar divergência entre calculadoras.
- Facilitar auditoria.
- Facilitar testes.
- Facilitar criação de novas ferramentas.
- Reduzir o custo de manutenção anual.

## 12. Critérios Para Refatoração

Refatorar quando:

- A mesma tabela aparece em muitas páginas.
- Uma atualização exige muitos arquivos.
- O risco de inconsistência aumenta.
- Há dificuldade para encontrar a fonte de um dado.
- Há divergência entre cálculos relacionados.
- Uma nova ferramenta precisa de dados já usados por outra ferramenta.

Refatorações de dados devem ser feitas em fases, com validação dos cálculos antes e depois.

## 13. Integração Com UPDATE_POLICY

Este documento trabalha junto com:

- `docs/UPDATE_POLICY.md`

A `UPDATE_POLICY.md` define como o projeto deve ser atualizado e mantido.

A `DATA_ARCHITECTURE.md` define como os dados devem ser organizados para que essa manutenção seja escalável.

Em conjunto:

- A política de atualização define o processo.
- A arquitetura de dados define a estrutura.
- As calculadoras consomem dados organizados.
- A manutenção fica mais segura e previsível.

Quando uma regra oficial mudar, o fluxo ideal será:

1. Confirmar a fonte oficial.
2. Atualizar a documentação.
3. Atualizar a base de dados.
4. Validar as calculadoras afetadas.
5. Registrar a mudança.

## 14. Regra Final

Toda nova ferramenta deve ser criada pensando:

- Em reutilização.
- Em centralização.
- Em manutenção futura.

Princípio final:

> Quanto mais o projeto cresce, menos cada atualização deve depender de alterações manuais.

O Calcule Trabalhador deve evoluir para uma arquitetura em que dados oficiais sejam fáceis de revisar, atualizar, reutilizar e auditar.
