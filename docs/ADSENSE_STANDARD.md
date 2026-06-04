# Padrão Oficial de AdSense

## 1. Objetivo do padrão

Este documento define o padrão oficial de monetização com Google AdSense para o projeto Calcule Trabalhador.

O objetivo é:

- Preparar calculadoras, artigos, Home, galerias de ferramentas e galerias de artigos para monetização.
- Evitar anúncios inseridos de forma bagunçada, excessiva ou visualmente confusa.
- Preservar a experiência do usuário, especialmente em páginas de cálculo.
- Seguir as políticas do Google AdSense e manter o site elegível para monetização.
- Criar uma base consistente para futuras decisões sobre anúncios, afiliados, parcerias e produtos próprios.

## 2. Base estratégica

O padrão parte das seguintes diretrizes conceituais:

- O Google recomenda considerar a experiência do usuário e as políticas do AdSense ao decidir onde posicionar anúncios.
- Anúncios devem ficar próximos de conteúdo relevante, mas sem atrapalhar o que o usuário está tentando fazer.
- A página deve continuar limpa, navegável e útil mesmo com monetização.
- Auto Ads podem encontrar locais automaticamente com base no layout, no conteúdo e em outros elementos da página.
- O site nunca deve incentivar cliques em anúncios.
- O site nunca deve criar áreas que induzam clique acidental, especialmente perto de botões, menus, campos de formulário ou resultados.
- Anúncios devem parecer anúncios, sem serem camuflados como ferramentas, botões, links de navegação ou resultados de cálculo.

## 3. Estratégia inicial

A estratégia inicial do projeto é usar Google AdSense com prudência.

Na primeira fase de monetização:

- Usar Auto Ads somente após aprovação do site no AdSense.
- Não inserir blocos manuais imediatamente.
- Observar primeiro o desempenho geral do site.
- Acompanhar RPM, CTR, páginas mais acessadas, comportamento mobile e impacto visual.
- Avaliar se os anúncios automáticos prejudicam leitura, cálculo, navegação ou confiança.
- Depois da observação inicial, testar blocos manuais apenas em páginas estratégicas.

Blocos manuais devem ser tratados como etapa posterior, nunca como primeiro movimento.

## 4. Padrão para calculadoras

Calculadoras são páginas de tarefa. O usuário entra para simular um valor, entender o resultado e seguir para outra ferramenta ou conteúdo complementar.

Espaços conceituais permitidos para anúncios:

- Após a introdução da página.
- Após a área de resultado, desde que o resultado continue claro.
- Antes ou depois do FAQ.
- Antes dos links internos, sem prejudicar a navegação.

Regras obrigatórias:

- Nunca colocar anúncio dentro do formulário.
- Nunca colocar anúncio entre um campo e o botão de calcular.
- Nunca colocar anúncio misturado com o resultado de cálculo.
- Nunca colocar anúncio entre um valor calculado e sua explicação.
- Não atrapalhar a leitura do resultado.
- Não deslocar visualmente campos, botões ou cards de resultado.
- Não criar anúncios próximos demais de botões de calcular, limpar, copiar ou navegar.

Classes conceituais recomendadas:

- `ad-slot-top`: após introdução.
- `ad-slot-result`: depois do bloco completo de resultado.
- `ad-slot-faq`: antes ou depois do FAQ.
- `ad-slot-bottom`: antes dos links internos ou próximo ao final da página.

## 5. Padrão para artigos

Artigos são páginas de leitura. A monetização deve respeitar a sequência do texto e não quebrar o raciocínio do usuário.

Espaços conceituais permitidos:

- Após a introdução.
- No meio do conteúdo, entre seções completas.
- Antes do FAQ.
- Antes de artigos relacionados.

Regras:

- Não inserir anúncio logo após um subtítulo se isso separar o título do conteúdo que ele apresenta.
- Não inserir anúncio entre uma pergunta e sua resposta.
- Não quebrar listas, tabelas ou blocos explicativos.
- Não inserir anúncios em excesso em artigos curtos.

## 6. Padrão para Home

A Home deve priorizar navegação, descoberta de ferramentas e confiança no projeto.

Regras:

- Evitar excesso de anúncios.
- Priorizar a galeria de calculadoras e os caminhos principais do usuário.
- Não inserir anúncios entre os primeiros cards de ferramentas.
- Permitir no máximo espaços estratégicos futuros.
- Usar anúncios apenas se eles não prejudicarem a função principal da Home.

Espaços futuros possíveis:

- Após o bloco inicial de apresentação.
- Após o primeiro grupo de ferramentas.
- Antes do rodapé.

## 7. Padrão para Galeria de Ferramentas

