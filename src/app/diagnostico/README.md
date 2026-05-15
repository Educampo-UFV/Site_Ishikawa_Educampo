# 📊 Módulo: Tela de Diagnóstico

## 📖 O que este diretório faz?

Este diretório contém a página principal de resultados da aplicação, atuando como o **Hub Central de Diagnóstico (Dashboard)**. 

* **Para Não-Programadores (Produtores e Consultores):** É nesta tela que o produtor rural visualiza o resultado final da análise da sua fazenda. Ele consegue ver como seus números se comparam com a média da região (Benchmarking), lê um resumo inteligente com recomendações geradas por Inteligência Artificial e interage com o "Espinha de Peixe" (Diagrama de Ishikawa) para descobrir as causas raízes dos seus problemas e o que fazer para melhorar.
* **Para Programadores:** Este módulo é responsável por consumir o estado global preenchido pela IA (`useFazendaStore`), proteger a rota contra acessos diretos sem dados prévios (Route Guard), e realizar um pequeno processamento de dados (ETL no frontend) para transformar o JSON bruto da API no formato categorizado pelos 6 Ms (Mão de obra, Máquina, Meio ambiente, Método, Medida, Material) exigido pelo componente visual do diagrama.

## 📁 Estrutura de Arquivos

* `page.tsx`: Componente React principal. Orquestra a hidratação do Zustand, processa os dados de impacto/causas e renderiza os componentes visuais de Benchmarking, Resumo IA e Diagrama de Ishikawa.
* `README.md`: O guia de documentação funcional deste módulo (este arquivo).

## 🧠 Arquitetura e Fluxo de Dados (ETL Frontend)

Como a resposta da API externa pode trazer a lista de causas de forma unificada, o `page.tsx` possui uma responsabilidade importante de **Categorização**. 
A função `processarDados` varre a lista de causas da IA e as distribui nos pilares (os "6 Ms") do Ishikawa de acordo com a string retornada no campo `pilar`. Isso garante que o componente `<IshikawaDiagram />` receba uma estrutura de dados perfeitamente formatada para a renderização visual das "espinhas" do diagrama.

## 🎨 Layout e Experiência do Usuário (UX)

* **Benchmarking:** Grid no topo da página comparando a performance atual do produtor (Produção, Qualidade, Preço) informando se ele está Acima da Média, em Atenção ou Excelente.
* **Resumo Estratégico IA:** Um painel de destaque que consome o objeto `resumo_geral` para apresentar a conclusão e as diretrizes táticas da fazenda.
* **Stepper de Indicadores:** Uma navegação interativa (Abas) no formato de passos conectados por linhas. Permite ao usuário alternar a análise do Diagrama de Ishikawa entre diferentes indicadores (CCS, Produção, etc) de forma imersiva e responsiva.

## ⚠️ Dívida Técnica: Cálculos Temporários

### ⚠️ Importante: Cálculos Temporários (Dívida Técnica)
Conforme definição de projeto para a Sprint atual, os cálculos de benchmarking estão sendo realizados **diretamente no frontend** dentro de `page.tsx`. 

> **TODO:** Estes cálculos são temporários. Em versões futuras, a lógica de comparação regional e por sistema de produção deve ser delegada integralmente ao **BFF (Backend-for-Frontend)** ou à **API Educampo**, para garantir que os critérios de "Média Regional" sejam dinâmicos e baseados em dados reais de toda a base.

**Critérios Atuais (Hardcoded):**
1.  **Produção por Vaca:** * `>= 30 L/dia`: "Acima da Média" (Verde)
    * `< 30 L/dia`: "Atenção" (Âmbar)
2.  **Qualidade (CCS):**
    * `<= 200`: "Excelente" (Verde)
    * `> 200`: "Atenção" (Âmbar)
3.  **Preço Recebido:**
    * `>= Preço de Referência`: "Competitivo" (Verde)
    * `< Preço de Referência`: "Abaixo do Mercado" (Âmbar)

## 🧪 Validação
A integridade deste módulo é garantida pelo arquivo de teste:
`tests/components/diagnostico.spec.tsx` (Testado via RTL e Jest).