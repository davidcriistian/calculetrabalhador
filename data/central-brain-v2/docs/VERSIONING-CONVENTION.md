# Convenção de versionamento dos índices

- `packageVersion`: versão do pacote consolidado que contém o índice. Valor atual: `2.7.0-sprint5.6.7-phaseE`.
- `componentVersion`: versão independente de um componente executável.
- `catalogVersion`: versão independente da estrutura de um catálogo.

O campo genérico `version` permanece apenas no índice raiz por compatibilidade com o schema público. Índices internos devem usar os campos explícitos acima. Versões históricas registradas em eventos e relatórios de fases anteriores não são reescritas.
