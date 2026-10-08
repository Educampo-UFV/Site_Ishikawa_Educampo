# CHANGELOG

## [v3.4.1] - 2026-10-08

### Bug Fixes
- **simulacao:** Persistência do estado manipulado nos sliders de simulação entre navegações de tela (Simulação <-> Diagnóstico) via Zustand (`valoresSimulacao`) integrado ao `sessionStorage`.
- **simulacao:** Garantia de isolamento imutável entre `valoresSimulacao` e `dadosFazenda`, impedindo corrupção dos dados cadastrais originais.
- **simulacao:** Restauração transparente para os valores reais da fazenda ao clicar no botão "Restaurar Valores Originais".
- **store:** Limpeza integral do estado de simulação ao resetar a sessão do usuário (`limparDados`).

### Performance & Refactoring
- **simulacao:** Extração da constante `VALORES_SIMULACAO_DEFAULT` e da função pura `extrairValoresSimulacao`, eliminando duplicidade de magic numbers e lógica de fallback.
- **simulacao:** Implementação do comparador puro `saoValoresSimulacaoIguais`, otimizando re-renderizações no ciclo do React.
- **simulacao:** Refatoração de `handleEditBlur` com aplicação de *Guard Clauses* e limites estritos via `Math.min/max`.

---
*Release consolidated via Antigravity Agentic Workflows.*
