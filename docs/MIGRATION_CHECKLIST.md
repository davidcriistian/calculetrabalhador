# MIGRATION_CHECKLIST

Status: checklist oficial para migracoes futuras

Versao: 1.0.0

Criado em: 2026-07-09

## Objetivo

Definir os itens minimos obrigatorios antes de qualquer migracao da arquitetura atual para o Core.

## Checklist

- [ ] Core preparado.
- [ ] Dominio registrado em `data/core/registry/domains.json`.
- [ ] Dominio possui legislation, rules, concepts, references, examples, metadata, history e tables.
- [ ] Compatibility validada.
- [ ] Rules, tables, tools e articles afetados mapeados.
- [ ] Legislation cadastrada quando aplicavel.
- [ ] Update aprovado.
- [ ] Homologation Protocol seguido.
- [ ] Calculation Equivalence validada.
- [ ] Runtime preservado.
- [ ] Fallback definido.
- [ ] SEO preservado.
- [ ] URLs preservadas.
- [ ] Schema e JSON-LD preservados.
- [ ] Performance preservada.
- [ ] Links preservados.
- [ ] Conteudo preservado ou aprovado editorialmente.
- [ ] Mobile validado.
- [ ] Desktop validado.
- [ ] Validacao final registrada.

## Bloqueios Automaticos

A migracao deve ser bloqueada se houver divergencia numerica sem justificativa, alteracao de URL, alteracao de SEO sem aprovacao, runtime sem fallback, dependencias incompletas ou homologacao sem registro.

## Resultado Esperado

Toda migracao futura deve terminar como:

- `approved`
- `approved-with-notes`
- `rejected`
- `blocked`
