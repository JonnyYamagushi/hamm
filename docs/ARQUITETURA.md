# ARQUITETURA — Hamm — Dr. Porcão

> Status: **proposta (Fase 0)**, aguardando aprovação do João. Decisões detalhadas em `DECISIONS.md`.
> Especificação completa do produto: `product/ESPECIFICACAO.md`.

## 1. Visão geral

App mobile único (Android e iPhone) com o banco de cada pessoa **no próprio aparelho**. Não existe servidor do projeto. A internet só é usada para recursos opcionais: backup no Drive, pasta da família, Pluggy e IA externa.

```text
Aparelho do titular
 ├─ UI (Expo Router)            telas, navegação, estados (vazio, offline, erro…)
 ├─ application                 casos de uso + ports (interfaces)
 │   ├─ finanças                contas, cartões, faturas, parcelas, transferências
 │   ├─ importação              CSV / OFX com prévia e desfazer
 │   ├─ assistente              motor determinístico (LLM opcional depois)
 │   ├─ backup pessoal          snapshot → cifra → destino
 │   └─ família                 compartilhamento, eventos, conflitos
 ├─ domain                      regras puras (TS): dinheiro, competência, visibilidade
 └─ infrastructure
     ├─ SQLite local            repositórios com SQL explícito, migrations
     ├─ cripto                  AEAD + KDF (biblioteca auditada)
     ├─ arquivos                exportar/importar, compartilhar
     └─ adaptadores opcionais   Google Drive, Pluggy, LLM
```

## 2. Stack

| Item | Escolha | Por quê |
|---|---|---|
| App | React Native + **Expo** + TypeScript + Expo Router | Uma base para Android e iOS; mesmo stack do MosaInk; build iOS na nuvem (EAS) sem precisar de Mac |
| Banco | **SQLite** (`expo-sqlite`), SQL explícito, sem ORM | Offline, transacional, tem API de backup; padrão do João |
| Migrations | `PRAGMA user_version` + scripts numerados | Padrão já validado no MosaInk |
| Testes | Jest (`jest-expo`) + SQLite real via `node:sqlite` nos testes de repositório | Mesmo do MosaInk |
| Cripto | `@noble/ciphers` (XChaCha20-Poly1305) + `@noble/hashes` (Argon2id/HKDF) — **a aprovar** | JS puro auditado, roda no Expo Go e no build nativo |
| Segredos locais | `expo-secure-store` (Keychain/Keystore) | Chave do banco, tokens OAuth, credenciais Pluggy ficam fora do SQLite |
| Bloqueio | `expo-local-authentication` + PIN | Biometria quando houver; PIN sempre |

SDK do Expo: o mais novo que o **Expo Go da App Store** aceitar no dia da inicialização (lição do ADR-010 do MosaInk).

## 3. Estrutura do repositório

Projeto único, sem monorepo (a spec pede monorepo só se trouxer benefício concreto; hoje não traz). Os "packages" da spec viram pastas com fronteiras claras; se um dia forem reutilizados fora do app, viram pacotes.

```text
Hamm/
  CLAUDE.md
  README.md  LICENSE  SECURITY.md  PRIVACY.md  CONTRIBUTING.md  .env.example
  docs/
    ARQUITETURA.md  ROADMAP.md  DECISIONS.md  PROJECT_STATUS.md
    product/        especificação e jornadas
    specs/          spec de cada fase
    security/       threat model, formato do backup, protocolo da família
  mobile/
    app.config.ts   APP_NAME, bundle id, client ids públicos (lidos do .env)
    src/
      app/              rotas e layouts (Expo Router)
      ui/               tema, componentes, raiz de composição
      domain/           money, period, transaction, card-bill, installment, visibility…
      application/      casos de uso + ports
      infrastructure/
        sqlite/         migrations, repositórios
        crypto/
        files/
        adapters/       google-drive, pluggy, llm (opcionais)
      capabilities/     detecção do que o ambiente suporta (ADR-005)
  .github/workflows/  typecheck, lint, testes
```

