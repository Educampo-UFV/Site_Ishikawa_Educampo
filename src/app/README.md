# 🚀 Diretório Raiz da Aplicação (`/app`)

Este é o diretório raiz do **Next.js App Router**. Ele contém o layout mestre da aplicação, estilos globais, configurações de tema e as rotas principais do sistema.

##  O que este diretório faz?

Este diretório atua como o ponto de entrada e orquestrador principal de todas as páginas e rotas da aplicação. Ele define a estrutura base (HTML/Body), provê o sistema de design global via Tailwind CSS e atua como o roteador mestre, onde cada subdiretório representa uma rota na URL.

## 🧩 Arquivos deste Módulo

* **`layout.tsx` (Root Layout):** A "casca" obrigatória de todo o sistema. Ele injeta as tags HTML fundamentais (`<html>` e `<body>`) para envolver as rotas da aplicação. É o responsável por importar o `globals.css`, aplicando o sistema de cores base e a cor de fundo padrão em todas as telas.
* **`globals.css`:** Responsável por inicializar o **Tailwind CSS v4** (via diretiva `@import "tailwindcss";`) e centralizar o nosso **Design System**. Dentro do bloco `@theme`, mapeamos as cores institucionais do Educampo para nomenclaturas semânticas (como `--color-primary` e `--color-fundo`), garantindo uma "Única Fonte de Verdade" para a identidade visual do projeto.
* **`page.tsx`:** A página raiz (Home) da aplicação.
* **`README.md`:** Este guia de documentação do diretório.

## 🔗 Subdiretórios (Rotas)

* 🔧 `/ajustes` - Rota para edição e ajuste de dados previamente inseridos.
* ⚙️ `/api` - Endpoints internos do nosso Backend-For-Frontend (BFF).
* ⏳ `/carregando` - Tela de feedback visual e validação de hidratação de dados.
* 📊 `/diagnostico` - Hub central de resultados: Benchmarking, Resumo IA e Diagrama de Ishikawa.
* 🚜 `/formulario` - Rota de coleta de dados operacionais da fazenda.
* 🔒 `/login` - Rota visual para autenticação de usuários.
* 🔮 `/simulacao` - Simulador iterativo de cenários zootécnicos e financeiros.