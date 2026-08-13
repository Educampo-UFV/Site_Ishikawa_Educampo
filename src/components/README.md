---
tags: [documentacao, arquitetura, frontend]
status: active
---

# 📁 Components

> **Versão da Documentação:** 1.0.0  
> **Última Atualização:** 2026-06-23  
> **Status:** Ativo

---

## 🎯 Visão Geral (The Blueprint)

Este diretório armazena a biblioteca interna de componentes da interface de usuário da aplicação e os provedores globais. Seu objetivo é encapsular a lógica de renderização, gerenciamento de ciclo de vida visual e injeção de dependências do Next.js App Router (como o contexto global de *Tooltips* e de sessão), garantindo consistência visual e reaproveitamento.

---

## 🏗️ Arquitetura e Fluxo de Dados

A camada de componentes atua como a fundação visual do sistema. Os dados são majoritariamente passados via *props* pelos contêineres e páginas (ex: `page.tsx`). Os provedores injetam contexto diretamente na árvore React (`layout.tsx`).

* **Entrada:** Propriedades passadas pela camada de roteamento (App Router) e estados gerenciados via Zustand.
* **Saída:** Elementos de UI interativos, modais, *tooltips* e requisições utilitárias (ex: revalidação de sessão).

---

## 🗂️ Mapeamento de Componentes

### 📂 Subdiretórios

#### `📂 ui/`

* **Responsabilidade:** Biblioteca de UI estrita contendo componentes atômicos, templates estruturais (ex: Layout de Tela Dividida), gráficos e renderizadores. Para detalhes, veja o [README da pasta ui](./ui/README.md).
* **Contrato/Interface:** Exporta funções React altamente testadas, sem vínculo forte com dados de negócio globais.

---

### 📄 Arquivos Chave

#### `📄 GlobalProviders.tsx`

* **Responsabilidade:** Atua como o encapsulador raiz de contexto para a aplicação sob o *App Router* do Next.js.
* **Principais Funções/Classes:**
    * `GlobalProviders`: Inicializa provedores de estado visual globais (ex: `Tooltip.Provider` do Radix UI) permitindo que o React otimize e unifique comportamentos na Virtual DOM (ex: debounce unificado de *hover* em dezenas de tooltips).
* **Dependências Críticas:** `@radix-ui/react-tooltip`.

#### `📄 SessionRefresher.tsx`

* **Responsabilidade:** Gerencia o tempo de vida (Heartbeat/Polling) da sessão local.
* **Principais Funções/Classes:**
    * `SessionRefresher`: Roda silenciosamente no *client-side* disparando requisições periódicas via hook para revalidar a sessão e empurrar o limite de expiração caso o usuário permaneça ativo na tela.

#### `📄 CadastrarFazendaSection.tsx`

* **Responsabilidade:** Componente expansível para cadastro de novas propriedades rurais e produtores.
* **Principais Funções/Classes:**
    * `CadastrarFazendaSection`: Formulário colapsável integrado ao endpoint BFF `POST /api/produtores`, com validações zootécnicas client-side via Zod e callback de atualização.
* **Rastreabilidade:** `Ref: Obsidian note [[sdd-cadastrar-fazenda.md]]` | `Ref: Obsidian note [[bdd-cadastrar-fazenda.md]]`

---

## 🧠 Decisões de Design & Trade-offs

* **Decisão:** Separar a `ui/` dos componentes vitais/funcionais como provedores.
* **Motivo:** Garantir que elementos puramente estéticos (botões, modais) não se misturem com elementos orquestradores de ciclo de vida do React (Providers, Refreshers).
* **Trade-off / Débito Técnico:** Aumenta a árvore de diretórios, mas fortalece a rastreabilidade e a filosofia do *Single Responsibility Principle*.

* **Decisão:** Instanciação do `Tooltip.Provider` no `GlobalProviders.tsx`.
* **Motivo:** Otimização pesada da árvore DOM para lidar com as páginas de simulação que podem conter dezenas de Sliders e Tooltips interativos simultâneos, economizando alocação redundante de wrappers e garantindo um *delay* de abertura padronizado e acessível (WCAG).

---

## 🧪 Estratégia de Testes

* **Tipo de Teste dominante:** Testes de renderização com Jest, JSDOM e React Testing Library (`tests/components/`).
* **Cenários Críticos:** Montagem de Provider Wrappers garantindo que Tooltips e Sessions não provoquem memory leak. Validação de comportamentos na árvore do Virtual DOM.
* **Estratégia de Mocking:** O *ResizeObserver* e os nós de *Portal* do Radix UI são *mockados* ou acompanhados no setup do JSDOM. Eventos de *user-event* testam foco, teclado (TAB) e hover dos elementos visuais.
