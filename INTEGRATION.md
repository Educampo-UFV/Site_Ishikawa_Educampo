# 🤝 Guia de Integração da API Ishikawa Educampo

Este documento é o guia central para desenvolvedores que desejam consumir e entender a API Ishikawa Educampo. Ele detalha os endpoints disponíveis, as estruturas de dados esperadas, as decisões de arquitetura e a lógica de negócio por trás dos cálculos e análises de inteligência artificial.

---

## 🔌 Consumo da API

A interação com a API é feita através de endpoints RESTful. Todas as requisições que exigem autenticação devem incluir um header `X-API-KEY`.

### Headers Obrigatórios

Para rotas protegidas, o seguinte header é mandatório:

*   `X-API-KEY`: `<sua_chave_secreta_interna>`

### Rotas Disponíveis

Nesta seção, adotamos a abordagem de **Agrupamento em Linha**. Para cada endpoint listado, você encontrará a explicação do seu propósito, um cURL pronto para uso demonstrando o *payload* exato validado pelo Pydantic, um exemplo de resposta JSON estruturada e as fórmulas matemáticas que sustentam a geração daquela resposta.

---

#### `POST /api/diagnostico`

*   **Propósito:** Endpoint principal que gera a análise completa da fazenda. Ele processa os dados brutos, executa o motor de regras, calcula o benchmarking, aciona a Inteligência Artificial para gerar o resumo executivo e retorna o diagnóstico consolidado.
*   **Autenticação:** Requer `X-API-KEY`.
*   **Rate Limit:** Limitado para evitar abusos (ver `RATE_LIMIT_DIAGNOSTICO` nas constantes).

*   **Campos de Entrada (`application/json`):**

    | Campo | Tipo | Exemplo | Descrição |
    | :--- | :--- | :--- | :--- |
    | `sistema_producao` | string | `"compost_barn"` | Sistema produtivo (ex: "compost_barn", "confinado", "semi_confinado"). |
    | `regiao_sebrae` | string | `"triangulo"` | Região geográfica para fins de benchmarking. |
    | `total_vacas` | integer | `100` | Número total de vacas (em lactação ou secas). |
    | `percentual_lactacao` | float | `85.0` | Percentual do rebanho adulto que está em lactação. |
    | `total_rebanho` | integer | `120` | Número total de animais na propriedade. |
    | `area_atividade` | float | `10.0` | Área em hectares dedicada à atividade leiteira. |
    | `numero_trabalhadores`| integer | `2` | Número de funcionários diretos na atividade. |
    | `producao_vaca` | float | `35.0` | Produção média diária por vaca em lactação (L/vaca/dia). |
    | `preco_recebido` | float | `3.20` | Preço médio recebido por litro de leite (R$). |
    | `preco_referencia` | float | `2.50` | Preço de referência da região ou do laticínio. |
    | `ccs` | integer | `150` | Contagem de Células Somáticas (x1000 cél/mL). |

*   **Exemplo de Chamada:**
    ```bash
    curl -X 'POST' \
      'http://localhost:8000/api/diagnostico' \
      -H 'accept: application/json' \
      -H 'X-API-KEY: 42' \
      -H 'Content-Type: application/json' \
      -d '{
      "area_atividade": 10,
      "ccs": 150,
      "numero_trabalhadores": 2,
      "preco_recebido": 3.2,
      "preco_referencia": 2.5,
      "producao_vaca": 35,
      "regiao_sebrae": "triangulo",
      "sistema_producao": "compost_barn",
      "total_rebanho": 120,
      "total_vacas": 100,
      "percentual_lactacao": 85.0
    }'
    ```

