# 🤝 Guia de Integração da API Ishikawa Educampo (v2.0.0)

Este documento é o guia definitivo para desenvolvedores e integradores da **API Ishikawa Educampo**. Ele detalha os endpoints disponíveis, fluxos de autenticação do consultor, persistência mock de produtores, motor de diagnóstico incremental por campos alterados, estruturas de dados esperadas (Pydantic), catálogo completo de erros HTTP e guia de solução de problemas.

---

## 🔌 Consumo e Autenticação da API

A API comunica-se via JSON (`application/json`) sobre HTTP/HTTPS.

### Headers Obrigatórios e Credenciais

* **`X-API-KEY`**: Chave de segurança fixa exigida em todas as rotas protegidas da API (Ex: `X-API-KEY: 42`).
* **Autenticação por Sessão/Token (Consultor)**: As rotas de gestão de produtores e formulários utilizam o contexto do consultor autenticado. Após o login em `POST /api/auth/login`, o token/cookie de sessão `session_token` identifica o consultor ativo.

#### Consultor Padrão para Desenvolvimento / Homologação (Dev Mock Seed)
No startup da API, o repositório em memória é automaticamente alimentado com o seguinte consultor de testes:
* **Nome:** `Consultor Educampo`
* **E-mail:** `consultor@educampo.com`
* **Senha:** `admin123`
* **UUID do Consultor:** `consultant-default-uuid`

---

## 🗺️ Visão Geral dos Endpoints

| Módulo | Método | Endpoint | Descrição | Autenticação |
| :--- | :--- | :--- | :--- | :--- |
| **Autenticação** | `POST` | `/api/auth/login` | Realiza login do consultor e inicia a sessão | `X-API-KEY` |
| **Autenticação** | `POST` | `/api/auth/logout` | Encerra a sessão do consultor logado | `X-API-KEY` |
| **Autenticação** | `GET` | `/api/auth/me` | Retorna o perfil do consultor autenticado | `X-API-KEY` + Cookie/Token |
| **Produtores** | `POST` | `/api/produtores` | Cadastra um novo produtor vinculado ao consultor | `X-API-KEY` + Contexto |
| **Formulários** | `GET` | `/api/formularios` | Retorna opções de select e fazendas gerenciadas | `X-API-KEY` |
| **Formulários** | `GET` | `/api/formularios/farms/{nome}` | Retorna dados completos de uma fazenda cadastrada | `X-API-KEY` |
| **Relatórios** | `POST` | `/api/produtores/{produtor_id}/relatorio/pdf` | Gera relatório customizado em PDF com base nos filtros JSON de seções/indicadores | `X-API-KEY` |
| **Relatórios** | `GET` | `/api/produtores/{produtor_id}/relatorio/pdf` | Gera relatório completo em PDF com 100% dos dados habilitados (fallback) | `X-API-KEY` |
| **Diagnóstico** | `POST` | `/api/diagnostico` | Gatilho assíncrono (ou incremental) de diagnóstico | `X-API-KEY` |
| **Diagnóstico** | `GET` | `/api/diagnostico/status/{task_id}` | Consulta status/resultado da análise em background | `X-API-KEY` |
| **Simulação** | `POST` | `/api/simulacao` | Recálculo síncrono de cenários e projeção de custos (ML) | `X-API-KEY` |
| **Parâmetros** | `POST` | `/api/parametros-painel` | Limites matemáticos (min/max/step) para sliders | `X-API-KEY` |
| **Administração**| `POST` | `/api/reload-cache` | Recarrega em memória as regras YAML e CSVs | `X-API-KEY` |
| **Monitoramento**| `GET` | `/api/health` | Verifica integridade da API e conectividade ML | `X-API-KEY` |
| **Monitoramento**| `GET` | `/api/ping` | Despertador de nuvem (Cold Start ping) | Nenhum |

---

## 📌 Detalhamento das Rotas

### 🔐 Módulo de Autenticação do Consultor

#### `POST /api/auth/login`
* **Propósito:** Autentica o consultor utilizando e-mail e senha. Armazena o hash criptografado com `bcrypt` no repositório.
* **Headers:** `X-API-KEY: 42`, `Content-Type: application/json`

