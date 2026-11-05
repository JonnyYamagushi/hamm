# DECISIONS — Hamm — Dr. Porcão (ADR)

> `Accepted` valem; `Proposed` aguardam aprovação do João. Decisões nunca mudam silenciosamente.

---

## ADR-001
**Título:** Nome provisório e distribuição só pelo GitHub
**Status:** Accepted
**Contexto:** "Hamm" e "Dr. Porcão" remetem ao porquinho-cofre de Toy Story e ao "Evil Dr. Porkchop". Nas lojas, isso seria motivo de remoção por reclamação de marca. O João decidiu (2026-10-26) que o app **nunca** será distribuído por lojas; fica no GitHub para quem quiser baixar e modificar.
**Decisão:** Manter **Hamm — Dr. Porcão** como nome, definido em um único lugar (`APP_NAME` no `app.config.ts`), com bundle id próprio configurável. Mascote 100% original; nenhuma referência a Toy Story, Disney ou Pixar no código, README, ícones ou textos.
**Consequências:** Risco residual baixo (o GitHub pode remover repositório após notificação de marca); se acontecer, renomear é trocar uma configuração e o nome do repositório. Pesquisa no INPI fica opcional.
**Data:** 2026-11-05

---

## ADR-002
**Título:** Stack mobile igual ao MosaInk (Expo + SQLite com SQL explícito)
**Status:** Accepted (2026-11-05)
**Decisão:** React Native + Expo + TypeScript + Expo Router; `expo-sqlite` com SQL explícito nos repositórios; migrations por `PRAGMA user_version`; Jest com SQLite real via `node:sqlite`. SDK do Expo = o mais novo aceito pelo Expo Go da App Store no dia da inicialização.
**Alternativas consideradas:** Flutter (usado no Meu Coelhário; também serviria, mas o João tem mais padrões prontos no MosaInk/Transfy em TS); PWA (não resolve background, criptografia nativa nem login Google offline de forma confiável).
**Consequências:** Reaproveita convenções, testes e lições do MosaInk. Sem ORM.
**Data:** 2026-11-05

---

## ADR-003
**Título:** Projeto único em vez de monorepo
**Status:** Accepted (2026-11-05)
**Contexto:** A spec sugere `packages/*`, mas pede monorepo só se houver benefício concreto.
**Decisão:** Um app em `mobile/` com fronteiras por pasta (`domain`, `application`, `infrastructure`, `ui`, `app`). Pastas viram pacotes só se surgir um segundo consumidor (ex.: conector self-hosted).
**Consequências:** Menos configuração (workspaces, Metro, Jest); a separação é garantida por regra de import e revisão.
**Data:** 2026-11-05

---

## ADR-004
**Título:** Distribuição: APK no GitHub, iPhone via Expo Go, build iOS próprio opcional
**Status:** Accepted (2026-11-05)
**Contexto:** A esposa do João usa iPhone e eles não têm Mac. Sem loja, o iPhone só roda o app via Expo Go (da App Store) ou com build próprio, que exige conta Apple (US$ 99/ano). O build pode ser feito na nuvem pelo EAS, **sem Mac**.
**Decisão:** Android: APK assinado (GitHub Releases). iPhone: Expo Go durante o desenvolvimento e para o modo pessoal. Os recursos que precisam de build nativo são implementados e documentados para quem tiver conta Apple; a decisão de assinar a conta fica com o João, quando a família precisar.
**Consequências:** No Expo Go o app depende do computador do João rodando `npx expo start` na mesma rede para carregar o código (os dados ficam no celular). Mesma situação do MosaInk.
**Data:** 2026-11-05

---

## ADR-005
**Título:** Recursos por capacidade do ambiente (Expo Go × build nativo)
**Status:** Accepted (2026-11-05)
**Decisão:** Uma camada `capabilities` detecta o ambiente (Expo Go, build nativo, plataforma). Recursos que dependem de módulo nativo (SQLCipher, login Google, Face ID, tarefas em segundo plano) aparecem desabilitados com explicação em vez de quebrar. Nenhuma função essencial depende deles.
**Consequências:** O mesmo código serve aos dois ambientes; testes cobrem os dois caminhos.
**Data:** 2026-11-05

---

## ADR-006
**Título:** Dinheiro, datas e identificadores
**Status:** Accepted (2026-11-05)
**Decisão:** Valores em `amount_minor` inteiro + `currency`; datas em UTC ISO-8601 e exibição no fuso do perfil (padrão `America/Sao_Paulo`); `occurred_at` de lançamentos manuais guarda também a data local escolhida para não "pular dia"; IDs UUID v4.
**Data:** 2026-11-05