Regras de dependência: `app/ui → application → domain`; `infrastructure → application/domain`. `domain` não importa Expo, React nem SQLite. SQL só em `infrastructure/sqlite`.

## 4. Domínio financeiro (núcleo)

- **Dinheiro:** `amount_minor` inteiro + `currency`. Toda soma/rateio em inteiros; arredondamento explícito em parcelas (resto vai para a 1ª parcela, configurável).
- **Tipos de lançamento:** `EXPENSE`, `INCOME`, `TRANSFER`, `REFUND`, `BILL_PAYMENT`, `ADJUSTMENT`.
  - Pagamento de fatura e transferência entre contas próprias **não** entram em receita/despesa consolidada.
  - Estorno reduz a despesa da categoria original; nunca vira receita.
- **Cartão:** compra gera despesa reconhecida por data da compra **ou** competência da fatura (configuração do usuário). Fatura (`card_bills`) agrega itens e é reconciliada com o total informado/importado.
- **Parcelas:** `installment_plans` agrupa parcelas por heurística verificável; valor da parcela ≠ valor total ≠ total da fatura.
- **Status:** `PENDING → POSTED` atualiza o mesmo registro (chave de origem), sem duplicar.
- **Deduplicação:** por `source` + `source_transaction_id` quando existe; sem ID de origem, por impressão digital da linha **dentro do mesmo arquivo/importação** + revisão humana. Nunca só por valor+loja+data.
- **Edição manual vence:** campos alterados à mão ficam marcados e não são sobrescritos por importação ou assistente.
- **Visibilidade:** `PRIVATE` (padrão) ou `FAMILY`. Regra efetiva = grant da transação, senão política da conta, senão `PRIVATE`.

## 5. Banco local

Tabelas da spec §6, criadas por fase (cada migration só cria o que a fase usa). Convenções:

- PK `id TEXT` (UUID v4), `created_at`/`updated_at` em UTC ISO-8601, exclusão lógica `deleted_at`.
- `owner_id` em todo dado financeiro (prepara o modo família desde o dia 1).
- Constraints `CHECK` para enums e `amount_minor` inteiro; índices por `(owner_id, occurred_at)`, `(account_id, occurred_at)`, `(source, source_transaction_id)`.
- Escritas multi-tabela sempre em transação (`withExclusiveTransactionAsync`).
- Meta de performance: 50 mil transações com lista e busca fluidas (índices + paginação por cursor de data).

**Criptografia em repouso:** SQLCipher não existe no Expo Go. Proposta (ADR-008): no build nativo, SQLCipher do `expo-sqlite` com chave no Keychain/Keystore; no Expo Go, banco sem cifra própria (fica a proteção do sandbox e da criptografia do aparelho) e o app **avisa isso** em Ajustes › Segurança.

## 6. Ambientes de execução (ADR-005)

| Recurso | Android (APK/dev build) | iPhone via Expo Go (hoje) | iPhone com build próprio (EAS + conta Apple) |
|---|---|---|---|
| Finanças, importação CSV/OFX, relatórios, assistente básica | Sim | Sim | Sim |
| Exportar/restaurar backup cifrado por arquivo | Sim | Sim | Sim |
| PIN / biometria | Sim | PIN + biometria limitada (Face ID não funciona no Expo Go) | Sim |
| Banco cifrado (SQLCipher) | Sim | **Não** | Sim |
| Login Google → backup no Drive e pasta da família | Sim | **Não** (Expo Go não aceita o login nativo do Google) | Sim |
| Tarefas em segundo plano | Best effort | Limitado | Best effort (iOS decide) |
| Pluggy pessoal | Sim (opt-in) | A avaliar | Sim (opt-in) |

Consequência prática: **o iPhone da esposa usa tudo do modo pessoal pelo Expo Go**, mas só entra na sincronização da família quando houver um build iOS próprio (EAS na nuvem, sem Mac, com a conta Apple de US$ 99/ano). Todo o código desses recursos fica pronto e disponível para quem compilar.

## 7. Backup pessoal

