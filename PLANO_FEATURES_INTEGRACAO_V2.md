# 📋 Plano de Features: Integração da API Ishikawa Educampo (v2.0.0)

Este documento detalha o diagnóstico comparativo entre a **API Ishikawa Educampo (v2.0.0)** e o projeto **Site_Ishikawa_Educampo (Frontend Next.js)**, consolidando a lista de features a serem implementadas para alinhar a plataforma com as novas rotas, o sistema de autenticação real e os novos fluxos de UX.

---

## 📊 1. Resumo Comparativo: Estado Atual vs API v2.0.0

| Domínio | Estado Atual no Frontend (Site) | Especificação API v2.0.0 (`INTEGRATION.md`) | Requisito de Mudança |
| :--- | :--- | :--- | :--- |
| **Autenticação** | Auth mockada localmente em `src/app/api/auth` comparando `username`/`password` com `.env` e gerando JWT via `jose`. | API Real com `POST /api/auth/login` (email/senha), `POST /api/auth/logout`, `GET /api/auth/me` enviando `X-API-KEY`. | Atualizar BFF para atuar como proxy transparente da API, alterar campos de login de `username` para `email`. |
| **Gestão de Produtores** | Apenas leitura de formulários e fazendas via `/api/formularios`. Não existe tela de cadastro. | Rota `POST /api/produtores` para registro completo de produtores e suas fazendas vinculados ao consultor. | Criar rota BFF `/api/produtores` e novo componente expansível "Cadastrar Fazenda" na UI. |
| **Lista de Fazendas** | Select simples ou autocomplete de fazendas sem ação direta de diagnóstico por item. | `GET /api/formularios` e `GET /api/formularios/farms/{nome}` retornam fazendas gerenciadas. | Atualizar a sessão de fazendas cadastradas adicionando botão "Iniciar Diagnóstico" para cada fazenda. |
| **Simulação (ML)** | Frontend continha tratamentos manuais de enums de sistemas de produção. | API possui "Mapeamento Defensivo para ML API" no backend (`ml_client.py`), aceitando enums canônicos em kebab-case. | Simplificar payload do frontend, removendo de-para manual e alinhando com a API v2.0.0. |
| **Tratamento de Erros** | Mensagens genéricas de erro de rede. | Erros estruturados de negócio (`error_code`, `message`, `details`) e Pydantic 422 (`loc`, `msg`). | Exibir mensagens amigáveis na UI baseadas no `error_code` e erros de validação por campo. |

---

## 🎯 2. Lista de Features a Serem Criadas

---

### 🔑 Feature 1: Autenticação Real do Consultor via API

* **Descrição:** Substituir o mecanismo de autenticação mockado localmente pelo proxy de autenticação real com a API Ishikawa Educampo.
* **Componentes Afetados:**
  * `src/app/api/auth/route.ts`: Atualizar método `POST` para proxear `email` e `password` para `${API_BASE_URL}/api/auth/login` com header `X-API-KEY: 42`. Injetar cookie seguro `session_token`.
  * `src/app/api/auth/logout/route.ts` *(Novo)*: Proxear encerramento de sessão para `POST /api/auth/logout`.
  * `src/app/api/auth/me/route.ts` *(Novo)*: Buscar perfil e fazendas gerenciadas do consultor autenticado em `GET /api/auth/me`.
  * `src/app/login/page.tsx`: 
    * Alterar label e input de "Usuário" para "E-mail do Consultor" (`type="email"`).
    * Atualizar botão de credenciais de teste para preencher `consultor@educampo.com` / `admin123`.
  * `src/proxy.ts`: Ajustar o middleware Edge para validar a sessão do consultor através do cookie `session_token`.

---

### 🚜 Feature 2: Componente Expansível "Cadastrar Fazenda" (POST /api/produtores)

* **Descrição:** Adicionar na tela de seleção/formulário um novo componente expansível para que o consultor possa registrar novos produtores e suas fazendas diretamente na API.
* **Comportamento de UX:**
  * **Estado Inicial (Colapsado):** Exibe um card/sessão simples com o título **"Cadastrar Fazenda"** e um botão para expandir a sessão.
  * **Estado Expandido:** Revela o formulário de cadastro com os seguintes campos:
    * Credenciais: `email`, `senha`
    * Dados da Fazenda: `nome_fazenda`, `sistema_producao` (select), `regiao_sebrae` (select)
    * Indicadores Zootécnicos/Econômicos: `total_vacas`, `percentual_lactacao`, `total_rebanho`, `area_atividade`, `numero_trabalhadores`, `producao_vaca`, `preco_recebido`, `preco_referencia`, `ccs`.
  * **Ação "Cadastrar":** Submete os dados para o endpoint BFF `POST /api/produtores`. Em caso de sucesso, exibe notificação positiva, colapsa o formulário e atualiza instantaneamente a lista de fazendas cadastradas.
