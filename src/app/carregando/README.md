# ⏳ Módulo de Processamento (Tela de Carregamento)

Este diretório contém a lógica de transição entre a coleta de dados e a exibição dos resultados analíticos.

## 📖 O que este diretório faz?
A página de carregamento atua como o **orquestrador de fluxo** da aplicação. Em vez de fazer o usuário esperar no formulário, nós o movemos para este ambiente controlado que:

1.  **Valida o Estado:** Verifica se existem dados na `useFazendaStore`. Se o usuário tentar acessar esta rota manualmente sem preencher o formulário, ele é expulso de volta para a coleta de dados.
2.  **Comunicação BFF (Requisições Paralelas):** Realiza chamadas `POST` simultâneas para os nossos proxies seguros (`/api/diagnostico` e `/api/simulacao`) para otimizar o tempo de espera.
3.  **Persistência de Resposta:** Recebe os resultados complexos gerados pela API (Diagnóstico da IA e Resultados da Simulação) e os armazena no estado global via Zustand.
4.  **Feedback Visual:** Utiliza animações e mensagens de status textuais para reduzir a percepção de espera do usuário.

## 🧩 Arquivos
* `page.tsx`: Componente principal que gerencia o estado visual de carregamento, dispara as requisições em paralelo e orquestra o redirecionamento final.
* `README.md`: Este guia de documentação do diretório.

## 🗺️ Fluxo de Navegação
`Formulário` -> `Carregando (Processamento)` -> `Diagnóstico`