# Próximos passos — pós-Fase E

## Estado atual

O domínio piloto `aviso-previo` possui cobertura normativa técnica integral, com 14 fontes, 16 conceitos, 39 fatos, 15 regras e 17 projeções canônicas. A Fase E encerra a consolidação de consistência interna.

A plataforma permanece deliberadamente sem autoridade de produção:

- `runtimeAuthority=false`;
- `consumerReady=false`;
- revisão jurídica formal pendente;
- promoção de consumidores pendente.

## Sequência obrigatória

1. Executar auditoria final da Fase E e confirmar ausência de não conformidades abertas.
2. Realizar shadow validation controlada com casos reais anonimizados e comparação contra cálculo humano.
3. Submeter regras e projeções à revisão jurídica formal, registrando decisões em `governance/approvals.json`.
4. Reexecutar validadores, testes estruturais, runtime e casos declarados após cada decisão jurídica.
5. Somente após aprovação técnica e jurídica, avaliar promoção controlada de consumidores.
6. Expandir para outro domínio apenas por novo ciclo de ingestão, sem copiar conhecimento do domínio piloto.

## Critério de promoção

Nenhuma automação ou calculadora pode consumir o Central Brain com autoridade enquanto os gates `LEGAL_REVIEW` e `CONSUMER_PROMOTION` permanecerem pendentes.
