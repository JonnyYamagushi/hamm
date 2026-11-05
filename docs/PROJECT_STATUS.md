# PROJECT STATUS — Hamm — Dr. Porcão

> Leia antes de qualquer trabalho relevante.
> Status permitidos: `NOT_STARTED` · `IN_PROGRESS` · `AWAITING_USER_APPROVAL` · `APPROVED` · `BLOCKED`.

**Fase atual:** Fase 1 — Fundação (`docs/specs/FASE-01-fundacao.md`)
**Status:** `AWAITING_USER_APPROVAL` — implementada em 2026-11-05. **A Fase 2 NÃO está liberada.**
**Última fase aprovada:** Fase 0 (2026-11-05)

## Feito
- 2026-10-26: especificação lida (`docs/product/ESPECIFICACAO.md`, v1.2).
- 2026-11-05: só GitHub, sem lojas (ADR-001); esposa com iPhone sem Mac → Expo Go (ADR-004); Fase 0 aprovada com MVP Pessoal × Família (ADR-007).
- 2026-11-05: spec da Fase 1 aprovada. Decisões: **D1** a pessoa escolhe o tamanho do PIN (4 a 8 dígitos); **D2** bloqueio após 1 min; **D3** visual neutro quente + coral; **D4** categorias padrão aprovadas e a pessoa inclui/tira como quiser; **D5** pacotes aprovados.

## Implementado na Fase 1
- Projeto Expo **SDK 58** em `mobile/` (o Expo Go da App Store já está no 58 desde 22/10/2026).
- Pacotes: `expo-sqlite`, `expo-secure-store`, `expo-local-authentication`, `expo-crypto`, `@expo/vector-icons` (listado na spec; o template do SDK 58 não traz mais), jest/jest-expo/@types/jest; eslint + eslint-config-expo instalados pelo `expo lint`.
- Banco: migration 1 (`profiles`, `app_settings`, `categories`) com CHECKs e índice único de nome por dono/tipo (sem diferenciar acento).
- Onboarding em 3 passos (nome → PIN de 4 a 8 dígitos + biometria opcional → dia de início do mês, fuso e categorias) gravado numa única transação; "Só quero ver a demonstração" cria perfil fictício sem PIN.
- PIN: hash com sal no Secure Store (`THIS_DEVICE_ONLY`), espera crescente a partir da 5ª falha (30 s, 1, 5, 15, 30 min) que sobrevive a fechar o app; biometria quando disponível.
- Bloqueio ao abrir e ao voltar depois do tempo escolhido; tela coberta nos apps recentes.
- 5 abas com estados vazios; **demonstração** liga/desliga em Ajustes (dados fictícios só em memória) com Início, Extrato, Planejamento e Assistente (2 perguntas com "ver cálculo" e "ver movimentações usadas").
- Ajustes: perfil, preferências, categorias (criar, renomear, trocar ícone/cor, excluir, trazer de volta as padrão), aparência (sistema/claro/escuro), segurança (trocar PIN, biometria, tempo de bloqueio), "Sobre este aparelho" (capacidades Expo Go × app instalado), sobre o app, apagar todos os dados (confirmação dupla).
- **Testes:** 67 verdes (domínio, casos de uso e SQLite real via `node:sqlite`); `tsc`, `expo lint` e `expo-doctor` (20/20) limpos no código do app; bundles Android e iOS fecham.

## Revisão visual (emulador Android, Expo Go, 2026-11-05)
Percorridos: boas-vindas, cadastro completo, bloqueio, 5 falhas com espera (persistiu ao reabrir: 46 s de 60), desbloqueio, demonstração nas 5 abas, resposta da assistente com cálculo, tema escuro, categorias, apagar tudo → volta ao cadastro.
Corrigido na revisão: abas desenhando antes do cadastro (erro), "Passo 1 de 4" (são 3), lista de fusos ocupando a tela (agora recolhida), seleção de categoria só por cor (agora com ✓), rótulos das abas ocultos e "Movimentações" cortado (aba agora se chama **Extrato**; a tela mantém o título), "Novembro **De**", "R$" quebrando a linha, seta em itens que são ações, interruptor invisível no tema escuro, cantos do extrato, e a assistente comparando o mês parcial com o mês anterior inteiro (agora compara com o mesmo trecho do mês anterior).

## Diferenças em relação à spec (para o João validar)
- Aba "Movimentações" virou **"Extrato"** na barra (o nome não cabia).
- Categoria: **excluir** em vez de arquivar (sem lançamentos ainda, arquivar não faz sentido; arquivar chega na Fase 2 para categorias em uso).
- Demonstração também pode ser ligada por quem já tem perfil (em Ajustes), sem gravar nada.
- Bloqueio de print virou **opção** em Ajustes › Segurança, desligada por padrão (pedido do João, ADR-011; `expo-screen-capture`, migration 2). Verificado no emulador: ligado, o print sai preto; desligado, volta ao normal.

## Não verificado
- **iPhone físico (Expo Go):** nada foi aberto no iOS ainda (é a PoC 3: conferir biometria/Face ID → código do iPhone, cobertura nos recentes, fonte grande).
- Biometria real (o emulador não tem digital cadastrada); fonte ampliada do sistema; leitor de tela.

## Aguardando o João
- [ ] Testar a Fase 1 no Android (o iPhone fica para depois, decisão de 2026-11-05) e aprovar.
- [x] Arquivos de exemplo do template apagados (autorizado em 2026-11-05).
- [x] Licença: MIT na raiz; LICENSE da Expo removida (ADR-010).
- [x] Repositório público https://github.com/JonnyYamagushi/hamm (ADR-012).
- [ ] Ativar o perfil no GitHub Sponsors (https://github.com/sponsors) para o botão de apoio aparecer.
- [ ] Três contas Google de teste — só antes da Fase 5 (PoC 1).

## Como testar a Fase 1
1. `cd C:\PROJETOS\Hamm\mobile` e `npx expo start`.
2. Celular na mesma Wi-Fi, Expo Go aberto → QR code.
3. Roteiro: cadastro → fechar e abrir (pede PIN) → errar 5 vezes (espera) → entrar → Ajustes › Mostrar dados fictícios → passear pelas abas → Assistente › perguntas → tema escuro → criar/excluir categoria → Apagar todos os dados.
