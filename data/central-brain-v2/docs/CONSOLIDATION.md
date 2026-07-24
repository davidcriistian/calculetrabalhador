# Consolidação do Central Brain v2

Versão da entrega: `2.6.0-sprint5.6.7-phaseD`.

Esta consolidação encerra tecnicamente a Fase D e sincroniza o estado canônico do pacote após as correções das Fases B e C. A consolidação não concede autoridade jurídica ou de produção.

## Divisões permanentes

1. `schemas/` — formatos executáveis.
2. `contracts/` — obrigações entre Brain e consumidores.
3. `registries/` — catálogos canônicos e inventários.
4. `engines/` — seleção temporal, projeção, carregamento, governança e consulta.
5. `governance/` — identidade, maturidade, tempo, aprovação e mudança.
6. `validation/` — schemas, integridade referencial, fingerprints e políticas.
7. `audit/` — eventos append-only e manifesto SHA-256.
8. `migration/` — ponte controlada do legado.
9. `tests/` — testes estruturais e de runtime.
10. `knowledge/` — fontes, conceitos, fatos, regras, projeções e federação.

## Estado consolidado

O domínio piloto `aviso-previo` contém 14 fontes, 16 conceitos, 39 fatos, 15 regras e 17 projeções canônicas. A baseline normativa registra 13 itens internos ou federados com cobertura técnica integral e uma fronteira de escopo justificada.

`legalContentStatus: VALIDATED` significa somente que o conteúdo satisfaz os critérios técnicos da baseline e dos validadores. Permanecem `runtimeAuthority: false`, `consumerReady: false` e `legalApprovalStatus: UNDER_LEGAL_REVIEW`.

## Fases incorporadas

- Fase A: correções estruturais e classificação formal do legado.
- Fase B: correção de fatos órfãos, rastreabilidade, snapshots e cobertura executável.
- Fase C: baseline normativa, temporalidade correta do art. 484-A, política de granularidade e cobertura federada da Súmula TST nº 305.
- Fase D: sincronização de manifesto, registros, migração, versão, auditoria e documentação.

## Artefatos jurídicos adicionados na Fase C

- `RULE-AP-015` — emissão do requisito federado de incidência de FGTS sobre aviso-prévio.
- `PROJ-AP-017` — projeção federada correspondente.
- `knowledge/domains/aviso-previo/governance/normative-baseline.json` — escopo, métricas e política de sobreposição normativa.

## Política de granularidade normativa

A unidade de cobertura é o efeito normativo. O registro específico é preferido para citação pontual; o registro agregado é mantido para regras gerais. A sobreposição entre `SRC-BR-CLT-ART487-491` e `SRC-BR-CLT-ART489-491` não gera dupla contagem.

## Legado

Os oito arquivos legados vazios permanecem classificados como `PLANNED`, com promoção bloqueada. Essa classificação é uma decisão de inventário, não uma implementação jurídica.

## Pendências externas à consolidação técnica

- revisão jurídica formal;
- shadow validation do domínio piloto;
- ativação de produção por decisão explícita de governança.
