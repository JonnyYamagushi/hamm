import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { localDateOf } from '@/domain/local-date';
import { periodContaining, periodTitle, shiftPeriod, type Period } from '@/domain/period';

import { useSession } from './app-context';
import { AppText, Icon } from './primitives';
import { radius, touchTarget } from './theme';
import { useColors } from './theme-context';

/** Período atual (respeita dia de início e fuso do perfil) com navegação para meses anteriores. */
export function usePeriod() {
  const { settings } = useSession();
  const today = localDateOf(new Date(), settings.timeZone);
  const current = periodContaining(today, settings.monthStartDay);
  const [offset, setOffset] = useState(0);
  const period = shiftPeriod(current, offset, settings.monthStartDay);
  return { period, today, offset, setOffset, isCurrent: offset === 0 };
}

export function PeriodSelector({
  period,
  offset,
  setOffset,
  minOffset = -2,
}: {
  period: Period;
  offset: number;
  setOffset: (value: number) => void;
  minOffset?: number;
}) {
  const colors = useColors();
  const arrow = (icon: 'chevron-back' | 'chevron-forward', delta: number, label: string, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => setOffset(offset + delta)}
      style={({ pressed }) => [styles.arrow, pressed && { backgroundColor: colors.surfacePressed }, disabled && { opacity: 0.3 }]}>
      <Icon name={icon} size={22} color={colors.text} />
    </Pressable>
  );
  return (
    <View style={styles.row}>
      {arrow('chevron-back', -1, 'Mês anterior', offset <= minOffset)}
      <AppText variant="heading" style={styles.label} accessibilityLiveRegion="polite">
        {periodTitle(period)}
      </AppText>
      {arrow('chevron-forward', 1, 'Próximo mês', offset >= 0)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: touchTarget, height: touchTarget, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, textAlign: 'center' },
});
