# 📖 Visão Geral
Este endpoint atua como um **BFF (Backend-For-Frontend)**. Ele recebe os dados operacionais da fazenda, valida a integridade das informações e atua como um proxy seguro para a API de Inteligência Artificial (Python), injetando as chaves de autenticação necessárias.

## 🛠️ Contrato de Dados

### Entrada (Request)
A requisição deve ser um `POST` contendo o objeto JSON validado pelo schema da fazenda.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `sistema_producao` | `string` | `compost_barn`, `semi_confinado` ou `confinado`. |
| `regiao_sebrae` | `string` | Slug da região (ex: `triangulo`). |
| `total_vacas` | `int` | Total de vacas no rebanho. |
| `vacas_lactacao` | `int` | Quantidade de vacas produzindo atualmente. |
| `ccs` | `float` | Contagem de Células Somáticas (x1000). |
| `producao_vaca` | `float` | Média de produção (L/vaca/dia). |
| `preco_recebido` | `float` | Valor pago ao produtor (R$/L). |
| `preco_referencia` | `float` | Valor médio regional para comparação. |

### Saída (Response)
A API retorna um objeto rico em metadados para renderização imediata.

#### 1. `resumo_geral`
Usado na seção superior da tela de diagnóstico.
* `visao_geral`: Texto narrativo da IA.
* `prioridades`: Array de strings para a seção "O que focar agora".
* `proximos_passos`: Lista de ações práticas.

#### 2. `benchmarking`
Uma lista de objetos para renderizar os **Cards de Comparação Regional**.
* Cada card possui: `titulo`, `valor_produtor`, `valor_referencia`, `unidade`, `status_comparacao` (positivo, neutro, negativo) e mensagens de texto já formatadas.

#### 3. `indicadores`
Objeto contendo os 5 indicadores técnicos. Cada indicador (ex: `ccs`) contém:
* `status`: `bom`, `regular` ou `critico`.
* `impacto_pilares`: Dicionário com a % de peso de cada pilar no problema (ideal para **Gráfico de Radar/Aranha**).
* `causas`: Lista de causas para o **Diagrama de Ishikawa**, agora incluindo:
    * `severidade`: `critica`, `atencao`, `monitorar` ou `neutra`.
    * `analise`: O racional da IA para aquela causa específica.