# Segurança

O Hamm guarda dados financeiros pessoais. Levamos falhas de segurança a sério.

## Como avisar

**Não abra issue pública** para uma vulnerabilidade. Use o recurso **"Report a vulnerability"** na aba **Security** deste repositório (aviso privado ao mantenedor).

Inclua, se puder: o que encontrou, como reproduzir, versão do app e aparelho. Responderemos assim que possível; o projeto é mantido no tempo livre.

## Escopo

- O app e o código deste repositório.
- Fora do escopo: serviços de terceiros (Google, Apple, bancos, provedores de Open Finance), aparelhos com root/jailbreak e ataques que exigem o celular já desbloqueado nas mãos de outra pessoa.

## Princípios

- Dados ficam no aparelho; nada é enviado a servidor do projeto (não existe servidor).
- Segredos (PIN, tokens, chaves) nunca vão para o banco, para o backup nem para o repositório.
- Criptografia só com bibliotecas auditadas; nada de algoritmo caseiro.
