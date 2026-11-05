# Hamm — app mobile

App Expo (SDK 58, React Native 0.88, Expo Router), **offline**: os dados ficam em SQLite no próprio celular. Regras do projeto em [`../CLAUDE.md`](../CLAUDE.md); estado atual em [`../docs/PROJECT_STATUS.md`](../docs/PROJECT_STATUS.md).

## Rodar

```bash
npm install
npx expo start          # abre o servidor; leia o QR code com o celular
```

- **iPhone:** instale o **Expo Go** (App Store) e aponte a **câmera** para o QR code. Celular e computador na **mesma rede Wi-Fi**.
- **Android:** instale o **Expo Go** (Play Store) e use "Scan QR code" dentro dele.
- **Emulador Android:** `adb reverse tcp:8081 tcp:8081` e abrir `exp://127.0.0.1:8081` no Expo Go.

Os dados de teste ficam dentro do Expo Go, no aparelho, e não se perdem ao fechar o app.

## Validar antes de entregar

```bash
npx tsc --noEmit     # tipos
npx expo lint        # lint
npx jest             # testes (domínio, casos de uso e SQLite real via node:sqlite)
npx expo-doctor      # saúde das dependências
```

Pacotes: **sempre** `npx expo install <pacote>`. Antes de usar uma API do Expo, consulte a doc da versão: https://docs.expo.dev/versions/v58.0.0/ (ver `AGENTS.md`).

## Estrutura

```
src/app/             telas e rotas (Expo Router)
src/ui/              tema, componentes, contextos (raiz de composição)
src/domain/          regras puras: dinheiro em centavos, período, PIN, categorias, demonstração, capacidades
src/application/     casos de uso + ports (onboarding, segurança, categorias, preferências)
src/infrastructure/  SQLite (migrations, repositórios com SQL explícito), Secure Store, biometria, relógio/UUID
```
