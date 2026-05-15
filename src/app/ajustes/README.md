# Módulo de Ajustes de Dados

## 📖 O que este diretório faz?

Este diretório contém a interface de edição (**Ajustes**) do Site Ishikawa Educampo. 

O objetivo principal desta rota é permitir que o produtor rural revise e modifique os dados inseridos previamente no formulário de coleta (apresentados na tela `/formulario`), sem a necessidade de preencher tudo do zero caso tenha cometido um erro de digitação. Uma vez que os dados são alterados, o usuário pode solicitar um **recálculo instantâneo** do diagnóstico zootécnico.

### Funcionalidades e Regras de Negócio
* **Edição Ágil e Hidratada:** Reaproveita a base de dados central da aplicação consumindo o Zustand, de forma a sempre iniciar a tela com todos os campos previamente preenchidos com os últimos dados salvos.
* **Re-Análise sob Demanda:** Ao submeter as alterações, a página aciona o Backend-For-Frontend (BFF) em `/api/diagnostico` para reprocessar os comparativos do Educampo e gerar um novo relatório de IA.
* **Proteção Anti-Spam (Rate Limiting no Cliente):** Para evitar custos indesejados e alta carga de solicitações ao servidor de IA, esta tela implementa um bloqueio temporário (*cooldown*) embutido. Após uma submissão bem-sucedida ou com falha, o botão fica inativo e exibe uma contagem visual ao produtor até liberar o próximo acesso.
* **Feedback Visual em Tela (Toasts):** Emprega alertas do tipo *Toast* que aparecem sobrepostos para informar o usuário caso os dados ajustados tenham sido processados ou tenham sido rejeitados pelo verificador.

> 💡 **Nota para Desenvolvedores:** A documentação técnica detalhando o *como* as regras do `cooldown`, das validações do Zod e de injeção de estado no Zustand funcionam internamente está implementada e disponível exclusivamente através de **DocStrings** no código-fonte de `page.tsx`.