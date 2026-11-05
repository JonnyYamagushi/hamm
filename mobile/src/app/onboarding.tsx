import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { OnboardingValidationError } from '@/application/onboarding';
import { capabilityOf } from '@/domain/capabilities';
import { DEFAULT_CATEGORIES, kindLabel, type CategoryKind } from '@/domain/category';
import { PIN_MAX_LENGTH, PIN_MIN_LENGTH, validatePin, validatePinConfirmation } from '@/domain/pin';
import { BRAZIL_TIME_ZONES, DEFAULT_TIME_ZONE, validateDisplayName } from '@/domain/profile';
import { useApp } from '@/ui/app-context';
import { PinDots, PinPad } from '@/ui/pin-pad';
import {
  AppText,
  Button,
  Chip,
  Icon,
  Notice,
  ProgressBar,
  Screen,
  Segmented,
  SwitchRow,
  TextField,
} from '@/ui/primitives';
import { Stepper } from '@/ui/stepper';
import { space } from '@/ui/theme';
import { useColors } from '@/ui/theme-context';

/** Passos numerados depois das boas-vindas: nome, PIN, preferências. */
const STEPS = 3;

function StepHeader({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <View style={{ gap: space.md }}>
      <ProgressBar value={step / STEPS} label={`Passo ${step} de ${STEPS}`} />
      <AppText variant="overline" tone="subtle">
        Passo {step} de {STEPS}
      </AppText>
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      <AppText tone="muted">{subtitle}</AppText>
    </View>
  );
}

function Welcome({
  onStart,
  onDemo,
  busy,
  error,
}: {
  onStart: () => void;
  onDemo: () => void;
  busy: boolean;
  error: string | null;
}) {
  const colors = useColors();
  const points: { icon: 'cloud-offline-outline' | 'lock-closed-outline' | 'heart-outline'; text: string }[] = [
    { icon: 'cloud-offline-outline', text: 'Funciona sem internet. Seus dados ficam no seu celular.' },
    { icon: 'lock-closed-outline', text: 'Tudo é privado. Você decide o que compartilhar, e com quem.' },
    { icon: 'heart-outline', text: 'Grátis e sem anúncios. A assistente mostra de onde vem cada número.' },
  ];
  return (
    <Screen
      scroll
      footer={
        <View style={{ gap: space.sm }}>
          {error ? <Notice tone="danger" text={error} /> : null}
          <Button label="Começar" onPress={onStart} />
          <Button label="Só quero ver a demonstração" variant="ghost" onPress={onDemo} loading={busy} />
        </View>
      }>
      <View style={{ gap: space.md, paddingTop: space.xxl }}>
        <View style={[styles.logo, { backgroundColor: colors.accentSoft }]}>
          <Icon name="wallet-outline" size={36} color={colors.accent} />
        </View>
        <AppText variant="display" accessibilityRole="header">
          Hamm
        </AppText>
        <AppText variant="heading" tone="muted">
          Seu dinheiro organizado, com uma assistente que explica as contas.
        </AppText>
      </View>
      <View style={{ gap: space.lg }}>
        {points.map((point) => (
          <View key={point.icon} style={styles.point}>
            <Icon name={point.icon} size={22} color={colors.accent} />
            <AppText style={{ flex: 1 }}>{point.text}</AppText>
          </View>
        ))}
      </View>
    </Screen>
  );
}

type Draft = {
  displayName: string;
  pin: string;
  pinConfirmation: string;
  biometricsEnabled: boolean;
  monthStartDay: number;
  timeZone: string;
  selected: Set<number>;
};

