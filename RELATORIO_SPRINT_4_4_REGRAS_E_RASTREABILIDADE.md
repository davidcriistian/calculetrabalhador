# Relatório técnico — Sprint 4.4

## Resultado

A camada de regras do domínio Aviso-Prévio foi reconstruída como conhecimento jurídico estruturado, sem algoritmos de cálculo e sem autoridade de runtime.

## Entregas

- 6 regras canônicas completas, com 14 casos de teste jurídicos declarativos.
- Catálogo local validável e registro global sincronizado.
- Rastreabilidade fonte → regra, conceito → regra, regra → dependências, regra → consumidores e efeito → regra.
- Schema temporal ampliado para enunciado normativo, conceitos, fatos requeridos, efeitos, limites interpretativos, pinpoints e casos de teste.
- Validador específico do domínio.
- Manifest, maturidade e trilha de auditoria atualizados.

## Controles de segurança

- Todas as regras permanecem em `review`.
- `consumerReady` e `runtimeAuthority` permanecem `false`.
- Não há fórmulas nas regras.
- Promoção para `approved` depende de revisão jurídica humana formal.

## Correções jurídicas relevantes

- Novo emprego foi vinculado à Súmula 276 do TST, e não ao art. 488 da CLT.
- Proporcionalidade foi delimitada temporalmente pela Lei nº 12.506/2011 e Súmula 441.
- Redução de jornada foi limitada ao aviso trabalhado promovido pelo empregador.
- Integração temporal e anotação da data projetada foram separadas de reflexos financeiros interdomínios.

## Próxima etapa recomendada

Revisão jurídica formal das seis regras, promoção controlada das versões aprovadas e início da Sprint 5 — projeções canônicas.
