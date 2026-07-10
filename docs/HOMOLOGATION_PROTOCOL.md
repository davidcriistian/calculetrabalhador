# HOMOLOGATION_PROTOCOL

Status: protocolo obrigatorio para homologacoes futuras

Versao: 1.0.0

Criado em: 2026-07-09

## Objetivo

Definir o processo oficial para homologar qualquer migracao futura entre a arquitetura atual e a nova arquitetura Core.

Homologar significa provar que a mudanca preserva calculo, runtime, conteudo, SEO, URLs, estrutura visual, performance e dependencias antes de qualquer publicacao operacional.

## Conceitos

- Runtime atual: `data/tabelas-trabalhistas.json` e `assets/js/tabelas-trabalhistas.js`.
- Core: camada declarativa em `data/core/`.
- Piloto: migracao pequena, reversivel e validada.
- Equivalencia: prova de que os resultados novos coincidem com os resultados atuais.
- Reprovacao: qualquer divergencia nao explicada em calculo, URL, SEO, conteudo, schema ou runtime.

## Fluxo

```text
Selecionar piloto
-> Confirmar Core preparado
-> Validar Compatibility
-> Registrar Legislation quando aplicavel
-> Criar plano Update
-> Executar equivalencia numerica
-> Validar visual, SEO, runtime e links
-> Registrar resultado
-> Aprovar ou reprovar homologacao
```

## Criterios De Aprovacao

- Todos os JSONs validos.
- Governance PASS.
- Transform Rules PASS quando aplicavel.
- Nenhum resultado numerico divergente fora da tolerancia definida.
- Nenhuma URL alterada.
- Nenhum metadado SEO alterado sem aprovacao.
- JSON-LD preservado.
- Runtime preservado ou fallback comprovado.
- Layout mobile e desktop sem regressao.
- Links internos preservados.
- Conteudo preservado ou revisado com aprovacao.

## Criterios De Reprovacao

- Divergencia numerica sem justificativa.
- Alteracao involuntaria de URL, canonical, title, description ou JSON-LD.
- Quebra visual em mobile ou desktop.
- Dependencia nao mapeada.
- Runtime sem fallback.
- Falta de registro de homologacao.
- Falha em validacao de JSON, governance ou transform rules.

## Validacao Numerica

Deve seguir `docs/CALCULATION_EQUIVALENCE.md`.

Toda calculadora homologada precisa comparar entradas, saidas e arredondamentos entre versao atual e versao futura.

## Validacao Visual

Comparar telas principais em mobile e desktop. A homologacao deve confirmar que nao houve sobreposicao, quebra de layout, perda de CTA, mudanca involuntaria de hierarquia visual ou erro de responsividade.

## Validacao Estrutural

Confirmar que a estrutura de arquivos segue os indices oficiais, que `data/core/index.json` referencia os pontos de entrada corretos e que nenhuma Engine navega por pastas sem contrato.

## Validacao SEO

Conferir title, description, canonical, robots, headings, links internos, sitemap e ausencia de mudancas involuntarias.

## Validacao JSON-LD

Conferir que schemas estruturados permanecem validos, coerentes com o conteudo e sem campos quebrados.

## Validacao De Runtime

Confirmar que o runtime atual permanece funcional, que fallback existe e que nenhuma pagina passa a depender do Core sem fase aprovada.

## Validacao De Performance

Comparar tamanho de assets, carregamento inicial, scripts adicionados e impacto em paginas afetadas.

## Validacao Mobile

Testar viewport mobile, interacoes, inputs, botoes, tabelas e mensagens de erro.

## Validacao Desktop

Testar viewport desktop, estados de formulario, resultados, links, textos longos e consistencia visual.

## Validacao De Links

Conferir links internos, links de artigos relacionados, links de ferramentas e referencias oficiais.

## Validacao De Conteudo

Conferir que textos, disclaimers, exemplos, FAQs e datas nao foram alterados sem aprovacao editorial.

## Validacao De Dependencias

Conferir Compatibility Engine, Update Engine e mapas atuais para garantir que regras, tabelas, ferramentas e artigos afetados foram identificados.

## Checklist Obrigatorio

- [ ] Core preparado.
- [ ] Compatibility validada.
- [ ] Legislation cadastrada quando aplicavel.
- [ ] Update aprovado.
- [ ] Equivalencia numerica validada.
- [ ] Runtime preservado.
- [ ] SEO preservado.
- [ ] JSON-LD preservado.
- [ ] Performance preservada.
- [ ] Mobile validado.
- [ ] Desktop validado.
- [ ] Links preservados.
- [ ] Conteudo preservado.
- [ ] Dependencias validadas.
- [ ] Resultado registrado.

## Resultado Esperado

A homologacao deve terminar com um resultado objetivo:

- `approved`
- `approved-with-notes`
- `rejected`
- `blocked`

## Registro Da Homologacao

Cada homologacao futura deve registrar data, responsavel, escopo, arquivos avaliados, evidencias, resultado, pendencias e decisao final.

## Boas Praticas

- Homologar pilotos pequenos.
- Preservar rollback.
- Evitar migracoes multiplas no mesmo ciclo.
- Registrar evidencia antes de aprovar.
- Separar validacao tecnica, numerica, visual e editorial.
