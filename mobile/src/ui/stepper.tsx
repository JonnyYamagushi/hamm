import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon } from './primitives';
import { radius, space, touchTarget } from './theme';
import { useColors } from './theme-context';

/** Número inteiro com − e +; leitor de tela trata como controle ajustável. */
export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  format = String,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  const colors = useColors();
  const set = (next: number) => onChange(Math.max(min, Math.min(max, next)));
  const button = (icon: 'remove' | 'add', delta: number, disabled: boolean) => (
    <Pressable
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      onPress={() => set(value + delta)}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { borderColor: colors.borderStrong, backgroundColor: pressed ? colors.surfacePressed : colors.surface },
        disabled && { opacity: 0.35 },
      ]}>
      <Icon name={icon} size={22} color={colors.text} />
    </Pressable>
  );
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: format(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => set(value + (event.nativeEvent.actionName === 'increment' ? 1 : -1))}
      style={styles.row}>
      {button('remove', -1, value <= min)}
      <AppText variant="title" style={styles.value}>
        {format(value)}
      </AppText>
      {button('add', 1, value >= max)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  button: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { minWidth: 48, textAlign: 'center', fontVariant: ['tabular-nums'] },
});