* **Exemplo de Requisição (`application/json`):**
```json
{
  "email": "consultor@educampo.com",
  "password": "admin123"
}
```

* **Exemplo de Resposta de Sucesso (`HTTP 200 OK`):**
```json
{
  "message": "Login bem-sucedido",
  "consultant_id": "consultant-default-uuid",
  "nome": "Consultor Educampo",
  "email": "consultor@educampo.com"
}
```
* **Cookie gerado:** `session_token=<token_jwt>; HttpOnly; SameSite=Strict`

---

#### `POST /api/auth/logout`
* **Propósito:** Encerra a sessão do consultor logado e expira os cookies associados.
* **Headers:** `X-API-KEY: 42`

* **Exemplo de Resposta de Sucesso (`HTTP 200 OK`):**
```json
{
  "message": "Logout realizado com sucesso"
}
```

---

#### `GET /api/auth/me`
* **Propósito:** Retorna as informações do consultor atualmente autenticado.
* **Headers:** `X-API-KEY: 42`

* **Exemplo de Resposta (`HTTP 200 OK`):**
```json
{
  "id": "consultant-default-uuid",
  "nome": "Consultor Educampo",
  "email": "consultor@educampo.com",
  "producers_managed": [
    "producer-seed-uuid-1",
    "producer-seed-uuid-2"
  ]
}
```

---

### 🚜 Módulo de Cadastro e Gestão de Produtores

#### `POST /api/produtores`
* **Propósito:** Cadastra um novo produtor com suas credenciais e os dados zootécnicos/econômicos da fazenda. O produtor é automaticamente associado ao consultor logado (`consultant_id`).
* **Headers:** `X-API-KEY: 42`, `Content-Type: application/json`

* **Campos da Entrada (`ProducerRegistrationInput`):**
  * `email` (string, obrigatório): E-mail único do produtor.
  * `senha` (string, min_length 6): Senha de acesso do produtor.
  * `nome_fazenda` (string, obrigatório): Nome da propriedade rural.
  * `sistema_producao` (string): Ex: `"compost_barn"`, `"confinado"`, `"semi_confinado"`.
  * `regiao_sebrae` (string): Ex: `"triangulo"`, `"sul_de_minas"`.
  * `total_vacas` (integer, > 0): Número total de vacas adultas.
  * `percentual_lactacao` (float, 0 a 100): Percentual de vacas em lactação.
  * `total_rebanho` (integer, >= total_vacas): Total de cabeças no rebanho.
  * `area_atividade` (float, > 0): Área dedicada ao leite em hectares.
  * `numero_trabalhadores` (integer, >= 1): Número de trabalhadores.
  * `producao_vaca` (float, > 0): Média diária (L/vaca/dia).
  * `preco_recebido` (float, > 0): Preço recebido por litro (R$/L).
  * `preco_referencia` (float, > 0): Preço de referência regional (R$/L).
  * `ccs` (integer, > 0): Contagem de Células Somáticas (x1000 cél/mL).

* **Exemplo de Requisição (`application/json`):**
```json
{
  "email": "produtor.novo@fazenda.com.br",
  "senha": "senhaSegura123",
  "nome_fazenda": "Fazenda Boa Vista",
  "sistema_producao": "compost_barn",
  "regiao_sebrae": "triangulo",
  "total_vacas": 150,
  "percentual_lactacao": 82.5,
  "total_rebanho": 180,
  "area_atividade": 25.0,
  "numero_trabalhadores": 3,
  "producao_vaca": 32.0,
  "preco_recebido": 3.10,
  "preco_referencia": 2.50,
  "ccs": 210
}
```

