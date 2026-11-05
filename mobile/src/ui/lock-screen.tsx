import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { currentWaitMs, pinLength, registerBiometricUnlock, verifyPin } from '@/application/security';
import { capabilityOf } from '@/domain/capabilities';
import { formatWait } from '@/domain/pin';
import { authenticateWithBiometrics } from '@/infrastructure/runtime';

import { useApp } from './app-context';
import { PinDots, PinPad } from './pin-pad';
import { AppText, Icon } from './primitives';
import { space } from './theme';
import { useColors } from './theme-context';

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { deps, session, capabilities } = useApp();
  const colors = useColors();
  const [pin, setPin] = useState('');
  const [length, setLength] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [waitMs, setWaitMs] = useState(0);
  const [checking, setChecking] = useState(false);
  const askedBiometrics = useRef(false);

  const biometricsOn =
    !!session?.settings.biometricsEnabled &&
    capabilities.length > 0 &&
    capabilityOf(capabilities, 'biometrics').status !== 'unavailable';

  useEffect(() => {
    void pinLength(deps).then(setLength);
    void currentWaitMs(deps).then(setWaitMs);
  }, [deps]);

  // Contagem regressiva da espera.
  useEffect(() => {
    if (waitMs <= 0) return;
    const timer = setInterval(() => setWaitMs((ms) => Math.max(0, ms - 1000)), 1000);
    return () => clearInterval(timer);
  }, [waitMs > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const tryBiometrics = useCallback(async () => {
    const result = await authenticateWithBiometrics('Desbloquear o Hamm');
    if (result === 'success') {
      await registerBiometricUnlock(deps);
      onUnlock();
    } else if (result === 'failed') {
      setMessage('Não foi possível reconhecer. Use o PIN.');
    }
  }, [deps, onUnlock]);

  useEffect(() => {
    if (biometricsOn && !askedBiometrics.current && waitMs === 0) {
      askedBiometrics.current = true;
      void tryBiometrics();
    }
  }, [biometricsOn, tryBiometrics, waitMs]);

  const submit = useCallback(
    async (value: string) => {
      setChecking(true);
      try {
        const result = await verifyPin(deps, value);
        if (result.status === 'ok' || result.status === 'noPin') {
          onUnlock();
          return;
        }
        setPin('');
        if (result.status === 'wait') {
          setWaitMs(result.waitMs);
          setMessage(null);
        } else {
          setWaitMs(result.waitMs);
          setMessage(result.waitMs > 0 ? null : 'PIN incorreto. Tente de novo.');
        }
      } finally {
        setChecking(false);
      }
    },
    [deps, onUnlock],
  );

  const onChange = (value: string) => {
    setMessage(null);
    setPin(value);
    if (length !== null && value.length === length) void submit(value);
  };

  const waiting = waitMs > 0;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
          <Icon name="lock-closed-outline" size={28} color={colors.accent} />
        </View>
        <AppText variant="title" accessibilityRole="header" style={{ textAlign: 'center' }}>
          Olá, {session?.profile.displayName}
        </AppText>
        <AppText tone="muted" style={{ textAlign: 'center' }}>
          Digite seu PIN para abrir o app.
        </AppText>
      </View>

      <View style={{ gap: space.md, alignItems: 'center', minHeight: 64 }}>
        <PinDots filled={pin.length} length={length ?? undefined} />
        {waiting ? (
          <AppText variant="label" tone="danger" accessibilityLiveRegion="assertive" style={{ textAlign: 'center' }}>
            Muitas tentativas. Tente de novo em {formatWait(waitMs)}.
          </AppText>
        ) : message ? (
          <AppText variant="label" tone="danger" accessibilityLiveRegion="assertive" style={{ textAlign: 'center' }}>
            {message}
          </AppText>
        ) : null}
      </View>

      <PinPad
        value={pin}
        onChange={onChange}
        maxLength={length ?? undefined}
        disabled={waiting || checking}
        extraKey={biometricsOn ? { icon: 'finger-print-outline', label: 'Usar digital ou rosto', onPress: () => void tryBiometrics() } : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', gap: space.xxl, paddingHorizontal: space.lg },
  header: { alignItems: 'center', gap: space.sm },
  badge: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
});
