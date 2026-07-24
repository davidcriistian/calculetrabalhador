# Sprint 5.3 — Catálogo Canônico de Fatos Jurídicos do Aviso-Prévio

## Resultado

Foi implementado o vocabulário factual canônico que servirá de entrada e de saída derivada para o Projection Engine.

- Fatos canônicos: **31**
- Fatos atualmente exigidos pelas regras: **18**
- Referências de regras sem definição: **0**
- Dependências factuais quebradas: **0**
- Projeções ativadas em produção: **0**
- `runtimeAuthority`: **false**
- `consumerReady`: **false**

## Organização

Os fatos foram separados por identidade, tipo, origem, temporalidade, evidência, privacidade, relações, validações semânticas, base jurídica e governança. Valores de casos concretos não são armazenados nesses registros; eles serão transportados por `fact-package`.

## Decisões relevantes

1. `termination_initiative` e `termination_cause` são fatos distintos.
2. Datas informadas e datas derivadas não se confundem.
3. `legal_reference_date` é derivada por política temporal e nunca pela data atual do sistema.
4. A comprovação de novo emprego exige evidência e revisão humana.
5. Fatos especiais, como falta grave, não geram conclusão automática sem regra específica.
6. Campos booleanos derivados permanecem rastreáveis aos fatos-base.

## Segurança

Todos os registros permanecem em `review`. A implementação não promove autoridade jurídica operacional e não modifica calculadoras existentes.