* **Exemplo de Resposta de Criado (`HTTP 201 Created`):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "produtor.novo@fazenda.com.br",
  "nome_fazenda": "Fazenda Boa Vista",
  "message": "Produtor cadastrado com sucesso e associado ao consultor."
}
```

---

#### `GET /api/formularios`
* **Propósito:** Fornece as opções para os menus de seleção (sistemas de produção e regiões SEBRAE) e lista as fazendas/produtores cadastrados para o consultor.
* **Headers:** `X-API-KEY: 42`

* **Exemplo de Resposta (`HTTP 200 OK`):**
```json
{
  "sistemas_producao": [
    { "value": "compost_barn", "label": "Compost Barn" },
    { "value": "semi_confinado", "label": "Semi-Confinado" }
  ],
  "regioes_sebrae": [
    { "value": "triangulo", "label": "Triângulo Mineiro" },
    { "value": "sul_de_minas", "label": "Sul de Minas" }
  ],
  "fazendas_cadastradas": [
    { "id": "550e8400-e29b-41d4-a716-446655440000", "nome": "Fazenda Boa Vista" },
    { "id": "producer-seed-uuid-1", "nome": "Fazenda Leiteira Experimental 1" }
  ]
}
```

---

#### `GET /api/formularios/farms/{nome}`
* **Propósito:** Busca os dados cadastrais e zootécnicos completos de uma fazenda pelo seu nome.
* **Headers:** `X-API-KEY: 42`

* **Exemplo de Resposta (`HTTP 200 OK`):**
```json
{
  "id_fazenda": "550e8400-e29b-41d4-a716-446655440000",
  "nome": "Fazenda Boa Vista",
  "dados": {
    "sistema_producao": "compost_barn",
    "regiao_sebrae": "triangulo",
    "total_vacas": 150,
    "percentual_lactacao": 82.5,
    "total_rebanho": 180,
    "area_atividade": 25.0,
    "numero_trabalhadores": 3,
    "producao_vaca": 32.0,
    "preco_recebido": 3.10,
    "preco_referencia": 2.50,
    "ccs": 210
  }
}
```

---

### 📄 Módulo de Geração de Relatórios Executivos em PDF

#### `POST /api/produtores/{produtor_id}/relatorio/pdf`
* **Propósito:** Gera o relatório executivo customizado em PDF consolidando diagnósticos zootécnicos, parecer técnico, benchmarks regionais, matriz Ishikawa e gráficos de simulação de acordo com os filtros granulares enviados no corpo da requisição.
* **Headers:** `X-API-KEY: 42`, `Content-Type: application/json`
* **Parâmetros de Rota:** `produtor_id` (UUID primário ou ID da fazenda).
* **Tipo de Resposta:** Binário (`Content-Type: application/pdf`).
* **Header de Download:** `Content-Disposition: attachment; filename="relatorio_produtor_{produtor_id}.pdf"`.

##### 📋 Estrutura do Payload de Filtros (`ReportFilterPayload`)
> [!NOTE]
> **Metadados Demográficos vs Seção 2:**
> O **Sistema de Produção** e a **Faixa de Volume** são renderizados **diretamente no cabeçalho** do relatório (cards e metadados superiores). A **Seção 2** é reservada estritamente para os indicadores técnicos comparativos (CCS, Produção por Vaca, Preço, etc.).

| Seção / Campo | Tipo | Default | Descrição |
| :--- | :--- | :--- | :--- |
| **`secao_resumo.visao_geral`** | `boolean` | `true` | Exibe o texto de Visão Geral Consolidada da fazenda. |
| **`secao_resumo.evidencias_raciocinios`** | `boolean` | `true` | Exibe os cards de Evidências Técnicas & Citações da LLM. |
| **`secao_benchmarking.ccs`** | `boolean` | `true` | Indicador de Contagem de Células Somáticas. |
| **`secao_benchmarking.producao_vaca`** | `boolean` | `true` | Indicador de Produção Média Diária por Vaca. |
| **`secao_benchmarking.producao_area`** | `boolean` | `true` | Indicador de Produção por Área (L/ha/ano). |
| **`secao_benchmarking.producao_trabalhador`** | `boolean` | `true` | Indicador de Produção por Trabalhador (L/func/dia). |
| **`secao_benchmarking.preco_leite`** | `boolean` | `true` | Indicador de Preço do Leite (R$/L). |
| **`secao_benchmarking.percentual_vacas_lactacao`** | `boolean` | `true` | Indicador de Percentual de Vacas em Lactação. |
| **`secao_benchmarking.lotacao_animal`** | `boolean` | `true` | Indicador de Lotação Animal (cab/ha). |
| **`secao_simulacoes.financeiras`** | `object` | `{...}` | Flags: `custo_leite`, `margem_litro`, `margem_ano`. |
| **`secao_simulacoes.estaticas`** | `object` | `{...}` | Flags: `ccs`, `producao_vaca`. |
| **`secao_simulacoes.operacionais`** | `object` | `{...}` | Flags: `producao_trabalhador`, `producao_area`. |
| **`secao_ishikawa.incluir_analise_causa`** | `boolean` | `true` | Exibe/oculta a caixa de texto itálico de análise profunda da causa. |
| **`secao_ishikawa.severidades`** | `object` | `{...}` | Flags de severidade permitidas: `critica`, `atencao`, `monitorar`, `neutra`. |
| **`secao_ishikawa.indicadores.{slug}`** | `object` | `{...}` | Contém `incluir: boolean` e o objeto `pilares` com flags: `mao_de_obra`, `metodos`, `maquinas`, `meio_ambiente`, `medicao`, `materia_prima`. |

##### 💡 Exemplo de Requisição Customizada (`POST`):
```json
{
  "secao_resumo": {
    "visao_geral": true,
    "evidencias_raciocinios": false
  },
  "secao_benchmarking": {
    "sistema_producao": true,
    "faixa_producao": true,
    "ccs": true,
    "producao_vaca": true,
    "producao_area": false,
    "producao_trabalhador": true,
    "preco_leite": true,
    "percentual_vacas_lactacao": true,
    "lotacao_animal": false
  },
  "secao_simulacoes": {
    "financeiras": {
      "custo_leite": true,
      "margem_litro": true,
      "margem_ano": false
    },
    "estaticas": {
      "ccs": true,
      "producao_vaca": true
    },
    "operacionais": {
      "producao_trabalhador": true,
      "producao_area": false
    }
  },
  "secao_ishikawa": {
    "incluir_analise_causa": true,
    "severidades": {
      "critica": true,
      "atencao": true,
      "monitorar": true,
      "neutra": false
    },
    "indicadores": {
      "ccs": {
        "incluir": true,
        "pilares": {
          "mao_de_obra": true,
          "metodos": true,
          "maquinas": false,
          "meio_ambiente": false,
          "medicao": false,
          "materia_prima": false
        }
      },
      "preco_leite": {
        "incluir": true,
        "pilares": {
          "mao_de_obra": false,
          "metodos": false,
          "maquinas": true,
          "meio_ambiente": false,
          "medicao": true,
          "materia_prima": false
        }
      }
    }
  }
}
```

##### 🛡️ Comportamento de Fallback em Pilares sem Recomendações
Se um indicador e pilar forem selecionados (`true`), mas o diagnóstico daquele produtor não gerou nenhuma recomendação para aquele pilar, o relatório exibirá uma mensagem amigável:
> ℹ️ *Não houve práticas recomendadas para o(s) pilar(es): Medição no diagnóstico avaliado.*

---

#### `GET /api/produtores/{produtor_id}/relatorio/pdf`
* **Propósito:** Gera o relatório executivo completo em PDF (com 100% dos dados habilitados). Mantido para retrocompatibilidade direta.
* **Headers:** `X-API-KEY: 42`
* **Parâmetros de Rota:** `produtor_id` (UUID ou ID da fazenda).
* **Tipo de Resposta:** Binário (`Content-Type: application/pdf`).

##### 💡 Como Consumir no Frontend (Exemplos Práticos com POST)

**Exemplo: Download com Filtros via Axios (React / Vue / Angular)**
```javascript
import axios from 'axios';

