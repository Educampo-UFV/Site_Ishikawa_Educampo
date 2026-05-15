# 🔮 Módulo de Simulação de Cenários (`/app/simulacao`)

Este diretório concentra a interface e a lógica da **Ferramenta de Simulação de Cenários (What-If Analysis)** do Site Ishikawa Educampo.

## 📖 O que este diretório faz?

É o painel analítico interativo onde o produtor rural (não-programador) ou o consultor pode manipular as variáveis atuais da sua propriedade e projetar (com base na predição algorítmica) como pequenas melhorias impactarão na sua margem financeira no fim do ciclo produtivo. 

Para desenvolvedores, este diretório encapsula a interface interativa isolada da store global para experimentação de variáveis ("What-If"), implementando lógica de limitação de taxa (Rate Limiting) no lado do cliente.

### Funcionalidades e Regras de Negócio

* **Isolamento de Estado (Sandbox):** A tela importa os dados originais resgatados pelo Zustand (`useFazendaStore`), mas transcreve-os para um estado reativo e descartável local. Isso garante que o usuário manipule os controles livremente sem corromper acidentalmente os dados reais do seu diagnóstico principal já gravados.
* **Motor de Simulação Rápido:** Componentes em tela garantem resposta fluida (UX responsivo) sem precisar fazer uma requisição exaustiva a cada alteração em *sliders*, mantendo as chamadas intensivas reservadas somente para quando o botão de simulação é de fato clicado.
* **Orquestração de Machine Learning e Rate Limiting:** Ao clicar em "Analisar Cenário", a tela envia os dados para a API `/api/simulacao` e incorpora um mecanismo de *cooldown* (bloqueio temporário por contador) sempre que o servidor retorna limite de acessos (429 Too Many Requests), guiando o usuário visualmente.
* **Renderização Visual Nativa:** O arquivo de página gerencia e renderiza componentes nativos embutidos para gráficos comparativos de barra puros e informativos, sem gerar custos excessivos de carga (bundle) com dependências externas.

## 🧩 Arquivos deste Módulo

* `page.tsx`: Ponto de entrada da rota. Renderiza o layout da tela, incluindo o painel de controles interativos esquerdo e a exibição de resultados em cartões métricos lado a lado.
* `README.md`: Este guia de documentação do diretório.
