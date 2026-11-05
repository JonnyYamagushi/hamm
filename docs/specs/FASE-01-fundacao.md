# Spec — Fase 1: Fundação

> Status: **aprovada** em 2026-11-05. Respostas: D1 a pessoa escolhe o tamanho do PIN (4 a 8 dígitos) · D2 aprovado (1 min) · D3 aprovado (neutro quente + coral) · D4 aprovadas, e a pessoa inclui/tira como quiser · D5 pacotes aprovados.
> Implementação e diferenças: ver `docs/PROJECT_STATUS.md`.
> Base: `ARQUITETURA.md`, `ROADMAP.md`, ADR-002 a ADR-007.

## 1. Objetivo

Um app que **instala, abre e lembra de você** no Android e no iPhone (Expo Go): cria o perfil, protege com PIN, mostra as cinco abas com estados vazios bem feitos e, se quiser, uma base de demonstração para ver como o app vai ficar. Ainda não registra movimentações de verdade (isso é a Fase 2).

## 2. Escopo

**Entra:**
1. Projeto Expo + TypeScript em `mobile/`, estrutura de pastas da arquitetura, lint, typecheck, Jest.
2. Tema claro/escuro/sistema com tokens (cores, tipografia, espaçamento, raio) e componentes base.
3. Navegação com 5 abas: **Início, Movimentações, Planejamento, Assistente, Ajustes**.
4. Banco SQLite com migration 1.
5. Onboarding (perfil, PIN, biometria opcional, preferências, categorias).
6. Bloqueio do app (PIN/biometria) ao abrir e ao voltar do segundo plano.
7. Camada de capacidades (Expo Go × build nativo) e tela "Sobre este aparelho" em Ajustes.
8. Base de demonstração (liga/desliga), totalmente separada dos dados reais.
9. Ajustes: aparência, perfil, preferências, categorias (ver/renomear/arquivar/criar), segurança (trocar PIN, biometria, tempo de bloqueio), apagar todos os dados.
10. PoC 3: checklist do que roda no Expo Go do iPhone (registrado no `PROJECT_STATUS`).

**Não entra (fases futuras):** contas reais, lançamentos, cartões, importação (F2); backup, SQLCipher, exportação (F3); orçamento, assistente funcional, notificações (F4); família (F5).

## 3. Telas

### 3.1 Onboarding (4 passos, barra de progresso, voltar sempre possível)
1. **Boas-vindas:** o que o app faz em 3 frases (offline, privado, grátis). Botões "Começar" e "Só quero ver a demonstração".
2. **Você:** nome ou apelido (obrigatório, 1–40 caracteres). Explica que fica só no celular.
3. **Proteção:** criar PIN de 6 dígitos (digitar duas vezes). Se o aparelho tiver biometria, oferecer "Usar digital/rosto também" (opcional). Aviso: "Se esquecer o PIN, só dá para recuperar apagando o app ou por um backup (Fase 3)".
4. **Preferências:** moeda (BRL fixo por enquanto, só exibido), dia de início do mês (1–28, padrão 1), fuso (padrão `America/Sao_Paulo`), categorias padrão pré-marcadas (desmarcar o que não usa).

Concluir cria perfil, configurações e categorias **numa única transação**.

"Só quero ver a demonstração" cria um perfil "Demonstração" sem PIN, liga a base fictícia e mostra uma faixa fixa "Modo demonstração — os dados são fictícios · Começar de verdade".

### 3.2 Bloqueio
- Pede PIN (ou biometria, se ligada) ao abrir e ao voltar do segundo plano depois do tempo configurado (padrão 1 minuto; opções: imediato, 1, 5, 15 min).
- Tentativas erradas: a partir da 5ª, espera crescente (30 s, 1 min, 5 min…), contada no armazenamento seguro para não zerar ao fechar o app. Nunca apaga dados sozinho.
- Ao ir para o segundo plano, cobre a tela com o fundo do app (não aparece nada nos apps recentes) — no Android também `FLAG_SECURE` se o build permitir; no Expo Go, só a cobertura.

### 3.3 Abas (Fase 1 = estrutura + estados vazios; com demonstração ligada, mostram dados fictícios)
- **Início:** seletor de mês; cartões "Saldo", "Gastos do mês", "Próximas faturas", "Dica da assistente". Vazio: convite para cadastrar a primeira conta (botão desabilitado com "chega na próxima versão").
- **Movimentações:** lista agrupada por dia (com demonstração), busca e filtros visuais.
- **Planejamento:** orçamento por categoria (barras), metas — só leitura na demonstração.
- **Assistente:** perguntas sugeridas; responde "ainda estou aprendendo" fora da demonstração. Com demonstração, 2 respostas prontas com "ver cálculo" para validar o formato.
- **Ajustes:** itens do §2.9 + "Sobre este aparelho" (ambiente, recursos disponíveis e o que fica indisponível no Expo Go, com explicação simples) + versão e licenças.

