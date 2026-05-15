# Diretório: `/src/components/ui`

Este diretório armazena os **Componentes de Interface (UI)** reutilizáveis que compõem o design system da aplicação. O foco deste agrupamento é estritamente a camada de apresentação visual, acessibilidade, componentes base interativos e a adaptação flexível das telas para diferentes dispositivos (mobile e desktop).

## 📄 Arquivos Principais

* **`SplitScreenLayout.tsx`:**
  **O que é:** Um template estrutural de envoltório de rotas baseando-se no formato de layout de tela dividida.
  **Propósito:** Encapsular as áreas complexas (como formulários de dados e simulações) em um contêiner padronizado que atende à identidade visual da marca sem que seja preciso duplicar e reconstruir lógicas pesadas de responsividade.

* **`Acelerometro.tsx`:**
  **O que é:** Um gráfico em forma de velocímetro (Gauge) da performance de indicadores singulares.
  **Propósito:** Destacar visualmente, por meio de arcos percentuais, em qual zona e categoria exata um indicador da fazenda do produtor acabou de cair se comparado à régua da IA.

* **`Navbar.tsx`:**
  **O que é:** Menu superior de navegação da aplicação.
  **Propósito:** Oferecer a navegação contínua interativa pelas áreas da aplicação em qualquer módulo atual que o cliente se encontre logado.

* **`IshikawaDiagram.tsx`:**
  **O que é:** Interface centralizadora e simplificada da leitura hierárquica de Causa e Efeito mapeada nos 6 Ms do Diagrama de Ishikawa.
  **Propósito:** Embeber os dados gerados pela análise massiva de dados sem poluir e desconfigurar o visual no mobile, trocando o padrão "espinha de peixe" gigante por um conceito elegante e modular com categorizações e interatividades simples (cards).

* **`CausaItem.tsx`:**
  **O que é:** A linha ou fragmento atomizado de um diagnóstico que constrói as fileiras de listas das categorias na tela.
  **Propósito:** Renderizar de forma simplificada o alerta crítico, dando a possibilidade de interagir nele como um botão (Popover/Accordion) se mais de seus detalhes precisarem ser vistos.

* **`TextoComCitacoes.tsx`:**
  **O que é:** Componente transformador e renderizador de textos criados por Inteligência Artificial (LLMs).
  **Propósito:** Prover interatividade sobre a leitura massiva de recomendações, quebrando padrões específicos devolvidos da IA e gerando blocos que convidam os usuários aos aprofundamentos daquele texto.

* **`ImpactFactorBar.tsx`:**
  **O que é:** Fita visual quantitativa indicadora de progresso dividida por seções para aprofundamento comparativo de métricas.
  **Propósito:** Transmitir com facilidade a margem de progresso que falta de alcance linear para se afastar da zona crítica e alcançar o alvo/teto avaliativo regional dos produtores para dado parâmetro do banco de dados.