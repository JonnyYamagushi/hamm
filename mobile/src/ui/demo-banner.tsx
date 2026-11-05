import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { useApp } from './app-context';
import { AppText, Icon } from './primitives';
import { space } from './theme';
import { useColors } from './theme-context';

/**
 * Faixa fixa enquanto há dados fictícios na tela.
 * Perfil de demonstração → "Começar de verdade"; perfil real com a prévia ligada → "Desligar".
 */
export function DemoBanner() {
  const { session, eraseAll, demoPreview, setDemoPreview } = useApp();
  const colors = useColors();
  const isDemoProfile = !!session?.profile.isDemo;
  if (!isDemoProfile && !demoPreview) return null;

  const startForReal = () =>
    Alert.alert('Começar de verdade?', 'Os dados fictícios somem e você cria o seu perfil.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Começar', onPress: () => void eraseAll() },
    ]);

  const action = isDemoProfile
    ? { label: 'Começar de verdade', hint: 'Apaga os dados fictícios e abre o cadastro', onPress: startForReal }
    : { label: 'Desligar', hint: 'Volta a mostrar só os seus dados', onPress: () => setDemoPreview(false) };

  return (
    <View style={[styles.banner, { backgroundColor: colors.accentSoft, borderBottomColor: colors.accentLine }]}>
      <Icon name="eye-outline" size={18} color={colors.accent} />
      <AppText variant="caption" style={{ flex: 1 }}>
        Demonstração: os dados são fictícios.
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action.label}
        accessibilityHint={action.hint}
        onPress={action.onPress}
        hitSlop={8}
        style={styles.action}>
        <AppText variant="label" tone="accent">
          {action.label}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  action: { minHeight: 40, justifyContent: 'center' },
});
