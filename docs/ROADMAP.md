# ROADMAP — Hamm — Dr. Porcão

> Status: **aprovado** pelo João em 2026-11-05 (incluindo a divisão MVP Pessoal × Família).
> Com a divisão, as provas de conceito da Fase 0 foram redistribuídas: PoC 3 (Expo Go) entra na Fase 1, PoC 2 (Argon2id) na Fase 3 e PoC 1 (Drive entre contas) é pré-requisito da Fase 5.
> Cada fase: spec em `docs/specs/` → aprovação → implementação → testes → `AWAITING_USER_APPROVAL` → parar.
> Fases grandes podem ser entregues em micro-versões (como no MosaInk), cada uma usável no dia seguinte.

## Proposta de divisão do escopo

A spec original põe pessoal e família juntos no MVP. Proposta: **dois marcos**.

- **MVP 1 — Pessoal (Fases 1 a 4):** útil para cada pessoa sozinha, funciona no Android e no iPhone via Expo Go.
- **MVP 2 — Família (Fase 5):** depende da prova de conceito do Drive (Fase 0) e, para o iPhone, de um build iOS próprio.

## Fase 0 — Planejamento e provas de conceito

- Documentos: `ARQUITETURA.md`, `ROADMAP.md`, `DECISIONS.md` (este pacote).
- **PoC 1 (crítica):** três contas Google de teste, escopo `drive.file`, pasta compartilhada — cada conta consegue listar, ler e criar arquivos criados pelas outras? Com e sem Google Picker.
- **PoC 2:** Argon2id em JS puro no celular — parâmetros que derivam a chave em ≤ 2 s num Android médio.
- **PoC 3:** o que roda no Expo Go do iPhone (biometria, compartilhar arquivo, SQLite, tamanho de base).
- Contato com a Pluggy sobre três contas pessoais de titulares distintos (pendência do João).

Aceite: decisões das PoCs registradas em ADR; nenhuma linha de código do app.

## Fase 1 — Fundação

- Projeto Expo + TypeScript, lint, typecheck, Jest, CI no GitHub Actions (local até publicar).
- Tema claro/escuro/sistema, tipografia, componentes base, estados (vazio, carregando, erro, offline).
- Navegação com as 5 abas (Início, Movimentações, Planejamento, Assistente, Ajustes).
- SQLite + migration 1 (`profiles`, `app_settings`, `accounts`, `categories`), camada de capacidades (ADR-005).
- Onboarding: perfil, PIN/biometria, moeda/fuso/início do mês, categorias padrão.
- Dados fictícios de demonstração (liga/desliga).

Aceite: abre no Android e no iPhone (Expo Go), cria perfil, fecha e reabre sem refazer onboarding.

## Fase 2 — Finanças essenciais

- Contas, receitas, despesas, transferências, categorias, tags.
- Cartões, faturas (fechamento/vencimento), compras parceladas, pagamento de fatura, estornos.
- Lista de movimentações com busca, filtros e agrupamento por dia; edição com rastreabilidade.
- Início com saldo, despesas do período, faturas próximas.
- Importação CSV e OFX com mapeamento de colunas, prévia, idempotência e desfazer.

Aceite: os itens 3 e 4 da Definition of Done (registrar offline; importar duas vezes sem duplicar). Testes de domínio de toda a semântica financeira (spec §6).

## Fase 3 — Segurança e backup pessoal

- Bloqueio por PIN/biometria, ocultar conteúdo nos apps recentes.
- Backup cifrado por arquivo (exportar/compartilhar) e restauração com prévia, cópia de segurança e troca atômica.
- Backup no Google Drive pessoal (Android; iPhone quando houver build próprio), retenção, gatilhos best effort, "último backup válido".
- SQLCipher no build nativo.
- Exportar JSON/CSV, apagar dados.

Aceite: restaurar Android → iPhone e iPhone → Android **por arquivo**; senha errada e arquivo corrompido não apagam nada.

## Fase 4 — Planejamento e assistente básica — **fecha o MVP 1**

- Orçamento por categoria, metas, recorrências/assinaturas, compromissos futuros, previsão do mês.
- Assistente: perguntas sugeridas + parser local para as perguntas 1 a 6 da spec, "ver cálculo", "ver movimentações".
- Insights e notificações locais configuráveis (fatura próxima, orçamento, gasto fora do padrão, backup antigo).

Aceite: Definition of Done do modo pessoal; teste de uso real pelo João e pela esposa por algumas semanas.

## Fase 5 — Família — **MVP 2**

Só começa com a PoC 1 aprovada.

- Criar/entrar em família, convites, papéis, revogação, chaves de grupo por envelope.
- Compartilhamento por conta e por transação (privado por padrão), revisão do alcance.
- Eventos cifrados na pasta do Drive, leitura incremental, deduplicação, conflitos, tombstones, rotação de chave.
- Visão "Minha visão ↔ Família", perguntas 7 e 8 da assistente, avisos locais de novidades.
- Teste com três contas Google e dois ou três aparelhos, offline e edição simultânea.

Aceite: itens de família da Definition of Done. iPhone da esposa participa quando existir build iOS próprio.

## Fase 6 — Integrações opcionais

- `PluggyPersonalAdapter` por titular (só com os termos confirmados).
- `LLMAdapter` com chave do usuário.
- iCloud como destino de backup no iPhone (com build próprio).

## Fase 7 — Open source e releases

- README para leigos e para quem vai fazer fork, `SECURITY.md`, `PRIVACY.md`, `CONTRIBUTING.md`, licença, `.env.example`.
- Repositório público no GitHub (com autorização do João), Dependabot, secret scanning, APK assinado no Releases.

## Depois

OCR de comprovantes, widgets, sincronização avançada (anexos, conflitos complexos), sincronização dos dados privados do mesmo titular entre vários aparelhos.