*   **Exemplo de Resposta (`AnalysisResponse`):**

    ```json
    {
      "resumo_geral": {
        "raciocinios": [
          {
            "id": 1,
            "fontes": ["CCS", "Produção/Vaca"],
            "analise_tecnica": "A análise cruzada dos dados indica que a alta CCS está impactando negativamente a produção individual..."
          }
        ],
        "visao_geral": "A fazenda apresenta um ponto crítico na qualidade do leite que, se corrigido, pode alavancar a rentabilidade..."
      },
      "benchmarking": [
        {
          "titulo": "Qualidade do Leite (CCS)",
          "valor_produtor": 150.0,
          "valor_referencia": 350.0,
          "unidade_medida": "x1000 céls/mL",
          "status_comparacao": "positivo",
          "mensagem_curta": "Excelente",
          "mensagem_detalhada": "Sua CCS está 57.1% melhor que a mediana da sua região."
        }
      ],
      "indicadores": {
        "producao_vaca": {
          "titulo": "Produção Média Diária por Vaca",
          "status": "critico",
          "textos_analise": "A produção de 18.5 L/vaca/dia está abaixo do esperado e a CCS de 650 indica um Gargalo Sanitário...",
          "unidade_medida": "L/vaca/dia",
          "impacto_pilares": {
            "Mão de Obra": 45.5,
            "Meio Ambiente": 12.0
          },
          "tag": "Gargalo Sanitário",
          "thresholds": {
            "valor_atual": 18.5,
            "unidade_medida": "L/vaca/dia",
            "grafico_min": 12.0,
            "grafico_max": 38.5,
            "bom": "> 26.89",
            "regular": "> 22.39 AND <= 26.89",
            "critico": "<= 22.39"
          },
          "fatores_impacto": {
            "ccs": {
              "titulo": "CCS (Contagem de Células Somáticas)",
              "valor_atual": 650.0,
              "unidade_medida": "x1000 céls/mL",
              "grafico_min": 0.0,
              "grafico_max": 1000.0,
              "regras": {
                "bom": "< 200",
                "critico": "> 500"
              }
            }
          },
          "causas": [
            {
              "id": "producao_vaca-mao_de_obra-1",
              "pilar": "Mão de Obra",
              "resumo_pratica": "Falha na rotina de ordenha",
              "pratica": "Estabelecer POP de ordenha e treinar os funcionários...",
              "severidade": "critica",
              "analise": "A CCS de 650 aponta para problemas graves de higiene na ordenha..."
            }
          ]
        }
      }
    }
    ```

*   **🧮 Fórmulas e Cálculos Atrelados:**
    A API refaz as contas operacionais baseadas nos inputs brutos:
    *   **Dedução de Vacas em Lactação:** `total_vacas * (percentual_lactacao / 100)` (Ex: `100 * (85.0 / 100) = 85 vacas`). *Esta variável deduzida internamente é usada nos cálculos abaixo:*
    *   **Volume Diário (L/dia):** `producao_vaca * vacas_lactacao` (Ex: `35.0 * 85 = 2975.0 L/dia`)
    *   **Produção por Área (L/ha/ano):** `(producao_vaca * vacas_lactacao * 365) / area_atividade` (Ex: `(35.0 * 85 * 365) / 10 = 108587.50 L/ha/ano`)
    *   **Produção por Funcionário (L/func/dia):** `(producao_vaca * vacas_lactacao) / numero_trabalhadores` (Ex: `2975.0 / 2 = 1487.50 L/func/dia`)
    *   **Lotação Animal (cab/ha):** `vacas_lactacao / area_atividade` (Ex: `85 / 10.0 = 8.50 cab/ha`)
    *   **Diferença Benchmarking (%):** `((valor_produtor - valor_referencia) / valor_referencia) * 100` (Aplica-se zona de empate técnico para validar "Na média").

---

#### `POST /api/simulacao`

*   **Propósito:** Rota de alta performance para recálculo de cenários e projeções visuais. Executa cálculos zootécnicos, extrai os quartis (inferior, intermediário/mediana, superior) do benchmarking e aciona uma API de Machine Learning externa para projetar o custo do leite. Ela **não** aciona o serviço de IA Gerativa (OpenRouter/LLM). Ideal para interfaces com "sliders" que permitem ao usuário simular o impacto de mudanças operacionais em tempo real.
*   **Autenticação:** Requer `X-API-KEY`.
*   **Rate Limit:** 60 requisições por minuto (adequado para uso contínuo em interfaces reativas).

