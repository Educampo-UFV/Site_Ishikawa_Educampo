# 📂 Directory Documentation: `src/app/api/simulacao`

## 🎯 Overview
* **Purpose:** Rota BFF (Backend-For-Frontend) responsável pela comunicação segura, autenticada (`X-API-KEY`) e de alta velocidade com o serviço externo de Machine Learning / Simulação de Gráficos (Python v2.0.0).
* **Layer:** Backend Proxy (Next.js API Route / BFF Layer)

## 🏗️ Architecture and Data Flow
```mermaid
graph TD
    A["Navegador (src/app/simulacao/page.tsx)"] -->|POST /api/simulacao| B["BFF Proxy (route.ts)"]
    B -->|Validar custo_concentrado| C["Proxy Layer"]
    C -->|Fetch POST + X-API-KEY / Bearer| D["API ML Externa (Python v2.0.0)"]
    D -->|HTTP 200 OK (Quartis & Predições)| C
    C -->|Retorno Higienizado JSON| A
```

## 🗂️ Component Mapping
* `📄 route.ts`: Rota BFF principal (`POST`) que esconde as chaves corporativas, injeta os cabeçalhos `X-API-KEY`, aplica timeout resiliente de 30 segundos via `AbortController` e repassa o payload de simulação com Enums canônicos Zod.

## 🧠 Design Decisions & Trade-offs
* **Decision:** Envio direto dos Enums canônicos em kebab-case (`compost-barn`, `confinado-sem-estrutura`, `semiconfinado`) sem de-para manual no client-side.
* **Motivation:** Eliminar conversores frágeis no frontend e garantir que o backend Python (SSOT) aplique as regras zootécnicas e a validação canônica de schemas.
* **Trade-off:** Exige uso de fallbacks válidos (`compost-barn` e `triangulo`) no client-side para evitar exceções HTTP 422 quando o formulário é carregado sem dados prévios no Zustand.

## 🧪 Testing Strategy
* **Test Types:** Unit & Integration Tests (`Jest` + `React Testing Library`).
* **Critical Scenarios:**
  - Repasse de payload com `X-API-KEY` e `Authorization: Bearer`.
  - Tratamento de Rate Limiting (HTTP 429) e Timeout (HTTP 504).
  - Assert de resposta `HTTP 200 OK` com dados simulados válidos.

## 🔗 Related Context
* Obsidian Vault: `[[bdd-04-simulacao-padronizacao]]`, `[[sdd-04-simulacao-padronizacao]]`, `[[dod-04-simulacao-padronizacao]]`