async function gerarRelatorioCustomizadoPDF(produtorId, filtrosSelecionados) {
  try {
    const response = await axios.post(
      `http://localhost:8000/api/produtores/${produtorId}/relatorio/pdf`,
      filtrosSelecionados, // Objeto com as flags booleanas dos checkboxes
      {
        headers: {
          'X-API-KEY': '42',
          'Content-Type': 'application/json'
        },
        responseType: 'blob' // OBRIGATÓRIO: indica que a resposta é binária
      }
    );

    // Dispara o download automático do PDF gerado
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_produtor_${produtorId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      alert('Produtor ou diagnósticos não encontrados para gerar o relatório.');
    } else {
      alert('Erro ao processar o relatório PDF customizado.');
    }
  }
}
```

**Exemplo: Abertura em Nova Aba / Preview com Fetch**
```javascript
async function abrirPreviewRelatorioPDF(produtorId, filtrosSelecionados = {}) {
  const response = await fetch(
    `http://localhost:8000/api/produtores/${produtorId}/relatorio/pdf`,
    {
      method: 'POST',
      headers: {
        'X-API-KEY': '42',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(filtrosSelecionados)
    }
  );

  if (!response.ok) {
    throw new Error('Falha ao compilar relatório PDF customizado');
  }

  const blob = await response.blob();
  const pdfUrl = URL.createObjectURL(blob);
  window.open(pdfUrl, '_blank');
}
```

---

### 🧬 Módulo de Diagnóstico Incremental

#### `POST /api/diagnostico`
* **Propósito:** Gatilho para processamento do diagnóstico da fazenda.
* **Inteligência Incremental (`DiffService`):**
  1. Se o produtor for novo: realiza análise completa de todos os indicadores + resumo LLM e persiste o resultado.
  2. Se o produtor já possui diagnóstico salvo e **nenhum dado mudou**: retorna o resultado salvo via **Cache Hit** instantâneo.
  3. Se **apenas alguns campos mudaram** (ex: alterou somente o `preco_recebido`): o motor calcula o diff, reprocessa **apenas** o indicador `preco_leite` + `resumo_geral` (economizando chamadas à LLM) e atualiza o histórico via merge seletivo.

* **Exemplo de Requisição (`application/json`):**
```json
{
  "email": "produtor.novo@fazenda.com.br",
  "sistema_producao": "compost_barn",
  "regiao_sebrae": "triangulo",
  "total_vacas": 150,
  "percentual_lactacao": 82.5,
  "total_rebanho": 180,
  "area_atividade": 25.0,
  "numero_trabalhadores": 3,
  "producao_vaca": 32.0,
  "preco_recebido": 3.25,
  "preco_referencia": 2.50,
  "ccs": 210
}
```

* **Exemplo de Resposta (`HTTP 202 Accepted`):**
```json
{
  "task_id": "84a3c18b-590f-48d1-9f93-0182414704fc",
  "status": "processing",
  "message": "Diagnóstico enfileirado para processamento assíncrono."
}
```

---

#### `GET /api/diagnostico/status/{task_id}`
* **Propósito:** Long-polling para acompanhar a execução do diagnóstico.
* **Headers de Telemetria:** No status `completed`, a API inclui nos headers HTTP as métricas de uso de IA (`X-IA-Tokens`, `X-IA-Reasoning-Tokens`, `X-IA-Custo-Dolar`, `X-IA-Provider`).

* **Exemplo de Resposta (`HTTP 200 OK` - Em Andamento):**
```json
{
  "task_id": "84a3c18b-590f-48d1-9f93-0182414704fc",
  "status": "processing",
  "message": "Analises em andamento [2/3]",
  "progress": {
    "done": 2,
    "total": 3
  }
}
```

* **Exemplo de Resposta (`HTTP 200 OK` - Concluído):**
```json
{
  "task_id": "84a3c18b-590f-48d1-9f93-0182414704fc",
  "status": "completed",
  "is_cached": false,
  "result": {
    "resumo_geral": {
      "raciocinios": [
        {
          "id": 1,
          "fontes": ["Preço do Leite"],
          "analise_tecnica": "A alteração no preço recebido impactou positivamente o indicador..."
        }
      ],
      "visao_geral": "A fazenda apresenta bom equilíbrio produtivo..."
    },
    "benchmarking": [ ... ],
    "indicadores": { ... }
  }
}
```

---

### 📈 Módulo de Simulação e Parâmetros

#### `POST /api/simulacao`
* **Propósito:** Recálculo síncrono de projeções visuais e margens financeiras acionando o modelo de Machine Learning (`ml_client`). Não dispara chamadas a LLMs para manter velocidade de resposta em sliders no frontend.
* **Mapeamento Defensivo para ML API:** A API Ishikawa aceita os Enums canônicos em kebab-case (`compost-barn`, `confinado-sem-estrutura`, `semiconfinado`) e realiza a tradução interna/de-para no `ml_client.py` antes de repassar o payload para o serviço externo de ML, liberando o cliente frontend de qualquer necessidade de pré-processar ou mapear o nome do sistema ou da região.

#### `POST /api/parametros-painel`
* **Propósito:** Fornece os limites matemáticos (`min`, `max`, `step`, quartis `inferior`/`superior`) para desenhar sliders no frontend.

---

## 🚨 Catálogo Global de Erros e Diagnóstico de Falhas

A API implementa tratamento estruturado de erros. Todas as exceções de negócio derivam de `EducampoBaseException` e retornam um formato JSON padronizado. Erros de validação do Pydantic retornam `HTTP 422 Unprocessable Entity`.

### Formato Padrão de Erro de Negócio
```json
{
  "error_code": "NOME_DO_ERRO",
  "message": "Descrição amigável do erro para o cliente",
  "details": { ... }
}
```

### Formato Padrão de Erro de Validação Pydantic (`HTTP 422`)
```json
{
  "detail": [
    {
      "loc": ["body", "total_vacas"],
      "msg": "Input should be greater than 0",
      "type": "greater_than"
    }
  ]
}
```

---

### 📊 Tabela Resumo de Códigos HTTP

| Código Status | Significado | Causa Típica |
| :--- | :--- | :--- |
| `HTTP 400` | Bad Request | Parâmetros inconsistentes com as regras de negócio |
| `HTTP 401` | Unauthorized | Credenciais de login inválidas ou token expirado |
| `HTTP 403` | Forbidden | Header `X-API-KEY` ausente ou incorreto |
| `HTTP 404` | Not Found | Fazenda ou `task_id` não encontrado |
| `HTTP 409` | Conflict | E-mail já cadastrado ao tentar registrar produtor |
| `HTTP 422` | Unprocessable Entity | Falha de tipo ou campo obrigatório ausente no JSON |
| `HTTP 429` | Too Many Requests | Rate limit por IP excedido |
| `HTTP 500` | Internal Server Error | Erro não capturado na execução do servidor |
| `HTTP 503` | Service Unavailable | Dependências externas (ML API ou CMS) offline |

---

### 🔍 Casos Práticos de Erro e Como Analisar

#### 1. `HTTP 400 Bad Request` — Regra de Negócio Violada
* **Cenário:** O cliente envia `total_rebanho` menor que `total_vacas` (o que é fisicamente impossível numa fazenda).
* **Entrada Enviada:**
```json
{
  "total_vacas": 100,
  "total_rebanho": 50
}
```
* **Resposta Retornada (`HTTP 400`):**
```json
{
  "error_code": "INVALID_HERD_SIZE",
  "message": "O total do rebanho (50) não pode ser menor que o total de vacas (100).",
  "details": { "total_vacas": 100, "total_rebanho": 50 }
}
```
* **Como Analisar:** Verifique a regra de validação do formulário no frontend antes de disparar o contrato para a API.

---

#### 2. `HTTP 401 Unauthorized` — Credenciais Inválidas
* **Cenário:** Tentativa de login com senha incorreta no endpoint `/api/auth/login`.
* **Entrada Enviada:**
```json
{
  "email": "consultor@educampo.com",
  "password": "senhaErrada123"
}
```
* **Resposta Retornada (`HTTP 401`):**
```json
{
  "error_code": "INVALID_CREDENTIALS",
  "message": "E-mail ou senha incorretos.",
  "details": {}
}
```
* **Como Analisar:** Certifique-se de estar utilizando as credenciais corretas do consultor (`consultor@educampo.com` / `admin123` em Dev).

---

#### 3. `HTTP 403 Forbidden` — Chave API Inválida
* **Cenário:** Requisição enviada sem o header `X-API-KEY` ou com valor incorreto.
* **Chamada real:** `curl http://localhost:8000/api/formularios -H 'X-API-KEY: chave_errada'`
* **Resposta Retornada (`HTTP 403`):**
```json
{
  "detail": "API Key inválida ou ausente."
}
```
* **Como Analisar:** Adicione o cabeçalho HTTP `X-API-KEY: 42` na requisição.

---

#### 4. `HTTP 404 Not Found` — Recursos Não Encontrados
* **Cenário:** Busca por uma fazenda inexistente em `GET /api/formularios/farms/FazendaInexistente`.
* **Resposta Retornada (`HTTP 404`):**
```json
{
  "error_code": "FARM_NOT_FOUND",
  "message": "Fazenda 'FazendaInexistente' não foi encontrada no cadastro do consultor.",
  "details": { "nome_buscado": "FazendaInexistente" }
}
```
* **Como Analisar:** Consulte primeiro a rota `GET /api/formularios` para obter a lista exata de nomes/IDs cadastrados.

---

#### 5. `HTTP 409 Conflict` — E-mail Duplicado no Cadastro
* **Cenário:** Tentativa de cadastrar um produtor em `POST /api/produtores` usando um e-mail que já existe no repositório.
* **Entrada Enviada:**
```json
{
  "email": "consultor@educampo.com",
  "senha": "123",
  "nome_fazenda": "Fazenda Repetida"
}
```
* **Resposta Retornada (`HTTP 409`):**
```json
{
  "error_code": "DUPLICATE_EMAIL",
  "message": "O e-mail 'consultor@educampo.com' já está cadastrado no sistema.",
  "details": { "email": "consultor@educampo.com" }
}
```
* **Como Analisar:** Informe o usuário que o e-mail já está em uso ou solicite a recuperação de acesso.

---

#### 6. `HTTP 422 Unprocessable Entity` — Erro de Validação de Tipos (Pydantic)
* **Cenário:** O cliente envia uma string no campo `ccs` que exige valor numérico inteiro.
* **Entrada Enviada:**
```json
{
  "ccs": "muito_alta"
}
```
* **Resposta Retornada (`HTTP 422`):**
```json
{
  "detail": [
    {
      "loc": ["body", "ccs"],
      "msg": "Input should be a valid integer, unable to parse string as an integer",
      "type": "int_parsing"
    }
  ]
}
```
* **Como Analisar:** Verifique o nó `loc` para identificar o campo exato e converta o tipo do dado no cliente para o esperado (ex: `integer` ou `float`).

---

#### 7. `HTTP 429 Too Many Requests` — Rate Limit Excedido
* **Cenário:** O cliente realiza mais requisições por minuto do que o limite permitido pela rota.
* **Resposta Retornada (`HTTP 429`):**
```json
{
  "error": "Rate limit exceeded",
  "message": "1000 per 1 minute"
}
```
* **Como Analisar:** Implemente mecanismos de *backoff exponencial* ou aguarde a janela de 1 minuto ser zerada.

---

#### 8. `HTTP 503 Service Unavailable` — Dependências Indisponíveis
* **Cenário:** A API de Machine Learning (`ml_client`) está iniciando ou temporariamente inacessível.
* **Resposta Retornada (`HTTP 503`):**
```json
{
  "detail": "API de Machine Learning em inicialização ou indisponível no momento."
}
```
* **Como Analisar:** Verifique o status da dependência através do endpoint `GET /api/health`.

---

## 🏗️ Lógica Interna e Arquitetura

### Diagnóstico Incremental (`CAMPO_INDICADOR_MAP`)
Abaixo está o mapeamento estático utilizado pelo `DiffService` para reprocessar unicamente os indicadores afetados quando um campo do formulário é alterado:

| Campo Alterado | Indicadores Afetados para Reprocessamento |
| :--- | :--- |
| `ccs` | `ccs`, `preco_leite`, `producao_vaca` |
| `producao_vaca` | `producao_vaca`, `producao_area`, `producao_funcionario` |
| `total_vacas` | `producao_vaca`, `producao_area`, `producao_funcionario` |
| `percentual_lactacao` | `producao_vaca`, `producao_area`, `producao_funcionario` |
| `area_atividade` | `producao_area` |
| `numero_trabalhadores` | `producao_funcionario` |
| `preco_recebido` | `preco_leite` |
| `preco_referencia` | `preco_leite` |
| `sistema_producao` | Todos os 5 indicadores |
| `regiao_sebrae` | Todos os 5 indicadores |

> **Nota:** O `resumo_geral` gerado pela LLM é **sempre** reprocessado ao detectar qualquer mudança de campo para consolidar a visão geral do produtor.