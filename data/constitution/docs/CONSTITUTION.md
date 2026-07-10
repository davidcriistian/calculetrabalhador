# Constitution

## Objetivo

A Constitution Layer define os principios permanentes do Calcule Trabalhador.

Ela responde:

```text
Como o projeto pensa.
```

## Constitution Vs Strategy

Constitution e permanente e muda muito raramente.

Strategy e evolutiva e pode mudar continuamente sem alterar a Constitution.

## Principios

Principios oficiais incluem:

- Core e a unica fonte de conhecimento;
- POS e a unica camada operacional;
- Blueprint System apenas constroi ativos;
- configuracao acima de codigo;
- fonte unica da verdade;
- baixo acoplamento;
- alta coesao;
- escalabilidade;
- repetibilidade;
- seguranca;
- toda alteracao passa por Testing;
- toda alteracao passa por Validation;
- rollback obrigatorio;
- nenhuma regra juridica pertence ao Blueprint;
- nenhuma regra operacional pertence ao Core;
- toda decisao operacional deve respeitar a Constitution.

## Arquitetura

A Constitution define camadas oficiais, dependencias permitidas, dependencias proibidas, fluxos, responsabilidades e limites.

## Governance

Governance define ownership, versionamento, approval, history, audit e responsabilidades.

## Architecture Evolution Policy

Architecture Evolution Policy e uma regra permanente da Constitution.

Principio fundamental:

```text
A arquitetura evolui por reutilizacao antes de expansao.
```

Toda nova necessidade deve seguir esta ordem:

1. Reutilizacao: verificar se Constitution, Strategy, Core, POS, Registry, Blueprint System, PAM, Gold Standard, Reference System, Operation System, Manifest System, Migration, Testing, Validation ou Publishing ja atendem a necessidade.
2. Extensao: se atender parcialmente, estender a estrutura existente preservando sua responsabilidade.
3. Justificativa: se reutilizacao e extensao forem insuficientes, documentar problema, lacuna, responsabilidades novas, impacto, alternativas descartadas, camada afetada e mecanismo contra duplicacao.
4. Auditoria: verificar sobreposicao, duplicacao, conflito, dependencia circular, quebra do Architecture Freeze e impacto operacional.
5. Aprovacao: permitir nova camada somente com necessidade comprovada, auditoria aprovada, responsabilidade exclusiva, sem duplicacao, sem conflito e compatibilidade com Constitution e Platform Architecture.

Regras obrigatorias:

- nao criar nova camada apenas para organizar arquivos;
- nao criar nova Engine por conveniencia;
- nao duplicar responsabilidades;
- nao criar multiplas fontes de verdade;
- nao quebrar o Domain Relationship Model;
- nao redefinir ownership de outra camada;
- nao alterar responsabilidades do PAM.

Estado oficial:

```text
Architecture Foundation: FROZEN
Novas modelagens transversais: BLOCKED
Novas camadas: EXCEPTION ONLY
Capacidades operacionais: ACTIVE DEVELOPMENT
```

Prioridade futura: create, update, expand, validate, publish, rollback, automation e admin.

## Quality

Quality define Testing obrigatorio, Validation obrigatoria, Rollback obrigatorio, Versionamento obrigatorio e Historico obrigatorio.

## Estado Atual

Esta camada e declarativa, `not-consumed`, e nao altera producao.