export default function OnboardingScreen() {
  const app = useApp();
  const [step, setStep] = useState(0);
  const [pinPhase, setPinPhase] = useState<'create' | 'confirm'>('create');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showZones, setShowZones] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    displayName: '',
    pin: '',
    pinConfirmation: '',
    biometricsEnabled: false,
    monthStartDay: 1,
    timeZone: DEFAULT_TIME_ZONE,
    selected: new Set(DEFAULT_CATEGORIES.map((_, i) => i)),
  });
  const update = (changes: Partial<Draft>) => setDraft((d) => ({ ...d, ...changes }));
  const biometrics = app.capabilities.length > 0 ? capabilityOf(app.capabilities, 'biometrics') : null;

  const go = (next: number) => {
    setError(null);
    setStep(next);
  };

  const startDemo = async () => {
    setBusy(true);
    try {
      await app.startDemo();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível abrir a demonstração.');
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    setBusy(true);
    setError(null);
    try {
      await app.completeOnboarding({
        displayName: draft.displayName,
        pin: draft.pin,
        pinConfirmation: draft.pinConfirmation,
        biometricsEnabled: draft.biometricsEnabled,
        monthStartDay: draft.monthStartDay,
        timeZone: draft.timeZone,
        categories: DEFAULT_CATEGORIES.filter((_, i) => draft.selected.has(i)),
      });
    } catch (e) {
      setError(
        e instanceof OnboardingValidationError ? e.message : 'Não foi possível salvar. Nada foi gravado; tente de novo.',
      );
      setBusy(false);
    }
  };

  if (step === 0) {
    return <Welcome onStart={() => go(1)} onDemo={() => void startDemo()} busy={busy} error={error} />;
  }

  if (step === 1) {
    const nameError = error;
    return (
      <Screen
        footer={
          <View style={styles.footerRow}>
            <View style={{ flex: 1 }}>
              <Button label="Voltar" variant="secondary" onPress={() => go(0)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="Continuar"
                onPress={() => {
                  const message = validateDisplayName(draft.displayName);
                  if (message) setError(message);
                  else go(2);
                }}
              />
            </View>
          </View>
        }>
        <StepHeader step={1} title="Como podemos chamar você?" subtitle="Pode ser seu nome ou um apelido. Fica só neste celular." />
        <TextField
          label="Nome ou apelido"
          value={draft.displayName}
          onChangeText={(displayName) => {
            setError(null);
            update({ displayName });
          }}
          autoFocus
          autoCapitalize="words"
          autoComplete="name"
          maxLength={40}
          returnKeyType="next"
          error={nameError}
        />
      </Screen>
    );
  }

  if (step === 2) {
    const creating = pinPhase === 'create';
    const value = creating ? draft.pin : draft.pinConfirmation;
    const setValue = (v: string) => {
      setError(null);
      update(creating ? { pin: v } : { pinConfirmation: v });
      if (!creating && v.length === draft.pin.length) {
        const message = validatePinConfirmation(draft.pin, v);
        if (message) {
          setError(message);
          update({ pinConfirmation: '' });
        } else {
          go(3);
        }
      }
    };
    const next = () => {
      const message = validatePin(draft.pin);
      if (message) {
        setError(message);
        return;
      }
      setPinPhase('confirm');
    };
    return (
      <Screen
        footer={
          <View style={styles.footerRow}>
            <View style={{ flex: 1 }}>
              <Button
                label="Voltar"
                variant="secondary"
                onPress={() => {
                  if (creating) go(1);
                  else {
                    setPinPhase('create');
                    update({ pin: '', pinConfirmation: '' });
                  }
                }}
              />
            </View>
            {creating ? (
              <View style={{ flex: 1 }}>
                <Button label="Continuar" onPress={next} disabled={draft.pin.length < PIN_MIN_LENGTH} />
              </View>
            ) : null}
          </View>
        }>
        <StepHeader
          step={2}
          title={creating ? 'Crie um PIN' : 'Digite o PIN de novo'}
          subtitle={
            creating
              ? `Use de ${PIN_MIN_LENGTH} a ${PIN_MAX_LENGTH} números. Ele protege o app quando alguém pegar seu celular.`
              : 'Só para conferir que está certo.'
          }
        />
        <View style={{ gap: space.md, alignItems: 'center' }}>
          <PinDots filled={value.length} length={creating ? undefined : draft.pin.length} />
          {error ? (
            <AppText variant="label" tone="danger" accessibilityLiveRegion="assertive" style={{ textAlign: 'center' }}>
              {error}
            </AppText>
          ) : null}
        </View>
        <PinPad value={value} onChange={setValue} maxLength={creating ? PIN_MAX_LENGTH : draft.pin.length} />
        {creating ? (
          <>
            {biometrics && biometrics.status !== 'unavailable' ? (
              <SwitchRow
                title="Usar digital ou rosto também"
                subtitle={biometrics.status === 'limited' ? biometrics.explanation : 'Você ainda pode usar o PIN quando quiser.'}
                value={draft.biometricsEnabled}
                onValueChange={(biometricsEnabled) => update({ biometricsEnabled })}
              />
            ) : null}
            <Notice text="Se esquecer o PIN, a única saída é apagar os dados do app. Na versão com backup, você poderá restaurar a partir dele." />
          </>
        ) : null}
      </Screen>
    );
  }

  const toggleCategory = (index: number) =>
    setDraft((d) => {
      const selected = new Set(d.selected);
      if (selected.has(index)) selected.delete(index);
      else selected.add(index);
      return { ...d, selected };
    });

  const groups: CategoryKind[] = ['EXPENSE', 'INCOME'];

  return (
    <Screen
      footer={
        <View style={{ gap: space.sm }}>
          {error ? <Notice tone="danger" text={error} /> : null}
          <View style={styles.footerRow}>
            <View style={{ flex: 1 }}>
              <Button
                label="Voltar"
                variant="secondary"
                onPress={() => {
                  setPinPhase('create');
                  update({ pin: '', pinConfirmation: '' });
                  go(2);
                }}
                disabled={busy}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Concluir" onPress={() => void finish()} loading={busy} />
            </View>
          </View>
        </View>
      }>
      <StepHeader step={3} title="Últimos ajustes" subtitle="Tudo aqui pode ser mudado depois em Ajustes." />

      <View style={{ gap: space.sm }}>
        <AppText variant="heading">Seu mês começa no dia</AppText>
        <AppText variant="caption" tone="muted">
          Use o dia em que o salário costuma cair, se preferir.
        </AppText>
        <Stepper
          label="Dia de início do mês"
          value={draft.monthStartDay}
          min={1}
          max={28}
          onChange={(monthStartDay) => update({ monthStartDay })}
        />
      </View>

      <View style={{ gap: space.sm }}>
        <AppText variant="heading">Fuso horário</AppText>
        {showZones ? (
          <Segmented
            label="Fuso horário"
            options={BRAZIL_TIME_ZONES.map((z) => ({ value: z.id, label: z.label }))}
            value={draft.timeZone}
            onChange={(timeZone) => {
              update({ timeZone });
              setShowZones(false);
            }}
          />
        ) : (
          <View style={styles.zoneRow}>
            <AppText style={{ flex: 1 }}>{BRAZIL_TIME_ZONES.find((z) => z.id === draft.timeZone)?.label}</AppText>
            <View>
              <Button label="Trocar" variant="ghost" onPress={() => setShowZones(true)} />
            </View>
          </View>
        )}
      </View>

      <View style={{ gap: space.sm }}>
        <AppText variant="heading">Categorias</AppText>
        <AppText variant="caption" tone="muted">
          Desmarque o que não usa. Dá para criar, renomear e tirar categorias quando quiser.
        </AppText>
        {groups.map((kind) => (
          <View key={kind} style={{ gap: space.sm, marginTop: space.sm }}>
            <AppText variant="overline" tone="subtle">
              {kindLabel(kind)}s
            </AppText>
            <View style={styles.chips}>
              {DEFAULT_CATEGORIES.map((c, i) =>
                c.kind === kind ? (
                  <Chip key={i} label={c.name} selected={draft.selected.has(i)} onPress={() => toggleCategory(i)} />
                ) : null,
              )}
            </View>
          </View>
        ))}
      </View>

      <AppText variant="caption" tone="muted">
        Moeda: real (R$).
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  point: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  footerRow: { flexDirection: 'row', gap: space.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