*   **Exemplo de Chamada:**
    ```bash
    curl -X 'POST' \
      'http://localhost:8000/api/simulacao' \
      -H 'accept: application/json' \
      -H 'X-API-KEY: 42' \
      -H 'Content-Type: application/json' \
      -d '{
      "dados_originais": {
        "area_atividade": 10,
        "ccs": 150,
        "custo_concentrado": 1.81,
        "numero_trabalhadores": 2,
        "percentual_lactacao": 60,
        "preco_recebido": 3.2,
        "producao_vaca": 25,
        "regiao_sebrae": "triangulo",
        "sistema_producao": "compost_barn",
        "total_vacas": 100
      },
      "dados_simulados": {
        "area_atividade": 10,
        "ccs": 150,
        "custo_concentrado": 1.81,
        "numero_trabalhadores": 2,
        "percentual_lactacao": 85,
        "preco_recebido": 3.2,
        "producao_vaca": 35,
        "total_vacas": 100
      }
    }'
    ```

*   **Exemplo de Resposta (`SimulacaoResponse`):**

    ```json
    {
      "simulacao": {
        "estaticas": [
          {
            "metrica": "string",
            "titulo_grafico": "string",
            "direcao_otimizacao": "maior_melhor",
            "cenarios": {
              "inferior": {
                "valor_produtor": 0,
                "valor_referencia": 0,
                "diferenca_percentual": 0
              },
              "intermediario": {
                "valor_produtor": 0,
                "valor_referencia": 0,
                "diferenca_percentual": 0
              },
              "superior": {
                "valor_produtor": 0,
                "valor_referencia": 0,
                "diferenca_percentual": 0
              }
            }
          }
        ],
        "operacionais": [
          {
            "metrica": "string",
            "titulo_grafico": "string",
            "direcao_otimizacao": "maior_melhor",
            "cenarios": {
              "inferior": {
                "valor_produtor": 0,
                "valor_referencia": 0,
                "diferenca_percentual": 0
              },
              "intermediario": {
                "valor_produtor": 0,
                "valor_referencia": 0,
                "diferenca_percentual": 0
              },
              "superior": {
                "valor_produtor": 0,
                "valor_referencia": 0,
                "diferenca_percentual": 0
              }
            }
          }
        ],
        "financeiras": [
          {
            "metrica": "string",
            "titulo_grafico": "string",
            "direcao_otimizacao": "maior_melhor",
            "cenarios": {
              "inferior": {
                "valor_produtor": 0,
                "valor_referencia": 0,
                "diferenca_percentual": 0
              },
              "intermediario": {
                "valor_produtor": 0,
                "valor_referencia": 0,
                "diferenca_percentual": 0
              },
              "superior": {
                "valor_produtor": 0,
                "valor_referencia": 0,
                "diferenca_percentual": 0
              }
            }
          }
        ]
      }
    }
    ```

*   **🧮 Fórmulas e Cálculos Atrelados (O Efeito Cascata Financeiro):**
    Os cálculos da simulação dependem do preditor assíncrono de Machine Learning. Uma vez de posse do `custo_estimado`, as margens são escalonadas:
    *   **Produção Diária (L/dia):** `producao_vaca * vacas_lactacao`
    *   **Margem por Litro (R$/L):** `preco_recebido - custo_estimado` (Ex: `3.20 - 2.74 = 0.46 R$/L`)
    *   **Margem Diária por Vaca (R$/vaca/dia):** `(Margem_Litro * Producao_Diaria) / Total_Vacas` (Ex: `(0.46 * 2975.0) / 100 = 13.68 R$/vaca/dia`)
    *   **Margem Anual Total (R$/ano):** `margem_litro * producao_diaria * 365` (Ex: `0.46 * 2975.0 * 365 = 499505.00 R$/ano`)
    *   **Diferença Segura (Cenários):** `((valor_produtor - valor_cenario) / abs(valor_cenario)) * 100`. (O uso do `abs()` previne falha matemática na exibição de gráficos onde o lucro de referência é negativo/prejuízo).

---

#### `POST /api/parametros-painel`

*   **Propósito:** Rota independente que fornece os limites matemáticos exatos (`min`, `max`, `step`, e as fronteiras `inferior/superior`) de onde até onde os *sliders* do usuário podem ir no Frontend. Impede valores irrealistas e distorções gráficas.
*   **Autenticação:** Requer `X-API-KEY`.

*   **Exemplo de Chamada:**
    ```bash
    curl -X 'POST' \
      'http://localhost:8000/api/parametros-painel' \
      -H 'accept: application/json' \
      -H 'X-API-KEY: 42' \
      -H 'Content-Type: application/json' \
      -d '{
      "sistema_producao": "compost_barn",
      "producao_vaca": 25.0,
      "percentual_lactacao": 60.0,
      "total_vacas": 100
    }'
    ```

