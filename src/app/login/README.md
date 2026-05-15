# Módulo de Autenticação (`/app/login`)

## 📖 O que este diretório faz?

Este diretório contém a interface pública de autenticação da plataforma. Ele atua como a porta de entrada segura para os produtores rurais e consultores que utilizarão o Diagnóstico Ishikawa.

### Funcionalidades e Regras de Negócio
* **Acesso Seguro (Zero-Token-Exposure):** O formulário tem o objetivo estrito de coletar as credenciais (usuário e senha) e enviá-las ao nosso intermediário de segurança (BFF). Ele garante que o frontend permaneça cego para tokens sensíveis, não armazenando dados no navegador (como `localStorage`).
* **Interface Focada:** A tela delega toda a complexidade visual (responsividade, fundos, imagens) para o componente de layout estrutural, mantendo sua responsabilidade restrita apenas ao fluxo e feedback de login.
* **Facilitador de Testes:** Conta com atalhos para auto-preenchimento de credenciais em tela, agilizando as validações de fluxo.

## 🧩 Arquivos deste Módulo
* `page.tsx`: A interface reativa principal que apresenta o formulário de login e lida com o estado de carregamento e erros da autenticação.
* `README.md`: Este guia de documentação do diretório.