1. Snapshot consistente do SQLite (API de backup do `expo-sqlite`, nunca cópia do arquivo aberto).
2. Manifesto: `format_version`, `app_version`, `schema_version`, `backup_id`, `created_at`, tamanho, hashes, componentes. Sem segredos.
3. Cifra: XChaCha20-Poly1305 com chave derivada por Argon2id da **senha de recuperação** do titular (salt/nonce aleatórios, parâmetros do KDF no cabeçalho). Chave diferente da chave da família.
4. Destinos: **arquivo** (compartilhar/salvar — funciona em todo lugar) e **Google Drive pessoal** (`appDataFolder` ou pasta própria, escopo `drive.file`, quando houver login Google).
5. Upload com arquivo temporário + verificação + finalização; nunca apaga o último backup válido antes de confirmar o novo; retenção 7 diários / 4 semanais / 3 mensais.
6. Restauração: valida autenticação e versão → prévia → backup de segurança dos dados atuais → restaura em cópia isolada → migra → valida → troca atômica. MVP só "substituir".

Formato detalhado em `docs/security/BACKUP_FORMAT.md` (Fase 3).

## 8. Família (MVP 2 — depende da prova de conceito da Fase 0)

- Cada aparelho continua dono do seu SQLite. Só **eventos de dados compartilhados** saem do aparelho, cifrados com a **chave do grupo**, para uma pasta do Drive compartilhada entre as contas Google da família.
- Cada dispositivo escreve **só os próprios arquivos** (append-only, nome único `member/device/seq-eventId`), então não existe disputa de escrita no Drive.
- Leitura por cursor por dispositivo de origem; aplicação idempotente por `event_id`; conflitos (mesmo registro editado em dois lugares) vão para `sync_conflicts` e o usuário decide. Nunca "última gravação vence".
- Chave do grupo entregue por envelope cifrado para a chave pública de cada dispositivo (X25519); rotação ao remover membro. Cópias já baixadas por quem saiu não podem ser apagadas — o app explica isso.
- Credenciais Pluggy, tokens OAuth e chaves privadas **nunca** vão para a pasta.

**Risco nº 1:** com o escopo `drive.file`, o app de um membro pode não enxergar arquivos criados pelo app de outro membro na pasta compartilhada. A Fase 0 testa isso com três contas Google antes de qualquer código da família. Se falhar, alternativas: Google Picker para cada membro "abrir" a pasta; escopo mais amplo (exige verificação do Google); ou troca manual de arquivos de eventos.

Protocolo detalhado em `docs/security/FAMILY_SYNC.md` (Fase 5).

## 9. Assistente

- `AssistantEngine` determinístico: intenções reconhecidas por regras (pt-BR), cada intenção chama uma consulta/calculadora do `application` e devolve resultado estruturado + IDs das transações usadas + fórmula.
- Insights (`assistant_insights`) recalculados de forma incremental quando lançamentos mudam; cada um guarda tipo, fórmula/versão e evidências.
- Em modo família, a assistente só consulta dados com compartilhamento vigente.
- `LLMAdapter` (depois, opcional, chave do próprio usuário): só interpreta a pergunta e redige a resposta a partir do resultado calculado.

## 10. Integrações opcionais

- **Google (Drive):** um projeto no Google Cloud do mantenedor, client IDs públicos no `.env`/`app.config.ts`, tela de consentimento publicada "Em produção" com `drive.file` (sem verificação; mesmo modelo do Meu Coelhário). Quem compilar com outra chave/bundle cria as próprias credenciais (README).
- **Pluggy pessoal:** desligado por padrão; cada titular cadastra as próprias credenciais no próprio aparelho (Secure Store); endpoint `/v2/transactions` com cursor. Só depois de confirmar os termos com a Pluggy.
- **LLM:** desligado por padrão; chave do usuário; aviso de custo e de envio de dados.

## 11. Distribuição

- **Só GitHub** (sem lojas). Android: APK assinado no GitHub Releases. iPhone: Expo Go durante o desenvolvimento; build próprio via EAS (nuvem, sem Mac) para quem tiver conta Apple.
- Repositório público só quando o João autorizar (Fase 7); até lá, local.
