// Primitivos de UI do Hamm. Tudo que é visual e repetido mora aqui.
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { maxContentWidth, radius, space, touchTarget, type } from './theme';
import { useColors } from './theme-context';

type TextVariant = keyof typeof type;
export type Tone = 'default' | 'muted' | 'subtle' | 'accent' | 'danger' | 'positive' | 'onAccent';
export type IconName = ComponentProps<typeof Ionicons>['name'];

/** Ícone de traço (Ionicons outline). Uma família só no app; nunca decorativo sem função. */
export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color?: string }) {
  const colors = useColors();
  return (
    <Ionicons
      name={name}
      size={size}
      color={color ?? colors.textMuted}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

export function AppText({
  variant = 'body',
  tone = 'default',
  style,
  ...rest
}: TextProps & { variant?: TextVariant; tone?: Tone }) {
  const colors = useColors();
  const color = {
    default: colors.text,
    muted: colors.textMuted,
    subtle: colors.textSubtle,
    accent: colors.accent,
    danger: colors.danger,
    positive: colors.positive,
    onAccent: colors.onAccent,
  }[tone];
  // textBreakStrategy "simple": no Android a estratégia padrão mede errado e corta palavras.
  return <Text textBreakStrategy="simple" style={[type[variant], { color }, style]} {...rest} />;
}

/** Tela com área segura, rolagem, teclado e largura máxima de leitura. `footer` fica fixo embaixo. */
export function Screen({
  children,
  footer,
  scroll = true,
  edges = ['top', 'left', 'right'],
  banner,
}: {
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  /** Faixa fixa no topo (ex.: modo demonstração). */
  banner?: ReactNode;
}) {
  const colors = useColors();
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive">
      <View style={styles.column}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.scrollContent, { flex: 1 }]}>
      <View style={[styles.column, { flex: 1 }]}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={edges}>
      {banner}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {body}
        {footer ? (
          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
            <View style={styles.column}>{footer}</View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  /** `danger`: ação destrutiva (contorno e texto; nunca preenchido). */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  accessibilityHint?: string;
}) {
  const colors = useColors();
  const inactive = disabled || loading;
  const labelColor = {
    primary: colors.onAccent,
    secondary: colors.text,
    ghost: colors.accent,
    danger: colors.danger,
  }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && { backgroundColor: pressed ? colors.accentPressed : colors.accent },
        variant === 'secondary' && {
          backgroundColor: pressed ? colors.surfacePressed : colors.surface,
          borderColor: colors.borderStrong,
          borderWidth: StyleSheet.hairlineWidth * 2,
        },
        variant === 'ghost' && { backgroundColor: pressed ? colors.accentSoft : 'transparent' },
        variant === 'danger' && {
          backgroundColor: pressed ? colors.dangerSoft : 'transparent',
          borderColor: colors.danger,
          borderWidth: 1,
        },
        inactive && { opacity: 0.45 },
      ]}>
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <View style={styles.buttonInner}>
          {icon ? <Icon name={icon} size={18} color={labelColor} /> : null}
          <Text style={[type.heading, { color: labelColor, textAlign: 'center', flexShrink: 1 }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>{children}</View>
  );
}

/** Linha de lista tocável (ajustes, categorias). */
export function ListRow({
  title,
  subtitle,
  icon,
  iconColor,
  value,
  onPress,
  accessibilityHint,
  destructive = false,
  action = false,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconColor?: string;
  value?: string;
  onPress?: () => void;
  accessibilityHint?: string;
  destructive?: boolean;
  /** Executa algo na hora (sem seta): a seta indica que abre outra tela. */
  action?: boolean;
}) {
  const colors = useColors();
  const content = (
    <>
      {icon ? <Icon name={icon} size={22} color={iconColor ?? (destructive ? colors.danger : colors.textMuted)} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText tone={destructive ? 'danger' : 'default'}>{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="label" tone="muted" style={{ maxWidth: '45%', textAlign: 'right' }}>
          {value}
        </AppText>
      ) : null}
      {onPress && !action ? <Icon name="chevron-forward" size={18} color={colors.textSubtle} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[title, value, subtitle].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfacePressed }]}>
      {content}
    </Pressable>
  );
}

