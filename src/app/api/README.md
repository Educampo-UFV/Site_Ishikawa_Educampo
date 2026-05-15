# Backend-For-Frontend (BFF) - API Interna

Este diretório abriga a camada **BFF (Backend-For-Frontend)** da aplicação. No ecossistema do Next.js, estas rotas atuam como os intermediários seguros e vitais entre a interface visual (navegador do produtor) e as APIs e microsserviços do backend corporativo (Inteligência Artificial, Autenticação, etc.).

## 🛡️ O Que Este Módulo Faz

A responsabilidade central da pasta `/api` é prover **segurança de arquitetura e abstração**:
* **Ocultação de Chaves (Proxying):** Protege tokens de autorização e chaves de APIs externas, garantindo que nunca sejam enviados ao navegador do usuário.
* **Proteção de Sessão (*Zero-Token-Exposure*):** Garante a injeção cega de *tokens* via cabeçalhos HTTP (cookies em `HttpOnly` e `Secure`), mitigando riscos de roubo por scripts (*XSS*).
* **Validação de Barreira:** Filtra e garante a integridade de *payloads* oriundos do *Frontend* antes que sobrecarreguem ou causem erros no *Backend* definitivo em Python.

---

## 📂 Estrutura de Subdiretórios

Cada rota possui responsabilidades de negócio bem delimitadas. Consulte as documentações individuais para compreender seus contratos e fluxos:

* **🔑 Auth (`/auth`):** Rota dedicada ao fluxo de segurança. Recebe os dados de login, valida o acesso do produtor e configura uma sessão temporária invisível ao cliente (embutindo o JWT).

* **🧠 Diagnóstico (`/diagnostico`):** Atua como o proxy de varredura completa do sistema. Mascara as chaves corporativas e atua repassando dados seguros à IA para processar as narrativas descritivas e causas do Diagrama de Ishikawa.

* **📈 Simulação (`/simulacao`):** Uma via de acesso super-rápida, projetada para a alta frequência de chamadas do Simulador de Cenários. Responde em milissegundos conectando a aplicação aos algoritmos preditivos e de *Machine Learning* sem travar a interface do *Frontend*.