*   **Exemplo de Resposta (`ParametrosPainelResponse`):**
    ```json
    {
      "parametros_painel": {
        "producao_vaca": {
          "inferior": {
            "min": 10.0, "max": 18.0, "step": 0.5,
            "fronteiras_cenario": { "limite_inferior": 12.0, "limite_superior": 18.0 }
          },
          "intermediario": {
            "min": 18.0, "max": 25.0, "step": 0.5,
            "fronteiras_cenario": { "limite_inferior": 18.0, "limite_superior": 25.0 }
          },
          "superior": {
            "min": 25.0, "max": 40.0, "step": 0.5,
            "fronteiras_cenario": { "limite_inferior": 25.0, "limite_superior": 38.0 }
          }
        }
      }
    }
    ```

*   **🧮 Lógica de Fatiamento (Quartis P25, P50, P75) e Inversão:**
    Para calcular os limites de um slider para o front, a base de dados do Pandas (mesmo volume, mesmo sistema) é repartida em blocos:
    *   **Q1 (P25) e Q3 (P75):** Limites que definem as transições entre pior, médio e excelente.
    *   **Inversão `menor_melhor`:** Se a métrica é reversa (ex: CCS, Custos Concentrados), os blocos são trocados estruturalmente. O bloco "Superior/Excelente" passa a ser os valores Mínimos até o Q1.
    *   **Folga de Transbordo Visual:** Os valores brutos de extremidade são expandidos em `10%` ou `20%` (via `MARGEM_TRANSBORDO_PAINEL`). Fórmulas: `Min_Visual = min_estatistico * 0.90` e `Max_Visual = max_estatistico * 1.10`. Isso evita que os sliders encostem na borda da tela.

---

#### `POST /api/reload-cache`

*   **Propósito:** Endpoint administrativo que força o recarregamento dos arquivos YAML (regras) e CSV (benchmarking) para a memória, sem a necessidade de reiniciar a API. Permite atualizações dinâmicas do "CMS Local".
*   **Autenticação:** Requer `X-API-KEY`.

*   **Exemplo de Chamada:**
    ```bash
    curl -X 'POST' 'http://localhost:8000/api/reload-cache' -H 'accept: application/json' -H 'X-API-KEY: 42'
    ```

*   **Exemplo de Resposta:**
    ```json
    { "message": "Cache recarregado com sucesso." }
    ```

---

#### `GET /api/health`

*   **Propósito:** Verifica a saúde e a versão da aplicação. Usado para monitoramento.
*   **Autenticação:** Requer `X-API-KEY`.

*   **Exemplo de Chamada:**
    ```bash
    curl -X 'GET' 'http://localhost:8000/api/health' -H 'accept: application/json' -H 'X-API-KEY: 42'
    ```

*   **Exemplo de Resposta:**
    ```json
    { "status": "healthy", "version": "2.0.1", "database": "loaded", "ml_api": "ready" }
    ```

---

#### `GET /api/ping`

*   **Propósito:** Rota ultra-leve, sem autenticação, projetada para "acordar" a API em ambientes de nuvem com *cold start* (como o Render). Usada pelo `healthcheck` do Docker ou monitores externos (ex: UptimeRobot). Ao manter esta API acordada, uma tarefa em *background* acoplada ao ciclo de vida da API continua em execução, garantindo que as APIs terceiras (como a de Machine Learning) também recebam "pings" contínuos em uma **Reação em Cadeia**.
*   **Autenticação:** Nenhuma.

*   **Exemplo de Chamada:**
    ```bash
    curl -X 'GET' 'http://localhost:8000/api/ping' -H 'accept: application/json'
    ```

*   **Exemplo de Resposta:**
    ```json
    { "status": "pong" }
    ```

---

## 🧠 Decisões de Arquitetura e Lógica Interna

### 🤖 Engenharia de Prompt: A Voz do Consultor Virtual

A geração da análise qualitativa é um processo orquestrado que combina múltiplos prompts para garantir uma resposta rica, estruturada e rastreável.

#### System Prompts (As Regras do Jogo)