Estados obrigatórios em todas: vazio, carregando, erro (com "tentar de novo"). Fonte ampliada sem cortar texto; leitor de tela com rótulos; área de toque ≥ 44 pt; animações respeitam "reduzir movimento".

## 4. Dados — migration 1

| Tabela | Campos principais |
|---|---|
| `profiles` | `id`, `display_name`, `is_demo`, `created_at`, `updated_at` |
| `app_settings` | `profile_id`, `theme` (`system`/`light`/`dark`), `currency` (`BRL`), `month_start_day` (1–28), `time_zone`, `lock_timeout_seconds`, `biometrics_enabled`, `updated_at` |
| `categories` | `id`, `owner_id`, `name`, `kind` (`EXPENSE`/`INCOME`), `icon`, `color`, `parent_id?`, `sort_order`, `is_system`, `archived_at?`, `created_at`, `updated_at` |

- `CHECK` em enums e faixas; nome de categoria único por dono e tipo (sem diferenciar maiúsculas/acentos).
- PIN **não** fica no SQLite: hash com sal (SHA-256 via `expo-crypto`) no Secure Store (Keychain/Keystore), junto do contador de tentativas. A proteção real vem do Secure Store e da espera por tentativas: um PIN de 6 dígitos não resiste a força bruta fora do app, por isso nenhuma cifra de dados deriva dele (o backup usa senha de recuperação própria, Fase 3).
- Dados de demonstração: perfil próprio com `is_demo = 1`; as tabelas de contas/lançamentos da demo são **em memória** nesta fase (as tabelas reais nascem na Fase 2), então desligar a demo não deixa resto no banco.

Categorias padrão (despesa): Moradia, Mercado, Alimentação fora, Transporte, Saúde, Educação, Lazer, Compras, Assinaturas, Contas da casa, Pets, Presentes, Impostos e taxas, Outros. (Receita): Salário, Extra, Reembolso, Rendimentos, Outros.

## 5. Pacotes (precisam da sua aprovação, instalados com `npx expo install`)

Vêm do template do Expo (sem escolha): `expo`, `expo-router`, `react`, `react-native`, safe-area, screens, gesture-handler, reanimated, `expo-status-bar`, `expo-splash-screen`, `expo-font`, `expo-constants`, `expo-linking`, `expo-system-ui`, `@expo/vector-icons`, eslint + `eslint-config-expo`.

Adicionais (todos rodam no Expo Go):

| Pacote | Para quê |
|---|---|
| `expo-sqlite` | banco local |
| `expo-secure-store` | hash do PIN, tentativas, futuras chaves/tokens |
| `expo-local-authentication` | digital/rosto |
| `expo-crypto` | UUID, sal aleatório, hash |
| `jest`, `jest-expo`, `@types/jest` (dev) | testes |

Nada de fonte externa nesta fase (fonte do sistema) — direção visual em D3.

## 6. Critérios de aceite

1. `npx expo start` abre o app no Android (Expo Go) e no iPhone (Expo Go).
2. Onboarding completo → fecha o app → reabre: pede PIN e cai no Início, sem refazer o cadastro.
3. PIN errado 5 vezes ativa a espera; fechar e abrir o app não zera a espera.
4. Biometria ligada no Android funciona; no iPhone via Expo Go o app explica o que está disponível.
5. Demonstração: liga, navega pelas 5 abas com dados, desliga e o banco volta ao estado sem demo.
6. Tema claro/escuro/sistema troca na hora; fonte grande do sistema não corta textos nas 5 abas.
7. "Apagar todos os dados" (confirmação dupla) volta ao onboarding e limpa banco e Secure Store.
8. `tsc`, `expo lint`, `jest` e `expo-doctor` limpos.

## 7. Testes automatizados

- Domínio: validação de perfil, PIN (formato, confirmação), regras de espera por tentativas, categorias (unicidade normalizada, arquivar).
- Casos de uso com repositórios em memória: concluir onboarding (tudo ou nada), trocar PIN, apagar dados.
- SQLite real (`node:sqlite`): migration 1 em banco vazio, constraints, onboarding transacional.
- Capacidades: Expo Go × nativo × plataforma.

## 8. Decisões para o João

- **D1 — PIN de 6 dígitos** (ou 4?). Proposta: 6.
- **D2 — Bloqueio padrão:** pedir PIN após 1 minuto em segundo plano. Ok?
- **D3 — Direção visual:** proposta "calma e acolhedora": base neutra quente (off-white / grafite), **um destaque rosa-coral discreto** (remete ao porquinho sem ficar infantil), verde e vermelho só para entrada/saída sempre acompanhados de sinal (+/−). Mascote fica para depois. Alternativa: destaque verde-sálvia.
- **D4 — Categorias padrão** da §4: tirar ou incluir alguma?
- **D5 — Pacotes da §5:** aprovados?
