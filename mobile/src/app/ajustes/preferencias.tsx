import { View } from 'react-native';

import { BRAZIL_TIME_ZONES } from '@/domain/profile';
import { useApp, useSession } from '@/ui/app-context';
import { AppText, Screen, Segmented } from '@/ui/primitives';
import { Stepper } from '@/ui/stepper';
import { space } from '@/ui/theme';

export default function PreferenciasScreen() {
  const { settings } = useSession();
  const { updateSettings } = useApp();
  return (
    <Screen edges={['left', 'right']}>
      <View style={{ gap: space.sm }}>
        <AppText variant="heading">Seu mês começa no dia</AppText>
        <AppText variant="caption" tone="muted">
          Muda como os totais do mês são somados. Seus dados não mudam.
        </AppText>
        <Stepper
          label="Dia de início do mês"
          value={settings.monthStartDay}
          min={1}
          max={28}
          onChange={(monthStartDay) => void updateSettings({ monthStartDay })}
        />
      </View>
      <View style={{ gap: space.sm }}>
        <AppText variant="heading">Fuso horário</AppText>
        <Segmented
          label="Fuso horário"
          options={BRAZIL_TIME_ZONES.map((z) => ({ value: z.id, label: z.label }))}
          value={settings.timeZone}
          onChange={(timeZone) => void updateSettings({ timeZone })}
        />
      </View>
      <AppText variant="caption" tone="muted">
        Moeda: real (R$). Outras moedas ficam para depois.
      </AppText>
    </Screen>
  );
}