1.  **`ishikawa_system_prompt.md`**:
    *   **Propósito**: Define a persona principal da IA como um "Consultor Sênior do Educampo".
    *   **Instruções Chave**: Exige que a IA siga um método de **Cadeia de Raciocínio (Chain of Thought)**, onde cada conclusão no resumo final deve ser justificada e suas fontes (os indicadores analisados) citadas. Também força a saída em um formato JSON estrito.
    *   **Análise Técnica (`analise_tecnica`)**: Instrução rigorosa para gerar o raciocínio técnico estruturado. Para garantir um padrão científico e explicável (Explainable AI), a IA é forçada a seguir estritamente a fórmula linear: `[Situação Atual da Fazenda] + [Critério de Classificação/Referência] + [Conclusão Técnica] + [Consequência Operacional/Financeira]`.

2.  **`severidade_system_prompt.md`**:
    *   **Propósito**: Guia a IA em uma tarefa mais granular: avaliar a severidade de cada causa-raiz (espinho do Ishikawa) para a realidade específica da fazenda.
    *   **Instruções Chave**:
        *   **Lidando com Dados Ausentes**: Instrui a IA a usar o indicador principal como um "proxy". Se a CCS está ótima (ex: 150), a IA deve deduzir que as rotinas de higiene são boas e classificar a causa como "neutra" ou "monitorar", em vez de reclamar da falta de dados.
        *   **Critérios de Severidade**: Define o que cada nível significa:
            *   `critica`: O gargalo é real e causa perdas financeiras ou sanitárias. Ação imediata.
            *   `atencao`: Ineficiência moderada que precisa de correção.
            *   `monitorar`: O indicador está bom, mas a prática sugerida é uma oportunidade de melhoria ou manutenção.
            *   `neutra`: A fazenda já tem excelência no ponto analisado.
        *   **Template de Resposta (CoT)**: Força a justificativa (`analise`) a seguir a fórmula: `[Situação da Fazenda] + [Critério de Referência] + [Conclusão sobre a Causa] + [Consequência]`.

#### User Prompts (A Tarefa a ser Feita)

1.  **`analise_ishikawa.md`**:
    *   **Propósito**: É o template da chamada principal, que gera o resumo executivo.
    *   **Dados Injetados**: Recebe o contexto completo:
        *   Dados da fazenda (sistema, região, rebanho).
        *   Resultados do benchmarking (comparações com a mediana regional).
        *   Análise técnica de cada indicador (gerada pelo motor de regras).
        *   A lista de práticas e causas de todos os indicadores.

2.  **`analise_severidade.md`**:
    *   **Propósito**: Template usado nas chamadas paralelas para avaliar a severidade das causas de **um único indicador por vez**.
    *   **Dados Injetados**: Recebe um contexto focado:
        *   Dados da fazenda.
        *   Benchmarking do indicador em questão.
        *   Análise técnica do indicador.
        *   Intervalos de `thresholds` (limites de Bom/Regular/Crítico).
        *   Intervalos de `fatores_impacto` (se houver).
        *   A lista de causas e práticas daquele indicador específico.

### 🧮 Lógica de Cálculos

A API refaz todos os cálculos internamente para garantir a integridade dos dados e evitar manipulação no frontend.

#### Benchmarking

O `BenchmarkingService` é responsável por comparar o desempenho da fazenda com outras propriedades similares.

1.  **Filtragem**: O serviço filtra o dataset (`base_ishikawa_otimizada.csv`) usando três critérios: `sistema_producao`, `faixa_producao` (deduzida dinamicamente) e o **ano mais recente** disponível na base. A região geográfica foi unificada, expandindo a amostra.
2.  **Cálculo da Mediana**: Em vez da média (que é sensível a outliers), a API calcula a **mediana** dos valores de referência para cada indicador. Isso garante uma comparação mais justa e representativa da "realidade do meio".
3.  **Zona de Empate Técnico**: Uma variação muito pequena (ex: 1%) pode não ser estatisticamente relevante. A API aplica uma "zona de empate" (configurada globalmente, ex: +/- 5%). Se a diferença percentual do produtor para a mediana estiver dentro dessa faixa, o status é `neutro`. Fora dela, é classificado como `positivo` ou `negativo`.

#### Simulações

A rota `/api/simulacao` foi projetada para velocidade (frontend em tempo real). Seu fluxo é uma versão simplificada do diagnóstico:

1.  Recebe os dados do produtor.
2.  Aciona o `ZootecniaCalculator` para derivar as métricas calculadas.
3.  Aciona o `BenchmarkingService` para extrair os cenários estatísticos (quartis Inferior, Mediana e Superior).
4.  Aciona o `MLClient` assincronamente para prever o custo estimado em três diferentes cenários.
5.  **Não aciona o `LLMService`** (que é a operação mais custosa da API).
6.  Retorna as 9 métricas consolidadas em milissegundos.

#### Impacto dos Pilares (`impacto_pilares`) e Níveis de Severidade

No objeto de cada indicador, o campo `impacto_pilares` quantifica o peso e a responsabilidade percentual de cada pilar (os 6M's: Mão de Obra, Meio Ambiente, etc.) para o cenário atual. 

A lógica de cálculo desse campo é diretamente ancorada nas **Severidades** atribuídas pela Inteligência Artificial às causas-raiz. A mecânica funciona assim:

1.  **Atribuição de Pesos**: Cada nível de severidade definido pela IA carrega um peso matemático interno (ex: `critica` = peso máximo, `atencao` = peso médio, `monitorar` = peso baixo, `neutra` = peso zero).
2.  **Somatório por Pilar**: A API agrupa todas as causas e soma os pesos atrelados a um mesmo pilar (ex: se "Mão de Obra" tem duas causas críticas, ela ganha muitos pontos).
3.  **Normalização Percentual**: A soma de todos os pilares é convertida para uma escala de 0 a 100%. Se a pontuação total do indicador for dominada pelo pilar "Mão de Obra", ele refletirá o maior percentual no `impacto_pilares` (ex: 80%).
4.  **Proteção contra Divisão por Zero**: Se a fazenda for excelente em tudo e todas as causas receberem severidade `neutra` (peso zero), a API processa a divisão de forma segura, distribuindo o impacto de forma branda ou zerada.

**Detalhando os Níveis de Severidade (Critérios e Exemplos)**
Para evitar alucinações matemáticas e refletir a realidade do campo, a IA obedece a critérios rigorosos ao definir a severidade de uma causa. Entender essa classificação é vital para compreender o balanço do `impacto_pilares`:

*   **`critica` (Peso Máximo)**: O gargalo é real e comprovado pelos dados operacionais. Sangra a rentabilidade ou a saúde do rebanho e exige ação corretiva prioritária.
    *   *✅ Quando é aplicado*: A CCS da fazenda é 800 (Péssima). A causa do YAML sugere "Falta de higiene na ordenha". A IA assinala **crítica**, pois o número ruim comprova a falha operacional que está causando perdas de bônus.
    *   *❌ Quando NÃO é aplicado*: A CCS da fazenda é 150 (Excelente). A IA **jamais** marcaria a "falta de higiene" como crítica aqui, pois o número prova que a higiene da propriedade já é de alto padrão.

*   **`atencao` (Peso Médio)**: A métrica indica ineficiência moderada. O problema causa perdas logísticas ou de produção, mas não é o maior ralo de caixa da fazenda.
    *   *✅ Quando é aplicado*: A produção da vaca é 24L (Regular). A causa do YAML sugere "Dieta desbalanceada". A IA assinala **atenção**, confirmando que existe um déficit produtivo real limitando o rebanho, ainda que não o esteja adoecendo.
    *   *❌ Quando NÃO é aplicado*: A produção é 35L (Excelente). A IA não marcará a dieta como "atenção", pois a entrega de leite indica que as vacas já estão bem nutridas.

*   **`monitorar` (Peso Baixo)**: A métrica principal está boa ou ideal. A causa apontada serve como uma oportunidade de refinamento fino, rotina de segurança ou manutenção preventiva.
    *   *✅ Quando é aplicado*: A escala é de 25 vacas/funcionário (Ideal). A causa sugere "Manter a consistência na rotina de manejo". A IA assinala **monitorar** para valorizar o sucesso alcançado e reforçar a manutenção do padrão.
    *   *❌ Quando NÃO é aplicado*: A escala é de 65 vacas/funcionário (Burnout/Sobrecarga). A IA não marcará como "monitorar", pois a situação passou do ponto de manutenção preventiva e exige intervenção severa (crítica).

*   **`neutra` (Peso Zero)**: A fazenda já consolidou excelência nesse ponto. A causa genérica sugerida pelo motor não possui peso negativo, pois representa uma batalha já vencida pelo produtor.
    *   *✅ Quando é aplicado*: CCS é excelente (150). A causa sugere "Implementar pré-dipping rigoroso". A IA deduz com segurança que, se o resultado é perfeito, a fazenda já implementa isso, marcando-a como **neutra**.
    *   *❌ Quando NÃO é aplicado*: CCS é péssima (800). A IA não pode marcar "Implementar pré-dipping" como neutra, visto que a não-execução dessa prática é exatamente a origem (raiz) da nota ruim.

### 📊 Proteção contra Outliers nos Gráficos (A Abordagem Híbrida)

Nas rotas de diagnóstico, a API fornece as chaves `grafico_min` e `grafico_max` dentro dos nós `thresholds` (indicador principal) e `fatores_impacto` (subindicadores).

O objetivo dessas chaves é proteger a interface visual (ex: componentes de Velocímetro ou Barras de Progresso) de **Outliers Extremos** que deformam a proporção do gráfico.
A API gera esses limites usando uma **Abordagem Híbrida**:

1.  **Limites Fixos e Absolutos (via CMS)**: Métricas com tetos inegociáveis (ex: `% de Vacas em Lactação` vai de `0` a `100`, ou `CCS` fixado até `1000`) vêm diretamente fixadas pela equipe zootécnica.
2.  **Cálculo Estatístico Dinâmico (Cercas de Tukey - IQR)**: Variáveis suscetíveis ao mercado (ex: `Preço do Leite`, `Volume Diário`, `Produção por Área`) têm os limites renderizados dinamicamente. A API varre a base de dados da região e do sistema do produtor, encontra o 1º Quartil (P25) e o 3º Quartil (P75) e estipula o limite máximo excluindo anomalias e valores discrepantes da região.

#### 👨‍💻 Como o Front-end deve consumir isso:
Pode ocorrer de o `valor_atual` de um produtor ser *maior* do que o `grafico_max` caso ele seja um outlier agressivo (ex: Um CCS de `1500` com um gráfico com limite em `1000`).

Para o gráfico não "vazar" da tela (quebrando o CSS), ao popular a largura da barra, aplique uma função `Math.min()` limitando visualmente a `100%`, mas exibindo a label textual com o número real:

```javascript
// Exemplo em JS/React:
const calcWidth = (valor, min, max) => {
  const range = max - min;
  const preenchimento = valor - min;
  // Impede que a barra de progresso ultrapasse 100% ou seja menor que 0%
  const percentual = Math.max(0, Math.min((preenchimento / range) * 100, 100));
  return `${percentual}%`;
};

// Componente Visual
<div className="barra-progresso" style={{ width: calcWidth(data.valor_atual, data.grafico_min, data.grafico_max) }}></div>
<span className="texto-informativo">{data.valor_atual} {data.unidade}</span> // Exibe o valor real que estourou a margem
```

---

## ⚠️ Limitações de Uso

É importante estar ciente das seguintes limitações arquiteturais da API:

*   **Rate Limiting**: O acesso às rotas mais custosas (`/diagnostico` e `/simulacao`) é controlado por um limitador de taxa (`slowapi`) baseado no endereço IP do cliente. Múltiplas requisições em um curto período resultarão em um erro `429 Too Many Requests`.
*   **Natureza Stateless**: A API é "sem estado". Ela não armazena dados históricos das fazendas ou análises anteriores. Cada chamada a `/api/diagnostico` é uma transação atômica e independente.
*   **Dependência de Serviços Externos**: O endpoint `/api/diagnostico` depende criticamente da disponibilidade da API do OpenRouter. Uma falha ou latência no serviço de IA impactará diretamente a capacidade de gerar o resumo executivo.
*   **Base de Regras Estática**: Toda a inteligência de negócio (regras, textos, práticas) reside em arquivos estáticos (YAML/CSV). Embora possam ser atualizados em tempo real via `/api/reload-cache`, o sistema não aprende ou se adapta automaticamente. Novas práticas zootécnicas ou mudanças de mercado exigem uma atualização manual desses arquivos.