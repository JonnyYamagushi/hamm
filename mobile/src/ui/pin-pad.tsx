// Teclado numérico próprio para o PIN (não abre o teclado do sistema, não sugere nem memoriza).
import { Pressable, StyleSheet, View } from 'react-native';

import { PIN_MAX_LENGTH } from '@/domain/pin';

import { AppText, Icon, type IconName } from './primitives';
import { radius, space } from './theme';
import { useColors } from './theme-context';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

/** Bolinhas do PIN. `length` conhecido (desbloqueio) mostra todas; sem ele, só as digitadas. */
export function PinDots({ filled, length }: { filled: number; length?: number }) {
  const colors = useColors();
  const total = length ?? Math.max(filled, 4);
  return (
    <View
      style={styles.dots}
      accessible
      accessibilityLabel={length ? `${filled} de ${length} números digitados` : `${filled} números digitados`}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { borderColor: colors.borderStrong },
            i < filled && { backgroundColor: colors.accent, borderColor: colors.accent },
          ]}
        />
      ))}
    </View>
  );
}

function Key({
  label,
  icon,
  onPress,
  accessibilityLabel,
  disabled,
}: {
  label?: string;
  icon?: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        { backgroundColor: pressed ? colors.surfacePressed : icon ? 'transparent' : colors.surface },
        disabled && { opacity: 0.35 },
      ]}>
      {icon ? <Icon name={icon} size={26} color={colors.text} /> : <AppText variant="title">{label}</AppText>}
    </Pressable>
  );
}

export function PinPad({
  value,
  onChange,
  maxLength = PIN_MAX_LENGTH,
  disabled = false,
  extraKey,
}: {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
  /** Tecla da esquerda embaixo (ex.: biometria). */
  extraKey?: { icon: IconName; label: string; onPress: () => void };
}) {
  const press = (digit: string) => {
    if (value.length < maxLength) onChange(value + digit);
  };
  return (
    <View style={styles.pad}>
      {KEYS.map((digit) => (
        <Key key={digit} label={digit} accessibilityLabel={digit} onPress={() => press(digit)} disabled={disabled} />
      ))}
      {extraKey ? (
        <Key icon={extraKey.icon} accessibilityLabel={extraKey.label} onPress={extraKey.onPress} disabled={disabled} />
      ) : (
        <View style={styles.key} />
      )}
      <Key label="0" accessibilityLabel="0" onPress={() => press('0')} disabled={disabled} />
      <Key
        icon="backspace-outline"
        accessibilityLabel="Apagar último número"
        onPress={() => onChange(value.slice(0, -1))}
        disabled={disabled || value.length === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', justifyContent: 'center', gap: space.md, minHeight: 20 },
  dot: { width: 14, height: 14, borderRadius: radius.full, borderWidth: 1.5 },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.md,
    maxWidth: 3 * 76 + 2 * space.md,
    alignSelf: 'center',
  },
  key: { width: 76, height: 64, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
