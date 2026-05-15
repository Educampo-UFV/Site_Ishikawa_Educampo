# 🚜 Módulo de Coleta de Dados (`/app/formulario`)

## 📖 O que este diretório faz?

Este diretório contém a interface primária do sistema: o **Formulário de Coleta de Dados** operacionais e zootécnicos da fazenda. Ele atua como o ponto de entrada (gateway) para o produtor rural inserir as informações de sua propriedade, que serão posteriormente analisadas pelo nosso motor de Diagnóstico.

* **Para não-programadores (Produtores):** É a tela onde o produtor digita as informações vitais de sua fazenda (tamanho do rebanho, produção de leite, custos, sistema de produção, etc.) sendo apoiado por dicas visuais e exemplos em tela para não errar.
* **Para programadores:** É o módulo que captura os dados do usuário, higieniza, aplica a validação estrita (via Zod) e despacha os dados estruturados para a memória de estado do navegador (Zustand) antes de avançar de rota.

## 📋 Responsabilidades
- **Interface de Usuário (UI):** Renderiza o formulário visual dividido em três quadrantes lógicos (Informações Gerais, Estrutura e Rebanho, Produção e Qualidade).
- **Validação Rigorosa de Entrada:** Utiliza o `fazendaSchema` para garantir que textos não sejam inseridos em campos numéricos e que valores absurdos sejam barrados imediatamente.
- **Persistência Temporária:** Injeta os dados validados na store global (`useFazendaStore`) para que as próximas telas (Carregamento e Diagnóstico) possam consumi-los instantaneamente.

## 🧩 Arquivos deste Módulo
* `page.tsx`: O componente visual principal que monta o formulário, captura interações (inputs), lida com a lista de erros e realiza a navegação em caso de sucesso.
* `README.md`: Este guia de documentação do diretório.

## 🔗 Navegação
Para entender como as regras de validação de dados aplicadas aqui funcionam por baixo dos panos, consulte a documentação da Biblioteca de Schemas (`/src/lib/README.md`).

## 🛡️ Segurança e UX (Experiência do Usuário)
- **Sanitização:** Todos os *inputs* numéricos são processados e convertidos de forma segura antes de chegarem à memória.
- **Feedback Visual (Tempo Real):** Exibe mensagens de alerta em um bloco de destaque caso as regras de preenchimento falhem.
- **Hierarquia de Apoio em 3 Níveis:** Para maximizar a clareza para o público rural, o formulário adota:
  1. **Rótulo e Unidade (Label):** Informa claramente o que é esperado e a métrica (ex: cab., ha, L/dia).
  2. **Placeholder (Exemplo):** Exemplifica o formato numérico esperado (ex: 35.0, 150).
  3. **Tooltips (Ícones de Ajuda):** Balões iterativos (`lucide-react`) que detalham a regra de negócio para campos complexos, como a simplificação dos zeros na regra do CCS.
