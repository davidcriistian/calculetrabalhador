# Sprint 5.6.4 — Knowledge Consistency & Legal Semantics

## Escopo
Implementa validação semântica executável, data jurídica canônica, fonte única da modalidade, cadeia probatória de novo emprego e dependências condicionais na consolidação.

## Controles adicionados
- Política semântica executável em `governance/semantic-policy.json`.
- Bloqueio de contradições entre causa, iniciativa, notificante e fatos derivados.
- `FACT-LEGAL-REFERENCE-DATE` materializado a partir de `factPackage.referenceDate` quando ausente e usado na duração.
- Modalidade calculada pela operação, sem concorrência com fato declarado.
- Novo emprego exige ocorrência e data da evidência.
- Falta grave e reconsideração acionam revisão humana.
- Consolidação aceita etapas juridicamente não aplicáveis sem falso `insufficient_facts`.

`runtimeAuthority` e `consumerReady` permanecem `false`.
