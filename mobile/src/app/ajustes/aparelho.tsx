import { StyleSheet, View } from 'react-native';

import type { Capability } from '@/domain/capabilities';
import { useApp } from '@/ui/app-context';
import { AppText, Card, Icon, LoadingState, Screen } from '@/ui/primitives';
import { space } from '@/ui/theme';
import { useColors } from '@/ui/theme-context';

const STATUS: Record<Capability['status'], { label: string; icon: 'checkmark-circle-outline' | 'remove-circle-outline' | 'close-circle-outline' }> = {
  available: { label: 'Disponível', icon: 'checkmark-circle-outline' },
  limited: { label: 'Limitado', icon: 'remove-circle-outline' },
  unavailable: { label: 'Indisponível', icon: 'close-circle-outline' },
};

export default function AparelhoScreen() {
  const { runtime, capabilities } = useApp();
  const colors = useColors();
  if (!runtime) return <LoadingState label="Verificando o aparelho…" />;

  const where = runtime.isExpoGo ? 'Expo Go (versão de teste)' : 'App instalado';
  const platform = runtime.platform === 'ios' ? 'iPhone' : runtime.platform === 'android' ? 'Android' : 'Navegador';

  return (
    <Screen edges={['left', 'right']}>
      <Card>
        <AppText variant="label" tone="muted">
          Rodando em
        </AppText>
        <AppText variant="heading">
          {platform} · {where}
        </AppText>
        <AppText variant="caption" tone="muted">
          Tudo o que é essencial (contas, lançamentos, relatórios, assistente e backup por arquivo) funciona em qualquer ambiente.
        </AppText>
      </Card>

      <View style={{ gap: space.md }}>
        {capabilities.map((c) => {
          const status = STATUS[c.status];
          const tint = c.status === 'available' ? colors.positive : c.status === 'limited' ? colors.textMuted : colors.textSubtle;
          return (
            <View key={c.id} style={styles.item} accessible accessibilityLabel={`${c.title}: ${status.label}. ${c.explanation}`}>
              <Icon name={status.icon} size={22} color={tint} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.titleRow}>
                  <AppText variant="heading" style={{ flexShrink: 1 }}>
                    {c.title}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {status.label}
                  </AppText>
                </View>
                <AppText variant="caption" tone="muted">
                  {c.explanation}
                </AppText>
              </View>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.sm, flexWrap: 'wrap' },
});
