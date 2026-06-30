# TOOL_STANDARD_V2

Padrao oficial de desenvolvimento de ferramentas do projeto Calcule Trabalhador.

Este documento substitui qualquer documentacao anterior relacionada ao padrao de construcao de ferramentas. A partir desta versao, `TOOL_STANDARD_V2` e a referencia obrigatoria para novas calculadoras e simuladores do projeto.

Este documento e apenas normativo. Ele nao implementa ferramentas, nao altera calculadoras existentes e nao muda contratos de dados por si so.

## 1. Filosofia

Cada ferramenta do Calcule Trabalhador deve ser simples por fora e profunda por dentro.

A experiencia deve permitir que qualquer trabalhador use a ferramenta sem precisar conhecer termos juridicos, previdenciarios ou contabeis. Ao mesmo tempo, a implementacao deve respeitar regras tecnicas, memoria de calculo, fontes oficiais, fallback e validacoes numericas.

Toda ferramenta deve ser:

- extremamente simples de usar;
- tecnicamente consistente;
- acessivel para qualquer trabalhador;
- otimizada para SEO;
- preparada para monetizacao;
- preparada para atualizacao anual;
- escalavel para novos dominios e novas regras.

O usuario nao deve sentir complexidade. A arquitetura deve absorver a complexidade por ele.

## 2. Estrutura Padrao Da Pagina

A ordem oficial de uma ferramenta e:

```text
Hero
↓
O que voce vai descobrir
↓
Simulador
↓
Ultima etapa
↓
Resultado (oculto inicialmente)
↓
Resumo
↓
Memoria de calculo
↓
Tabela
↓
Produto (FUTURE_PRODUCT_SLOT)
↓
Proximos passos
↓
Conteudo SEO
↓
FAQ
↓
Fontes oficiais
↓
Artigos relacionados
↓
Ferramentas relacionadas
↓
Footer
```

O resultado deve permanecer oculto inicialmente. Conteudo SEO, FAQ, fontes oficiais, artigos relacionados e ferramentas relacionadas devem ficar visiveis fora da area oculta do resultado.

## 3. UX

A experiencia deve ser mobile first e orientada a poucos passos.

Regras:

- usar linguagem simples;
- usar frases curtas;
- explicar termos tecnicos quando aparecerem;
- evitar formularios longos sem necessidade;
- priorizar escolhas claras;
- usar CTAs objetivos;
- manter experiencia consistente entre ferramentas;
- reduzir esforco de interpretacao do usuario;
- mostrar resultados de forma direta;
- permitir revisao da memoria de calculo.

A ferramenta deve responder primeiro a pergunta pratica do usuario. Explicacoes mais longas devem aparecer depois, no conteudo SEO.

## 4. Componentes Obrigatorios

Toda ferramenta deve possuir:

- Hero;
- Calculadora;
- Resultado;
- Resumo;
- Memoria de calculo;
- Relatorio;
- Impressao;
- Copiar resultado;
- FAQ;
- Conteudo SEO;
- Links internos;
- Ferramentas relacionadas;
- Artigos relacionados;
- Fontes oficiais.

Esses componentes formam o contrato minimo de uma ferramenta completa. A ausencia de qualquer um deles deve ser justificada antes da publicacao.

## 5. Padrao Dos Resultados

O resultado deve ser claro, acionavel e verificavel.

Toda ferramenta deve apresentar:

- valor principal;
- resumo dos dados informados;
- base considerada;
- aliquota, percentual, fator ou regra usada quando aplicavel;
- memoria de calculo;
- tabela com linhas principais;
- acoes secundarias.

As acoes secundarias devem incluir:

- gerar relatorio;
- PDF ou relatorio imprimivel, conforme a capacidade da ferramenta;
- impressao;
- copiar resultado.

A memoria de calculo deve explicar como o valor foi obtido sem mudar a formula. A tabela deve ajudar o usuario a conferir entradas, bases, descontos, acrescimos e totais.

## 6. Conteudo SEO

Cada ferramenta deve conter aproximadamente 800 a 1.200 palavras de conteudo editorial util.

Esse conteudo nao substitui artigos do blog. Ele deve complementar os artigos e responder duvidas ligadas ao uso da calculadora, ao entendimento do resultado e aos conceitos basicos do calculo.

Regras:

- linguagem simples;
- conteudo util;
- foco no calculo;
- explicacoes praticas;
- exemplos quando ajudarem;
- evitar profundidade excessiva que pertence a artigos;
- manter FAQ e fontes oficiais visiveis.

## 7. Artigos

Artigos continuam sendo o conteudo profundo do projeto.

A divisao oficial e:

- ferramentas respondem duvidas do calculo;
- artigos aprofundam o assunto;
- ferramentas ajudam na acao imediata;
- artigos explicam contexto, variacoes, direitos, riscos e exemplos completos.

Uma ferramenta deve encaminhar o usuario para artigos quando a duvida exige mais contexto do que a interface deve carregar.

## 8. Linkagem Interna

A linkagem interna deve conduzir o usuario de forma natural:

```text
resultado
↓
artigos
↓
outras ferramentas
↓
conteudo relacionado
```

