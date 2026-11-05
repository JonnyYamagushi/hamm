# CLAUDE.md — Hamm — Dr. Porcão

> Regras permanentes do projeto. Leia antes de qualquer trabalho.

## 0. Antes de trabalhar (checklist obrigatório)

1. Ler este `CLAUDE.md`.
2. Ler `docs/PROJECT_STATUS.md` (fase atual e status).
3. Ler `docs/ROADMAP.md`, `docs/ARQUITETURA.md` e `docs/DECISIONS.md`.
4. Ler a spec da fase atual em `docs/specs/` (e, quando preciso, a especificação completa em `docs/product/ESPECIFICACAO.md`).
5. Rodar os testes existentes antes de mudar código.

## 1. Objetivo

App gratuito e open source de finanças pessoais e familiares (Android e iPhone), offline-first, com assistente financeira que calcula localmente e explica cada número. Inspirado na experiência da antiga Olivia, sem copiar marca, textos nem visual.

Primeiros usuários: o João (Android) e a esposa (iPhone). A filha entra no modo família.

## 2. Regras de produto que não mudam

- Tudo **privado por padrão**; só entra na visão da família o que o titular compartilhar (por conta ou por transação; a transação tem precedência).
- Funciona **sem internet, sem banco conectado, sem IA paga e sem servidor**.
- Dinheiro sempre em **centavos inteiros** (`amount_minor`), nunca `float`. Datas em UTC, exibidas no fuso do usuário. IDs UUID.
- A assistente nunca inventa número: todo total vem de cálculo local com "ver cálculo" e "ver movimentações usadas".
- Nenhum segredo (token, clientSecret, chave privada, PIN) no GitHub, no backup ou na pasta da família.
- Nunca prometer o que Android/iOS/provedores não garantem (background, push, Open Finance familiar).

## 3. Marca

- Nome provisório **Hamm — Dr. Porcão**, configurável em um único lugar (`APP_NAME`). Distribuição só pelo GitHub (ADR-001).
- Mascote porquinho **100% original**. Proibido qualquer referência visual, textual ou de voz a Toy Story/Disney/Pixar (inclusive no README).

## 4. Stack e arquitetura

Ver `docs/ARQUITETURA.md`. Resumo: Expo + React Native + TypeScript + Expo Router; SQLite local (`expo-sqlite`) com **SQL explícito** nos repositórios; migrations por `PRAGMA user_version`. Mesmo padrão do MosaInk.

- **Proibido:** ORM de qualquer tipo (Drizzle, TypeORM, Prisma, WatermelonDB etc.).
- Dependências: `domain` não importa Expo/React/SQLite; SQL só em `infrastructure`.
- Nova dependência só com justificativa e aprovação do João. Pacotes sempre com `npx expo install`.
- Recursos que exigem módulo nativo fora do Expo Go ficam atrás de detecção de capacidade (ADR-005): o app nunca quebra no Expo Go, só esconde ou explica o recurso.

## 5. Desenvolvimento por fases (REGRA MAIS IMPORTANTE)

- Só existe autorização para a **fase atual** (ver `docs/PROJECT_STATUS.md`).
- Fluxo: spec da fase → aprovação do João → implementação → testes → `AWAITING_USER_APPROVAL` → **PARAR**.
- Silêncio ≠ aprovação. Não antecipar funcionalidades de fases futuras.
- Publicar no GitHub, criar repositório remoto, instalar pacotes ou transmitir dado financeiro real: só com autorização explícita.

## 6. Testes

- Jest (`jest-expo`); arquivos `__tests__/*-test.ts` ao lado do código; caminho feliz se chama `Success`.
- Domínio financeiro com cobertura forte (estorno, fatura, parcela, transferência, dupla contagem).
- Não dizer que algo foi testado no aparelho se não foi.