* **Componentes Afetados:**
  * `src/app/api/produtores/route.ts` *(Novo)*: Endpoint BFF que proxeia a requisição para a API externa.
  * `src/components/CadastrarFazendaSection.tsx` *(Novo)*: Componente React isolado para gerenciar a expansão e submissão.
  * `src/app/formulario/page.tsx`: Integrar o novo componente `CadastrarFazendaSection`.

---

### 📋 Feature 3: Aprimoramento da Lista de Fazendas Cadastradas ("Iniciar Diagnóstico")

* **Descrição:** Enriquecer a listagem de fazendas cadastradas do consultor com uma ação direta de execução de diagnóstico por fazenda.
* **Comportamento de UX:**
  * Exibir a lista de fazendas retornada por `GET /api/formularios` em um grid/card visual elegante.
  * Adicionar em cada item o botão destacado **"Iniciar Diagnóstico"**.
  * Ao clicar no botão "Iniciar Diagnóstico", o sistema recupera os dados zootécnicos atualizados da fazenda via `GET /api/formularios/farms/{nome}` e redireciona automaticamente o consultor para a tela de processamento `/carregando`, iniciando a análise incremental na API.
* **Componentes Afetados:**
  * `src/app/formulario/page.tsx`: Reformular o bloco de listagem de fazendas cadastradas.
  * `src/app/api/formularios/route.ts`: Garantir o mapeamento correto do sub-recurso `/farms/{nome}`.

---

### ⚡ Feature 4: Simplificação e Padronização da Rota de Simulação (POST /api/simulacao)

* **Descrição:** Alinhar o envio do payload de simulação com a especificação padronizada de Enums da API v2.0.0.
* **Detalhamento:**
  * Remover conversores manuais no client-side, permitindo o envio nativo dos Enums canônicos em kebab-case (`compost-barn`, `confinado-sem-estrutura`, `semiconfinado`).
  * Atualizar o BFF `src/app/api/simulacao/route.ts` para repassar o payload diretamente com cabeçalhos `X-API-KEY`.
* **Componentes Afetados:**
  * `src/app/simulacao/page.tsx`
  * `src/app/api/simulacao/route.ts`

---

### 🛡️ Feature 5: Tratamento de Erros Estruturados & Telemetria de IA

* **Descrição:** Exibir mensagens de erro ricas e amigáveis baseadas no catálogo global de erros da API Ishikawa e suporte a headers de telemetria.
* **Detalhamento:**
  * Parse de respostas de erro da API com formato `{ error_code, message, details }`.
  * Tratar erros específicos como `DUPLICATE_EMAIL` (HTTP 409), `INVALID_HERD_SIZE` (HTTP 400), `FARM_NOT_FOUND` (HTTP 404).
  * Tratamento de validação Pydantic `HTTP 422` com destaque visual nos campos do formulário afetados.
* **Componentes Afetados:**
  * `src/lib/apiUtils.ts`
  * `src/components/CadastrarFazendaSection.tsx`
  * `src/app/formulario/page.tsx`

---

## 🛠️ 3. Plano de Execução (Fases de Implementação)

1. **Fase 1: Infraestrutura de Autenticação BFF (Feature 1)**
   - Implementar `/api/auth/route.ts`, `/api/auth/logout`, `/api/auth/me` e `src/proxy.ts`.
   - Atualizar a UI do `src/app/login/page.tsx`.

2. **Fase 2: Gestão de Produtores e Fazendas (Features 2 e 3)**
   - Implementar `/api/produtores/route.ts`.
   - Construir o componente `CadastrarFazendaSection.tsx`.
   - Reformular a lista de fazendas com o botão "Iniciar Diagnóstico" em `src/app/formulario/page.tsx`.

3. **Fase 3: Refatoração de Simulação & Tratamento Global de Erros (Features 4 e 5)**
   - Padronizar chamadas a `POST /api/simulacao`.
   - Aplicar parser universal de erros em `src/lib/apiUtils.ts`.
