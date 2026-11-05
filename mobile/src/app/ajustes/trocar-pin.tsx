import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { changePin, pinLength } from '@/application/security';
import { PIN_MAX_LENGTH, PIN_MIN_LENGTH, formatWait, validatePin } from '@/domain/pin';
import { useApp } from '@/ui/app-context';
import { PinDots, PinPad } from '@/ui/pin-pad';
import { AppText, Button, Screen } from '@/ui/primitives';
import { space } from '@/ui/theme';

type Phase = 'current' | 'new' | 'confirm';

const TITLES: Record<Phase, string> = {
  current: 'Digite o PIN atual',
  new: 'Escolha o novo PIN',
  confirm: 'Digite o novo PIN de novo',
};

export default function TrocarPinScreen() {
  const { deps } = useApp();
  const [phase, setPhase] = useState<Phase>('current');
  const [currentLength, setCurrentLength] = useState<number | null>(null);
  const [values, setValues] = useState({ current: '', new: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void pinLength(deps).then(setCurrentLength);
  }, [deps]);

  const value = values[phase];
  const maxLength = phase === 'current' ? currentLength ?? PIN_MAX_LENGTH : phase === 'confirm' ? values.new.length : PIN_MAX_LENGTH;

  const finish = async (confirmation: string) => {
    setBusy(true);
    try {
      const result = await changePin(deps, { currentPin: values.current, newPin: values.new, confirmation });
      if (result.status === 'ok') {
        router.back();
        return;
      }
      setValues({ current: '', new: '', confirm: '' });
      setPhase('current');
      setError(
        result.status === 'wait' || (result.status === 'wrong' && result.waitMs > 0)
          ? `Muitas tentativas. Tente de novo em ${formatWait(result.waitMs)}.`
          : 'O PIN atual não confere.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível trocar o PIN.');
      setValues((v) => ({ ...v, confirm: '' }));
    } finally {
      setBusy(false);
    }
  };

  const onChange = (next: string) => {
    setError(null);
    setValues((v) => ({ ...v, [phase]: next }));
    if (phase === 'current' && currentLength !== null && next.length === currentLength) setPhase('new');
    if (phase === 'confirm' && next.length === values.new.length) {
      if (next !== values.new) {
        setError('Os PINs não são iguais. Tente de novo.');
        setValues((v) => ({ ...v, confirm: '' }));
      } else {
        void finish(next);
      }
    }
  };

  const continueNew = () => {
    const message = validatePin(values.new);
    if (message) setError(message);
    else setPhase('confirm');
  };

  return (
    <Screen
      edges={['left', 'right', 'bottom']}
      footer={
        phase === 'new' ? (
          <Button label="Continuar" onPress={continueNew} disabled={values.new.length < PIN_MIN_LENGTH} />
        ) : undefined
      }>
      <View style={{ gap: space.sm }}>
        <AppText variant="heading" accessibilityRole="header">
          {TITLES[phase]}
        </AppText>
        {phase === 'new' ? (
          <AppText variant="caption" tone="muted">
            De {PIN_MIN_LENGTH} a {PIN_MAX_LENGTH} números.
          </AppText>
        ) : null}
      </View>
      <View style={{ gap: space.md, alignItems: 'center', minHeight: 56 }}>
        <PinDots filled={value.length} length={phase === 'new' ? undefined : maxLength} />
        {error ? (
          <AppText variant="label" tone="danger" accessibilityLiveRegion="assertive" style={{ textAlign: 'center' }}>
            {error}
          </AppText>
        ) : null}
      </View>
      <PinPad value={value} onChange={onChange} maxLength={maxLength} disabled={busy} />
    </Screen>
  );
}
