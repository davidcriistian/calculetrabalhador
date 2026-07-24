# Decisões arquiteturais

1. A nova estrutura é aditiva e vive em `/data/central-brain-v2/`.
2. O runtime público permanece intocado.
3. O catálogo canônico inicia vazio para impedir promoção automática de conhecimento não validado.
4. Vigência jurídica e data de registro são tratadas separadamente.
5. Toda projeção é imutável, rastreável e vinculada a uma versão exata da regra.
6. Um domínio só pode ser consumido em `READY_FOR_CONSUMERS`.
7. Integração com calculadoras e automações exige shadow mode e aprovação posterior.
