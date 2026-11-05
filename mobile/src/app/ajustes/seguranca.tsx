import { router } from 'expo-router';
import { Platform, View } from 'react-native';

import { capabilityOf } from '@/domain/capabilities';
import { LOCK_TIMEOUT_OPTIONS, lockTimeoutLabel } from '@/domain/profile';
import { authenticateWithBiometrics } from '@/infrastructure/runtime';
import { useApp, useSession } from '@/ui/app-context';
import { AppText, ListGroup, ListRow, Notice, Screen, Segmented, SwitchRow } from '@/ui/primitives';
import { space } from '@/ui/theme';

export default function SegurancaScreen() {
  const { settings } = useSession();
  const { updateSettings, capabilities } = useApp();
  const biometrics = capabilities.length > 0 ? capabilityOf(capabilities, 'biometrics') : null;
  const database = capabilities.length > 0 ? capabilityOf(capabilities, 'encryptedDatabase') : null;

  const toggleBiometrics = async (enabled: boolean) => {
    // Para ligar, confirma que a biometria funciona agora (evita ligar algo que não vai abrir o app).
    if (enabled && (await authenticateWithBiometrics('Confirme para usar no Hamm')) !== 'success') return;
    await updateSettings({ biometricsEnabled: enabled });
  };

  return (
    <Screen edges={['left', 'right']}>
      <ListGroup title="PIN">
        <ListRow icon="keypad-outline" title="Trocar PIN" onPress={() => router.push('/ajustes/trocar-pin')} />
      </ListGroup>

      <ListGroup title="Digital ou rosto" footer={biometrics?.explanation}>
        <SwitchRow
          title="Desbloquear com digital ou rosto"
          value={settings.biometricsEnabled && biometrics?.status !== 'unavailable'}
          onValueChange={(v) => void toggleBiometrics(v)}
          disabled={!biometrics || biometrics.status === 'unavailable'}
        />
      </ListGroup>

      <ListGroup
        title="Privacidade da tela"
        footer={
          Platform.OS === 'android'
            ? 'Quando ligado, ninguém consegue tirar print ou gravar a tela do app, e ele aparece em branco na lista de apps recentes.'
            : 'Quando ligado, ninguém consegue tirar print ou gravar a tela do app.'
        }>
        <SwitchRow
          title="Impedir prints e gravação de tela"
          value={settings.blockScreenCapture}
          onValueChange={(blockScreenCapture) => void updateSettings({ blockScreenCapture })}
        />
      </ListGroup>

      <View style={{ gap: space.sm }}>
        <AppText variant="overline" tone="subtle">
          Pedir o PIN de novo
        </AppText>
        <Segmented
          label="Pedir o PIN de novo"
          options={LOCK_TIMEOUT_OPTIONS.map((v) => ({ value: v, label: lockTimeoutLabel(v) }))}
          value={settings.lockTimeoutSeconds}
          onChange={(lockTimeoutSeconds) => void updateSettings({ lockTimeoutSeconds })}
        />
        <AppText variant="caption" tone="muted">
          Conta o tempo em que o app ficou fora da tela. Ao sair, a tela do app fica coberta na lista de apps recentes.
        </AppText>
      </View>

      {database && database.status !== 'available' ? <Notice text={database.explanation} /> : null}
    </Screen>
  );
}