---

## ADR-007
**Título:** MVP dividido em Pessoal e Família
**Status:** Accepted (2026-11-05)
**Contexto:** Sincronização familiar cifrada com troca de chaves, conflitos e Drive compartilhado é maior que todo o resto e depende de uma PoC incerta (`drive.file` entre contas). No iPhone, ainda exige build próprio.
**Decisão:** MVP 1 Pessoal (Fases 1–4) e MVP 2 Família (Fase 5). O modelo de dados já nasce com `owner_id` e `visibility` para não haver retrabalho.
**Consequências:** Algo útil para os dois aparelhos bem antes; família não fica refém da PoC.
**Data:** 2026-11-05

---

## ADR-008
**Título:** Criptografia (backup, banco e família)
**Status:** Accepted (2026-11-05) — parâmetros do Argon2id definidos na PoC 2
**Decisão:**
- Backup: XChaCha20-Poly1305 + Argon2id via `@noble/ciphers` / `@noble/hashes` (JS puro, auditados), parâmetros versionados no cabeçalho.
- Banco: SQLCipher do `expo-sqlite` no build nativo, chave aleatória no Secure Store; no Expo Go, sem cifra própria e com aviso na tela de segurança.
- Família: chave simétrica do grupo; envelopes X25519 por dispositivo; assinatura Ed25519 dos eventos (`@noble/curves`).
**Alternativas consideradas:** `react-native-quick-crypto` / libsodium nativo (mais rápido, mas não roda no Expo Go).
**Consequências:** Se o Argon2id em JS for lento demais, ajustar parâmetros documentados ou trocar por nativo só no build próprio.
**Data:** 2026-11-05

---

## ADR-009
**Título:** Google Drive com um projeto OAuth do mantenedor, publicado "Em produção"
**Status:** Accepted (2026-11-05)
**Decisão:** Como no Meu Coelhário: um projeto no Google Cloud do João, escopo `drive.file`, tela de consentimento publicada (sem verificação, sem expiração em 7 dias), página inicial e política de privacidade no GitHub Pages. Client IDs públicos no `app.config.ts`. Quem compilar com outra chave de assinatura ou outro bundle id cria as próprias credenciais (passo a passo no README).
**Pendência:** a PoC 1 decide se `drive.file` serve para a pasta da família.
**Data:** 2026-11-05

---

## ADR-010
**Título:** Licença MIT
**Status:** Accepted
**Contexto:** A spec pede licença permissiva (MIT ou Apache-2.0). O João deixou a escolha comigo (2026-11-05).
**Decisão:** MIT na raiz do repositório. A `LICENSE` do template do Expo (copyright da Expo) foi removida de `mobile/`.
**Alternativas consideradas:** Apache-2.0 (proteção explícita de patentes, mas texto longo e exige NOTICE em forks; sem ganho prático para um app pessoal).
**Consequências:** Qualquer pessoa pode usar, modificar e redistribuir, mantendo o aviso de copyright. Dependências atuais (Expo, React Native, bibliotecas `expo-*`) são MIT ou compatíveis.
**Data:** 2026-11-05

---

## ADR-011
**Título:** Impedir prints e gravação de tela como opção
**Status:** Accepted
**Contexto:** O João pediu (2026-11-05) para deixar o bloqueio de print como opcional nas configurações.
**Decisão:** `expo-screen-capture` (embutido no Expo Go), opção em Ajustes › Segurança, **desligada por padrão**, guardada em `app_settings.block_screen_capture` (migration 2). Android usa `FLAG_SECURE` (também deixa o app em branco nos recentes); iOS 13+ bloqueia print e gravação.
**Consequências:** Com a opção ligada, a própria pessoa também não consegue tirar print do app (ex.: para mandar um comprovante).
**Data:** 2026-11-05

---

## ADR-012
**Título:** Repositório público no GitHub com apoio via GitHub Sponsors
**Status:** Accepted
**Decisão:** Repositório público `JonnyYamagushi/hamm` (autorizado pelo João em 2026-11-05), CI com tipos, lint e testes, `FUNDING.yml` apontando para o GitHub Sponsors do João. Doar é opcional e não libera recurso nenhum.
**Consequências:** O botão "Sponsor" só aparece depois que o João ativar o perfil no GitHub Sponsors (Brasil é região suportada; exige conta bancária e residência fiscal no Brasil).
**Data:** 2026-11-05
