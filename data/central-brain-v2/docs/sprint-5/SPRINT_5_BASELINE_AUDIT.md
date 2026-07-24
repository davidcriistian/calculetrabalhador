# Sprint 5 — Auditoria de baseline do Projection Engine

Data: 2026-07-21
Base auditada: Sprint 4.4
Status: concluída

## 1. Objetivo

Confirmar o estado real do Central Brain antes da implementação do novo Projection Engine, identificando componentes reutilizáveis, lacunas arquiteturais, riscos e critérios de entrada para a Sprint 5.

## 2. Resultado executivo

A base está consistente e apta a iniciar a Sprint 5 em modo paralelo. A camada de conhecimento contém fontes, conceitos e seis regras canônicas de Aviso-Prévio, mas ainda não possui projeções jurídicas nem um motor de resolução de casos.

O arquivo existente `engines/projection-engine.js` implementa somente o ciclo de vida técnico de artefatos derivados de uma única versão de regra. Ele não executa inferência jurídica, não valida pacotes de fatos, não resolve dependências entre projeções, não trata insuficiência ou conflito de fatos e não produz explicações de decisão. Por isso será preservado apenas como componente de lifecycle/fingerprint ou substituído de forma compatível por módulos especializados.

## 3. Evidências da baseline

- Validação estrutural do Central Brain: aprovada.
- Testes automatizados existentes: 40 aprovados.
- Arquivos JSON verificados pelo validador: 109.
- Fontes oficiais registradas: 8.
- Conceitos canônicos: 16.
- Regras canônicas: 6.
- Projeções canônicas: 0.
- Referências quebradas detectadas: 0.
- Autoridade de runtime: desabilitada.
- Consumidores de produção conectados: nenhum.

## 4. Componentes reutilizáveis

1. `engines/errors.js`: erros estruturados e invariantes.
2. `engines/integrity.js`: clonagem, congelamento e SHA-256.
3. `engines/temporal-selector.js`: seleção temporal e detecção de sobreposição.
4. `engines/loader.js`: carregamento do snapshot canônico.
5. `engines/governance-engine.js`: gates de governança.
6. `schemas/rule.schema.json` e `rule-version.schema.json`: modelo temporal das regras.
7. Registries de regras, fontes, dependências e auditoria.
8. Pacote do domínio `knowledge/domains/aviso-previo`.

## 5. Lacunas bloqueadoras para o Projection Engine

### 5.1 Modelo de fatos inexistente

Não há schema canônico para fatos jurídicos, pacote de fatos, origem, evidência, confiança, temporalidade, conflito ou distinção entre fatos informados e derivados.

### 5.2 Modelo atual de projeção inadequado ao novo objetivo

O schema atual representa projeções de consumo (`calculator-parameters`, `editorial-facts`, etc.) geradas a partir de uma única regra aprovada. A Sprint 5 exige projeções jurídicas compostas, com múltiplas regras, fatos de entrada, dependências, estados de resolução e explicabilidade.

### 5.3 Motor existente é apenas lifecycle

O motor atual gera, valida, publica e retira artefatos imutáveis. Faltam:

- validação de fatos;
- seleção de regras por data jurídica;
- avaliação declarativa de condições;
- aplicação de exceções;
- resolução de dependências;
- propagação de estados;
- explicação da decisão;
- validação do resultado;
- execução determinística por snapshot.

### 5.4 Regras ainda em `review`

As seis regras e suas versões não estão aprovadas. O motor atual bloqueia qualquer geração de projeção a partir delas. A Sprint 5 deve operar em modo de desenvolvimento controlado, sem promover regras automaticamente nem ativar autoridade de runtime.

### 5.5 Readiness desatualizado

O gate `LEGAL_KNOWLEDGE` ainda informa que conceitos e regras estão pendentes, embora já existam. O estado deverá ser corrigido durante a implementação.

### 5.6 Contratos insuficientes

O contrato de projeção atual cobre imutabilidade e lifecycle, mas não define:

- contrato de entrada;
- estados de resolução;
- trilha de decisão;
- fatos ausentes;
- conflitos;
- revisão humana;
- fingerprint de entrada e saída;
- versão do motor e snapshot do Brain.

## 6. Decisões arquiteturais para a Sprint 5

1. Separar `projection definition` de `projection execution result`.
2. Preservar lifecycle e fingerprints, mas desacoplá-los do raciocínio jurídico.
3. Criar catálogo global de tipos de fatos e pacote específico de Aviso-Prévio.
4. Representar condições de forma declarativa, sem `eval` e sem código arbitrário dentro do conhecimento.
5. Executar projeções por grafo acíclico de dependências.
6. Tornar estados de incerteza parte do contrato, nunca exceções silenciosas.
7. Registrar snapshot, versão do motor e fingerprints em toda execução.
8. Manter `runtimeAuthority=false` e `consumerReady=false` durante toda a Sprint 5.
9. Não alterar calculadoras, artigos ou consumidores nesta fase.
10. Exigir revisão jurídica humana antes de qualquer promoção operacional.

## 7. Sequência aprovada de implementação

1. Schemas e contratos.
2. Catálogo e pacote de fatos.
3. Catálogo e definições de projeções.
4. Módulos do motor de resolução.
5. Projeções `PROJ-AP-001` a `PROJ-AP-008`.
6. Rastreabilidade e explicações.
7. Testes estruturais, jurídicos, temporais e de determinismo.
8. Auditoria final e empacotamento.

## 8. Critério de saída desta auditoria

A baseline está aprovada para desenvolvimento porque:

- os testes atuais passam;
- não há referências quebradas;
- o novo motor permanecerá isolado;
- as lacunas estão identificadas;
- não há necessidade de alterar consumidores existentes;
- existe infraestrutura reutilizável para integridade, temporalidade e governança.

## 9. Riscos que permanecerão controlados

- Divergência interpretativa jurídica: mitigada por status `review` e revisão humana obrigatória.
- Mistura entre regra e cálculo: mitigada por schemas distintos e instruções operacionais estruturadas.
- Aplicação retroativa incorreta: mitigada por seleção temporal pela data jurídica do caso.
- Respostas inventadas com fatos ausentes: mitigadas por estados explícitos de insuficiência, conflito e revisão humana.
- Alteração prematura de produção: mitigada por isolamento e flags de autoridade desativadas.
