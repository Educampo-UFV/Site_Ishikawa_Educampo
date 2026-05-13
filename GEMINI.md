# 🤖 Diretrizes para Assistentes de IA

Olá, Gemini Code Assist!

Este arquivo centraliza as diretrizes fundamentais que você deve seguir ao trabalhar neste projeto. Aderir a estas regras é crucial para manter a qualidade, consistência e performance do código.

---

Preste atenção às seguintes diretrizes cruciais deste projeto:

1. **Testes como Contrato (A Lei)**: Primeiro criamos os testes (unitários, segurança, etc.) para definir como o código deve funcionar. Só após os testes estarem prontos iniciamos a implementação. O código deve se adaptar para passar nos testes. NUNCA altere o teste apenas porque o código falhou; o código é que deve se adaptar a ele. Em caso de mudança de requisitos, altere o teste primeiro e, depois, o código.
2. **DocStrings Obrigatórias**: Todo código gerado (inclusive os de testes) deve conter DocStrings. Essa é a documentação para que os programadores entendam *como* o código está fazendo o que se propõe.
3. **Documentação via README.md**: Todo diretório deve ter um `README.md` explicando detalhadamente *o que* o código faz (para programadores e não-programadores). Um único README engloba todos os arquivos daquele diretório. Para os subdiretórios, explique-os brevemente indicando seus propósitos e inclua obrigatoriamente o link em markdown para seus respectivos READMEs.


## 🚀 Comandos uteis

Desliga e liga o compose
```bash
docker-compose down; docker-compose up -d --build
```

Verificar logs do docker
```bash
docker logs ishikawa_api -f
```

Listar a arvore de diretorio ignorando alguns diretorios.
```bash
Get-ChildItem -Recurse | Where-Object { $_.FullName -notmatch 'node_modules|\.next|\.swc|__pycache__|\.pytest_cache|\.venv|\.vscode' } | Select-Object FullName | Format-Table -AutoSize
```

Mostrar o nome da brach atual
```bash
git branch --show-current
```

Listar os commits recentes incluindo as mensagems usadas
```bash
git log --oneline
```

Encerrando a Feature e Iniciando a Próxima
```bash
# Salvar o trabalho final na branch:
git add .
git commit -m "feat: implementa interface de login responsiva e segura com Tailwind v4"
git push origin feature/seguranca-auth

# Integrar com a ramificação principal de desenvolvimento (develop)
git checkout develop
git merge feature/seguranca-auth
git push origin develop

# Criar a ramificação para a nova fase:
git checkout -b feature/coleta-dados
git push -u origin feature/coleta-dados
```