Links internos devem aparecer em pontos uteis:

- dentro ou logo apos o resultado;
- em proximos passos;
- no conteudo SEO;
- em artigos relacionados;
- em ferramentas relacionadas.

Links devem ser contextuais. Nao devem competir com o CTA principal da ferramenta.

## 9. Monetizacao

Toda ferramenta deve prever o slot:

```text
FUTURE_PRODUCT_SLOT
```

Esse slot deve aparecer apos a memoria de calculo e antes dos proximos passos.

Regras:

- nunca competir com o CTA principal da calculadora;
- oferecer produto contextual;
- manter o calculo como experiencia principal;
- nao interromper a compreensao do resultado;
- permitir remocao ou substituicao futura sem quebrar o layout.

O produto deve ajudar o usuario no contexto do calculo realizado.

## 10. Arquitetura Das Regras

A arquitetura oficial de regras deve seguir o fluxo:

```text
data/rules/
↓
transformador
↓
data/tabelas-trabalhistas.json
↓
calculadoras
```

`data/rules/` e a fonte oficial das regras estruturadas.

`data/tabelas-trabalhistas.json` e a camada de compatibilidade e agregador runtime consumido pelas calculadoras.

Calculadoras nao devem depender diretamente de `data/rules/` enquanto a arquitetura de transformacao e compatibilidade estiver em evolucao. A conexao com regras deve respeitar equivalencia numerica e fallback.

## 11. Atualizacao Anual

Fluxo oficial de atualizacao anual:

```text
Atualizar data/rules/
↓
rodar transformador
↓
validar
↓
testar calculadoras
↓
publicar
```

Antes de publicar, validar:

- fontes oficiais;
- vigencia;
- valores numericos;
- equivalencia com calculos anteriores quando aplicavel;
- testes automatizados ou manuais da calculadora;
- impacto em artigos e links relacionados.

Atualizacoes anuais devem comecar nas regras, nao em valores espalhados por paginas.

## 12. Fallback

Toda calculadora deve funcionar em modo hibrido.

Regra:

```text
tentar usar helper central
↓
se falhar, usar fallback local
```

O fallback local deve preservar a experiencia do usuario quando:

- o helper central nao carregar;
- o arquivo de tabelas nao estiver disponivel;
- houver erro de rede;
- houver erro de parsing;
- o contrato central ainda nao cobrir todos os campos necessarios.

Nenhum usuario deve perceber diferenca entre helper central e fallback local. Qualquer migracao deve passar por testes de equivalencia numerica.

## 13. Responsividade

Toda ferramenta deve ser mobile first.

Regras:

- sem scroll horizontal na pagina;
- cards empilhados em telas pequenas;
- tabelas com wrapper responsivo quando necessario;
- botoes com largura segura no mobile;
- campos de formulario sem overflow;
- sidebars apenas quando houver espaco real;
- textos sem sobreposicao;
- areas fixas com dimensoes estaveis.

A versao mobile nao e adaptacao secundaria. Ela e a base do design.

## 14. SEO

Checklist minimo de SEO tecnico:

- H1 unico;
- canonical;
- meta description;
- Open Graph;
- Twitter Card;
- Schema;
- FAQ;
- HowTo quando fizer sentido;
- SoftwareApplication;
- Breadcrumb.

O SEO deve reforcar a utilidade da ferramenta, nao transformar a pagina em artigo. A ferramenta deve continuar sendo o elemento principal da pagina.

## 15. Governanca

Toda nova ferramenta deve respeitar a arquitetura de governanca do projeto.

Arquivos e camadas relacionados:

- `data/rules/`;
- `data/maps/`;
- `data/brain/`;
- `data/tools.json`.

A criacao de uma ferramenta nao termina no HTML. A publicacao completa deve considerar catalogo, mapas, dependencias, clusters, regras de validacao, sitemap quando aplicavel e relacao com artigos.

Alteracoes de governanca devem ser feitas em etapa propria quando o escopo permitir.

## 16. Checklist Final

Checklist oficial para aprovacao de qualquer ferramenta:

- [ ] UX;
- [ ] Responsividade;
- [ ] SEO;
- [ ] Conteudo;
- [ ] Testes;
- [ ] Relatorio;
- [ ] PDF ou relatorio imprimivel;
- [ ] Impressao;
- [ ] Copiar;
- [ ] FAQ;
- [ ] Schemas;
- [ ] Links;
- [ ] Governanca;
- [ ] Atualizacao anual;
- [ ] Integracao com helper;
- [ ] Fallback;
- [ ] Monetizacao;
- [ ] Produto;
- [ ] Performance;
- [ ] Acessibilidade.

Uma ferramenta so deve ser considerada pronta quando o checklist estiver validado ou quando as excecoes estiverem documentadas.

## 17. Conclusao

`TOOL_STANDARD_V2` passa a ser o padrao oficial de desenvolvimento das ferramentas do projeto Calcule Trabalhador.

Novas calculadoras devem seguir este documento como referencia principal. O objetivo e manter ferramentas simples para o usuario, tecnicamente confiaveis, preparadas para atualizacao anual, integradas a arquitetura de regras e coerentes com SEO, monetizacao e governanca do projeto.
