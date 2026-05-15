# Módulo de Tipagens (Types)

## 📖 O que este diretório faz?

Este diretório centraliza todas as definições de tipos (TypeScript) utilizadas no **Site Ishikawa Educampo**. 

O objetivo principal desta pasta é fornecer os "contratos" estruturais (interfaces e types) que garantem a integridade dos dados em toda a aplicação. Isso significa que ela define exatamente qual o formato esperado para as informações que trafegam entre as diferentes camadas do sistema (Backend-For-Frontend, gerenciadores de estado como o Zustand, e os componentes visuais da UI).

Ao manter essas definições centralizadas aqui, garantimos que toda a equipe de desenvolvimento e as próprias ferramentas de inteligência artificial compreendam e respeitem a estrutura de dados de ponta a ponta sem ambiguidades.

### Responsabilidades
* **Contratos de Dados:** Define os modelos exatos que a API de Diagnóstico (BFF) irá retornar e o frontend irá consumir.
* **Padronização Visual:** Estabelece os tipos literais usados para estilização condicional na interface (ex: `StatusComparacao`, `SeveridadeCausa`).
* **Estruturação do Diagrama:** Modela hierarquicamente as categorias e os itens que compõem o Diagrama de Ishikawa.

> 💡 **Nota para Desenvolvedores:** A explicação de *como* cada tipo ou interface funciona internamente, juntamente com o detalhamento de suas propriedades, está documentada nas **DocStrings** inseridas diretamente dentro do código-fonte do arquivo `diagnostico.ts` (e demais arquivos futuros).