# Sprint 5.6.1 — Bloco 2: Cobertura completa do aviso-prévio

## Objetivo
Fechar as lacunas executáveis identificadas na auditoria da camada Knowledge, sem promover o Brain para autoridade de produção.

## Correções implementadas

1. **Pedido de demissão**
   - `PROJ-AP-001` passou a reconhecer tanto dispensa sem justa causa quanto pedido de demissão.
   - O tipo contratual, a causa, a iniciativa e a parte notificante passaram a ser fatos declarados da incidência.
   - Contrato a termo sem cláusula assecuratória retorna `not_applicable`.
   - Causas especiais retornam revisão humana.

2. **Ausência de concessão do aviso**
   - `PROJ-AP-002` não depende mais de `FACT-NOTICE-GRANTED = true` para ser executada.
   - Ausência de aviso patronal materializa modalidade indenizada.
   - Aviso não cumprido pelo empregado materializa `employee_notice_unworked`, preservando a diferença jurídica entre não incidência e descumprimento.

3. **Casos anteriores à Lei nº 12.506/2011**
   - Criada versão histórica de `RULE-AP-002` para o piso de 30 dias entre 05/10/1988 e 12/10/2011.
   - Criada operação genérica `effective-bounded-linear-duration`.
   - Antes de 13/10/2011, o resultado permanece em 30 dias; depois dessa data, a proporcionalidade depende do beneficiário e dos anos completos.

4. **Redução de jornada sem opção informada**
   - `PROJ-AP-006` passou a materializar `not_selected` quando o direito existe, mas a opção ainda não foi informada.

5. **Circularidade temporal**
   - `PROJ-AP-004` deixou de exigir `FACT-TERMINATION-DATE` para calcular o próprio término projetado.
   - A data da comunicação é agora o marco suficiente da operação temporal.

6. **Semântica de condições e exceções**
   - O avaliador passou a suportar corretamente `in`/`not-in` com o campo `values`.
   - A avaliação de grupos usa lógica ternária com curto-circuito: um predicado falso em grupo `all` impede que fatos irrelevantes ausentes transformem o resultado em insuficiência.
   - O executor passou a tratar resultados de exceção `not-applicable` e `insufficient-facts` declarativamente.

## Testes adicionados

- pedido de demissão ativa incidência;
- empregado é identificado como notificante;
- aviso patronal não concedido gera modalidade indenizada;
- aviso do empregado não cumprido não vira “não aplicável”;
- rescisão anterior a 2011 preserva 30 dias;
- redução sem opção retorna `not_selected`;
- projeção temporal não exige data final circular;
- contrato a termo sem cláusula assecuratória não aplica o regime geral.

## Validação executada

- 84 testes estruturais aprovados;
- 31 testes do runtime aprovados;
- 6 regras validadas;
- 33 fatos validados;
- 196 JSONs verificados;
- 8 projeções canônicas validadas;
- 0 erros de validação.

## Limites mantidos

- `runtimeAuthority = false`;
- `consumerReady = false`;
- regras e projeções permanecem em `review`;
- oito inventários legados vazios permanecem isolados e não promovidos.

## Conclusão
As seis lacunas encontradas na auditoria desta etapa foram corrigidas e cobertas por testes de regressão. O domínio ainda não está aprovado para produção; a auditoria deve continuar nas camadas de schemas, contratos, governança e validações semânticas.