Galerias de ferramentas devem manter leitura rápida e comparação fácil entre calculadoras.

Regras:

- Não inserir anúncios entre cards de ferramentas no início da galeria.
- Não inserir anúncios que pareçam cards de ferramenta.
- Permitir anúncios apenas após blocos de ferramentas ou no final.
- Manter distância visual clara entre anúncios e cards clicáveis.

Espaços futuros possíveis:

- Após um grupo completo de ferramentas.
- Antes da seção de links internos.
- No final da galeria.

## 8. Padrão para Galeria de Artigos

Galerias de artigos podem aceitar anúncios entre grupos de conteúdo, desde que a leitura continue clara.

Regras:

- Permitir anúncios entre grupos de artigos.
- Não colocar anúncio entre título e resumo de um artigo.
- Não fazer o anúncio parecer um card editorial.
- Não quebrar a leitura em mobile.

Espaços futuros possíveis:

- Após o primeiro grupo de artigos.
- Entre grupos temáticos.
- Antes da paginação ou dos links relacionados.

## 9. Espaços reservados

As páginas podem usar classes conceituais para marcar posições futuras de anúncios, mesmo antes da ativação do AdSense.

Classes oficiais:

- `ad-slot`: espaço genérico de anúncio.
- `ad-slot-top`: espaço após introdução ou bloco inicial.
- `ad-slot-inline`: espaço entre seções de conteúdo.
- `ad-slot-result`: espaço após resultado de calculadora.
- `ad-slot-faq`: espaço próximo ao FAQ.
- `ad-slot-bottom`: espaço próximo ao final da página.

Essas classes não obrigam a exibição imediata de anúncios. Elas servem para padronizar a arquitetura visual e facilitar testes futuros.

## 10. Regras proibidas

É proibido:

- Incentivar clique em anúncios.
- Usar textos como "clique no anúncio", "ajude clicando", "apoie visitando estes links" ou equivalentes.
- Colocar anúncio colado em botão.
- Colocar anúncio entre campo e botão de formulário.
- Colocar anúncio dentro de card de resultado.
- Camuflar anúncio como ferramenta, calculadora, botão, menu ou artigo.
- Colocar anúncio em tela sem conteúdo útil.
- Criar páginas com objetivo principal de exibir anúncios.
- Usar setas, imagens ou destaques visuais para chamar atenção para anúncios.
- Prejudicar navegação mobile.
- Inserir anúncios em locais que possam gerar clique acidental.

## 11. Estratégia futura

A evolução de monetização deve seguir esta ordem:

1. AdSense.
2. Afiliados.
3. Parcerias.
4. Produtos próprios ou ferramentas premium.

O AdSense será a primeira camada porque permite testar monetização sem alterar a proposta principal do site.

Afiliados, parcerias e produtos próprios só devem ser avaliados depois que:

- O tráfego orgânico estiver mais consistente.
- As páginas principais estiverem padronizadas.
- O comportamento dos usuários estiver mais claro.
- O site tiver base editorial e técnica estável.

## 12. Checklist antes de aplicar anúncios

Antes de ativar anúncios em qualquer página, verificar:

- [ ] A página tem conteúdo suficiente?
- [ ] A página tem navegação clara?
- [ ] A página segue as políticas do Google AdSense?
- [ ] O anúncio não atrapalha o cálculo?
- [ ] O anúncio não interrompe a leitura do resultado?
- [ ] O anúncio não induz clique acidental?
- [ ] O anúncio não está colado em botões, campos ou links importantes?
- [ ] O anúncio não parece ferramenta, card editorial ou navegação?
- [ ] O mobile continua usável?
- [ ] O carregamento da página continua aceitável?
- [ ] O usuário ainda consegue concluir a tarefa principal da página com facilidade?

## 13. Regra final

Nenhuma nova página, calculadora, artigo, galeria ou ferramenta deve ser criada sem considerar este padrão de monetização.

A monetização deve ser planejada desde a estrutura da página, mas só deve ser ativada quando não prejudicar SEO, confiança, navegação, acessibilidade, leitura ou uso da ferramenta.

## Fontes oficiais usadas como base conceitual

- Google AdSense: práticas recomendadas de posição de anúncios.
  - https://support.google.com/adsense/answer/10542
- Google AdSense: práticas de visibilidade e posicionamento.
  - https://support.google.com/adsense/answer/6219980
- Google AdSense: anúncios automáticos.
  - https://support.google.com/adsense/answer/9261805
- Google AdSense: configuração de anúncios automáticos.
  - https://support.google.com/adsense/answer/9261307
- Google AdSense: políticas do programa.
  - https://support.google.com/adsense/answer/48182
