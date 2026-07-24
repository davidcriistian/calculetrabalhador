# Sprint 5.6.1 — Correção dos pontos cegos da validação

## Resultado simples

Os quatro problemas encontrados na continuação da auditoria foram corrigidos no código real.

1. O teste de fatos agora reconhece os 33 fatos existentes.
2. O validador principal deixou de informar `projections: 0`: ele carrega e valida as oito projeções canônicas.
3. A `PROJ-AP-004` agora declara formalmente o fato `FACT-TERMINATION-DATE`, usado em sua ativação.
4. Os sete READMEs que diziam que não havia conteúdo foram atualizados.

## Proteções adicionadas

O validador agora também detecta projeção com fingerprint divergente, caminho quebrado, domínio inexistente, dependência inexistente, catálogo fora de sincronia e fato usado em condição sem estar declarado como entrada.

## Validação executada

- 84 testes estruturais aprovados;
- 23 testes do runtime aprovados;
- 33 fatos validados;
- 6 regras e 14 casos de teste validados;
- 8 projeções canônicas validadas;
- 190 arquivos JSON verificados;
- 0 erros.

Permanece apenas a advertência já conhecida sobre oito inventários legados vazios. Eles continuam isolados e sem autoridade jurídica.

## Estado

- `runtimeAuthority=false`
- `consumerReady=false`

A correção melhora a confiabilidade da auditoria, mas não promove o Brain para produção.
