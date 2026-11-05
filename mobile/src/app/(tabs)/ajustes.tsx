import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert } from 'react-native';

import { lockTimeoutLabel } from '@/domain/profile';
import { useApp, useSession } from '@/ui/app-context';
import { DemoBanner } from '@/ui/demo-banner';
import { useLock } from '@/ui/lock-context';
import { AppText, ListGroup, ListRow, Screen, SwitchRow } from '@/ui/primitives';

const THEME_LABEL = { system: 'Igual ao celular', light: 'Claro', dark: 'Escuro' } as const;

export default function AjustesScreen() {
  const { profile, settings } = useSession();
  const { categories, demoPreview, setDemoPreview, eraseAll } = useApp();
  const { lockNow } = useLock();

  const confirmErase = () =>
    Alert.alert(
      'Apagar todos os dados?',
      'Perfil, preferências, categorias e PIN serão apagados deste celular. Não dá para desfazer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Tem certeza?', 'Esta é a última confirmação.', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Apagar tudo', style: 'destructive', onPress: () => void eraseAll() },
            ]),
        },
      ],
    );

  return (
    <Screen banner={<DemoBanner />}>
      <AppText variant="title" accessibilityRole="header">
        Ajustes
      </AppText>

      <ListGroup title="Você">
        <ListRow icon="person-circle-outline" title="Perfil" value={profile.displayName} onPress={() => router.push('/ajustes/perfil')} />
        <ListRow
          icon="calendar-outline"
          title="Preferências"
          subtitle={`Mês começa no dia ${settings.monthStartDay}`}
          onPress={() => router.push('/ajustes/preferencias')}
        />
        <ListRow
          icon="pricetags-outline"
          title="Categorias"
          value={String(categories.length)}
          onPress={() => router.push('/ajustes/categorias')}
        />
        <ListRow icon="contrast-outline" title="Aparência" value={THEME_LABEL[settings.theme]} onPress={() => router.push('/ajustes/aparencia')} />
      </ListGroup>

      {!profile.isDemo ? (
        <ListGroup title="Segurança">
          <ListRow
            icon="shield-checkmark-outline"
            title="PIN e bloqueio"
            subtitle={lockTimeoutLabel(settings.lockTimeoutSeconds)}
            onPress={() => router.push('/ajustes/seguranca')}
          />
          <ListRow icon="lock-closed-outline" title="Bloquear agora" action onPress={lockNow} />
        </ListGroup>
      ) : null}

      {!profile.isDemo ? (
        <ListGroup
          title="Demonstração"
          footer="Mostra dados fictícios nas telas para você ver como o app vai ficar. Nada é gravado e seus dados não mudam.">
          <SwitchRow title="Mostrar dados fictícios" value={demoPreview} onValueChange={setDemoPreview} />
        </ListGroup>
      ) : null}

      <ListGroup title="App">
        <ListRow icon="phone-portrait-outline" title="Sobre este aparelho" onPress={() => router.push('/ajustes/aparelho')} />
        <ListRow
          icon="information-circle-outline"
          title="Sobre o app"
          value={`Versão ${Constants.expoConfig?.version ?? '—'}`}
          onPress={() => router.push('/ajustes/sobre')}
        />
      </ListGroup>

      <ListGroup>
        <ListRow icon="trash-outline" title="Apagar todos os dados" destructive action onPress={confirmErase} />
      </ListGroup>
    </Screen>
  );
}
