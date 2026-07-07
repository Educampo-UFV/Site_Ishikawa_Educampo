---
project: "Site_Ishikawa_Educampo"
branch: "feature/float-simulacao-inputs"
version: "1.0.0"
date: "2026-07-06"
status: "Active"
type: "docs"
tags:
  - "documentacao"
  - "simulacao"
  - "frontend"
---
# 🔮 Módulo de Simulação de Cenários (`/app/simulacao`)

Este diretório concentra a interface e a lógica da **Ferramenta de Simulação de Cenários (What-If Analysis)** do Site Ishikawa Educampo.

## 📖 O que este diretório faz?

É o painel analítico interativo onde o produtor rural ou o consultor pode manipular as variáveis atuais da sua propriedade e projetar como pequenas melhorias impactarão na sua margem financeira no fim do ciclo produtivo.

Para desenvolvedores, este diretório encapsula a interface interativa isolada da store global para experimentação de variáveis ("What-If"), implementando lógica de limitação de taxa (Rate Limiting) e configurando `steps` visuais refinados que acompanham a precisão das APIs.

### Funcionalidades e Regras de Negócio

* **Isolamento de Estado (Sandbox):** A tela importa os dados originais resgatados pelo Zustand, mas transcreve-os para um estado reativo descartável local. 
* **Precisão Decimal em Controles Demográficos:** Diferente das versões legadas que limitavam a `step: 1` para trabalhadores e vacas, o painel da simulação (em seus `defaultParams`) agora utiliza `step: 0.5`. Isso suporta preenchimento de médias demográficas consolidadas durante o ano pelo consultor (ex: 2.5 trabalhadores ativos em média no semestre).
* **Motor de Simulação Rápido:** Componentes em tela garantem resposta fluida (UX responsivo) sem precisar fazer uma requisição exaustiva a cada alteração, mantendo as chamadas intensivas reservadas somente para quando o botão de simulação é clicado.
* **Orquestração de Machine Learning e Rate Limiting:** Mecanismo de *cooldown* quando o servidor retorna 429 Too Many Requests.
* **Renderização Visual Nativa:** Gerencia e renderiza gráficos nativos embutidos.

## 🧩 Arquivos deste Módulo

* `page.tsx`: Ponto de entrada da rota. Renderiza o layout da tela, incluindo o painel de controles interativos esquerdo (`defaultParams` definidos com suporte a `step=0.5`) e a exibição de resultados em cartões métricos.
* `README.md`: Este guia de documentação do diretório.

## Related Context

* **Reference Note:** [[API_Ishikawa_Educampo_2026-07-06_herd-averages-float.md]]
