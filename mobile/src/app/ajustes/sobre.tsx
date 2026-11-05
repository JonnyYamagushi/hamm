import Constants from 'expo-constants';

import { AppText, Card, Screen } from '@/ui/primitives';

export default function SobreScreen() {
  return (
    <Screen edges={['left', 'right']}>
      <Card>
        <AppText variant="heading">Hamm</AppText>
        <AppText tone="muted">Versão {Constants.expoConfig?.version ?? '—'} · Fase 1 (fundação)</AppText>
      </Card>
      <AppText>
        App gratuito e de código aberto para organizar o dinheiro da pessoa e da família. Funciona sem internet, sem anúncios e
        sem coletar seus dados: tudo fica neste celular.
      </AppText>
      <AppText tone="muted">
        Inspirado na ideia de uma assistente financeira que explica as contas. Não tem relação com bancos, com outros apps de
        finanças nem com personagens de terceiros.
      </AppText>
      <AppText variant="heading">Créditos de código aberto</AppText>
      <AppText tone="muted">
        Feito com Expo, React Native, Expo Router, SQLite (expo-sqlite), expo-secure-store, expo-local-authentication,
        expo-crypto e ícones Ionicons. As licenças de cada biblioteca acompanham o código-fonte.
      </AppText>
    </Screen>
  );
}
