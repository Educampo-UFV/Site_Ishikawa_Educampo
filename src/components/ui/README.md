# Diretório: `/src/components/ui`

Este diretório armazena os **Componentes de Interface (UI)** que são reutilizáveis e agnósticos em relação à regra de negócio. O foco exclusivo destes componentes é a apresentação visual, acessibilidade e adaptação a diferentes tamanhos de tela.

## 📄 Arquivos Principais

* **`SplitScreenLayout.tsx`:**
  Um componente estrutural de layout (Wrapper) que serve como "moldura" visual.
  - **Responsividade:** Em dispositivos móveis (telas pequenas), exibe o formulário em tela cheia com um banner no topo. Em desktops (telas grandes), divide a tela no padrão 50/50.
  - **Design System:** Herda e aplica automaticamente os gradientes da marca (`from-primary` to `primary-light`).
  - **Propósito:** Impedir a duplicação de classes CSS complexas. Ao usar este layout, qualquer página herda instantaneamente o design corporativo aprovado, protegendo os desenvolvedores de precisarem recriar a identidade visual a cada nova tela.

* **`Acelerometro.tsx`:**
  Um widget de diagnóstico completo em formato de velocímetro (Gauge Chart) construído em puro SVG (sem dependências pesadas de bibliotecas de gráficos).
  - **Visualização Dinâmica:** Renderiza o gráfico, o valor numérico, a unidade e as zonas de cor (Bom, Regular, Crítico).
  - **Inteligência de Limites (Thresholds):** Calcula automaticamente os limites extremos do gráfico extraindo os números das regras de negócio (ex: `>= 200`) fornecidas pela API. Ele se autoajusta de forma inteligente para indicadores onde "maior é melhor" (ex: Produção) e "menor é melhor" (ex: CCS), invertendo a paleta de cores automaticamente.

* **`Navbar.tsx`:**
  Componente global de cabeçalho (Top Bar).
  - **Responsividade e UX:** Apresenta o logotipo e um botão "hamburger" no formato de overlay com animação de morphing (transforma-se em um "X").
  - **Acessibilidade:** Gerencia a sobreposição (z-index) e o foco, com comportamento interativo limpo (fecha ao clicar fora do menu ou ao selecionar um link).

* **`IshikawaDiagram.tsx`:**
  Componente visual responsável por estruturar os retornos complexos da metodologia de causa e efeito.
  - **Layout Acessível:** Substitui gráficos de espinha de peixe complexos por um design de grid com 6 *cards* responsivos para cada pilar (os 6 Ms), facilitando drasticamente a leitura em dispositivos móveis.
  - **Interatividade:** Apresenta um Modal centralizado para o aprofundamento das causas raiz e exibição das práticas recomendadas sugeridas pela IA.