/** Grupo de linhas com separadores finos (sem card dentro de card). */
export function ListGroup({ title, children, footer }: { title?: string; children: ReactNode; footer?: string }) {
  const colors = useColors();
  const items = (Array.isArray(children) ? children : [children]).filter(Boolean);
  return (
    <View style={{ gap: space.sm }}>
      {title ? (
        <AppText variant="overline" tone="subtle" accessibilityRole="header">
          {title}
        </AppText>
      ) : null}
      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {items.map((child, index) => (
          <View key={index} style={index > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border } : null}>
            {child}
          </View>
        ))}
      </View>
      {footer ? (
        <AppText variant="caption" tone="muted">
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}

export function SwitchRow({
  title,
  subtitle,
  value,
  onValueChange,
  disabled = false,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[styles.row, disabled && { opacity: 0.5 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText>{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={title}
        accessibilityHint={subtitle}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ true: colors.accent, false: colors.borderStrong }}
        thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
      />
    </View>
  );
}

export function TextField({
  label,
  error,
  hint,
  ...rest
}: TextInputProps & { label: string; error?: string | null; hint?: string }) {
  const colors = useColors();
  return (
    <View style={{ gap: space.xs }}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        placeholderTextColor={colors.textSubtle}
        style={[
          type.body,
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.borderStrong,
          },
        ]}
        {...rest}
      />
      {error ? (
        <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

/** Seleção única entre poucas opções (tema, tempo de bloqueio). */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const colors = useColors();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ gap: space.sm }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              {
                borderColor: selected ? colors.accentLine : colors.border,
                backgroundColor: selected ? colors.accentSoft : pressed ? colors.surfacePressed : colors.surface,
              },
            ]}>
            <AppText style={{ flex: 1 }} tone={selected ? 'accent' : 'default'}>
              {option.label}
            </AppText>
            <Icon
              name={selected ? 'radio-button-on' : 'radio-button-off'}
              color={selected ? colors.accent : colors.textSubtle}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: selected ? colors.accentLine : colors.borderStrong,
          backgroundColor: selected ? colors.accentSoft : pressed ? colors.surfacePressed : colors.surface,
        },
      ]}>
      {/* ✓ além da cor: a seleção não depende só de cor. */}
      {selected ? <Icon name="checkmark" size={16} color={colors.accent} /> : null}
      <AppText variant="label" tone={selected ? 'accent' : 'default'}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const colors = useColors();
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}>
      <View style={{ width: `${clamped * 100}%`, height: '100%', borderRadius: radius.full, backgroundColor: colors.accent }} />
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: IconName;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceMuted }]}>
        <Icon name={icon} size={28} color={colors.textMuted} />
      </View>
      <AppText variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </AppText>
      <AppText tone="muted" style={{ textAlign: 'center', maxWidth: 340 }}>
        {message}
      </AppText>
      {action}
    </View>
  );
}

export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  const colors = useColors();
  return (
    <View style={styles.empty} accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.accent} />
      <AppText tone="muted">{label}</AppText>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <EmptyState
      icon="alert-circle-outline"
      title="Algo deu errado"
      message={`${message} Seus dados continuam guardados no aparelho.`}
      action={<Button label="Tentar de novo" variant="secondary" onPress={onRetry} />}
    />
  );
}

/** Aviso inline (sucesso, informação). Anunciado pelo leitor de tela. */
export function Notice({ text, tone = 'info' }: { text: string; tone?: 'info' | 'danger' }) {
  const colors = useColors();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.notice,
        { backgroundColor: tone === 'danger' ? colors.dangerSoft : colors.surfaceMuted, borderColor: tone === 'danger' ? colors.danger : colors.border },
      ]}>
      <Icon name={tone === 'danger' ? 'alert-circle-outline' : 'information-circle-outline'} color={tone === 'danger' ? colors.danger : colors.textMuted} />
      <AppText variant="label" tone={tone === 'danger' ? 'danger' : 'muted'} style={{ flex: 1 }}>
        {text}
      </AppText>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xxxl, flexGrow: 1 },
  column: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center', gap: space.xl },
  footer: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg, borderTopWidth: StyleSheet.hairlineWidth },
  button: {
    minHeight: touchTarget + 4,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: space.lg, gap: space.sm },
  group: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: {
    minHeight: touchTarget + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  input: {
    minHeight: touchTarget + 4,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  option: {
    minHeight: touchTarget + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  chip: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  progressTrack: { height: 8, borderRadius: radius.full, overflow: 'hidden' },
  empty: { alignItems: 'center', justifyContent: 'center', gap: space.md, paddingVertical: space.xxxl, paddingHorizontal: space.lg },
  emptyIcon: { width: 64, height: 64, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.md,
  },
});
