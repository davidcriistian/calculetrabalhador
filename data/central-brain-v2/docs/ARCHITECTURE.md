# Arquitetura do Central Brain v2

Versão da entrega: `2.6.0-sprint5.6.7-phaseD`.

```text
Fontes oficiais -> Conceitos/Fatos -> Regras temporais -> Projeções canônicas -> Consumidores
        |                 |                 |                    |
        +------------ rastreabilidade, governança e auditoria --+
```

## Responsabilidades

- **Fonte** preserva evidência, proveniência e recorte jurídico.
- **Conceito** estabiliza o vocabulário jurídico do domínio.
- **Fato** representa entradas canônicas e verificáveis.
- **Regra** traduz a fonte em semântica operacional versionada.
- **Projeção** entrega payload estável, determinístico e rastreável.
- **Consumidor** consulta projeções e nunca grava conhecimento no Brain.

## Estado operacional

O domínio `aviso-previo` possui modelo da Fase 2 carregado. A plataforma permanece `parallel-only`, sem autoridade de runtime, sem conexão com consumidores e sem aprovação jurídica formal.

## Limites

Orquestração de produção, automações e ativação de consumidores permanecem fora desta entrega.
