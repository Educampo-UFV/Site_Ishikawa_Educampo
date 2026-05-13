# 🤖 Diretrizes para Assistentes de IA

Olá, Gemini Code Assist!

Este arquivo centraliza as diretrizes fundamentais que você deve seguir ao trabalhar neste projeto. Aderir a estas regras é crucial para manter a qualidade, consistência e performance do código.

---

Preste atenção às seguintes diretrizes cruciais deste projeto:

1. **Testes como Contrato (A Lei)**: Primeiro criamos os testes (unitários, segurança, etc.) para definir como o código deve funcionar. Só após os testes estarem prontos iniciamos a implementação. O código deve se adaptar para passar nos testes. NUNCA altere o teste apenas porque o código falhou; o código é que deve se adaptar a ele. Em caso de mudança de requisitos, altere o teste primeiro e, depois, o código.
2. **DocStrings Obrigatórias**: Todo código gerado (inclusive os de testes) deve conter DocStrings. Essa é a documentação para que os programadores entendam *como* o código está fazendo o que se propõe.
3. **Documentação via README.md**: Todo diretório deve ter um `README.md` explicando detalhadamente *o que* o código faz (para programadores e não-programadores). Um único README engloba todos os arquivos daquele diretório. Para os subdiretórios, explique-os brevemente indicando seus propósitos e inclua obrigatoriamente o link em markdown para seus respectivos READMEs.
4. **diff com a correção