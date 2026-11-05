// Perfil do titular e preferências do aparelho.
import { isValidMonthStartDay } from './period';

export type Profile = {
  id: string;
  displayName: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ThemePreference = 'system' | 'light' | 'dark';

/** Segundos em segundo plano antes de pedir o PIN de novo (D2: padrão 1 minuto). */
export const LOCK_TIMEOUT_OPTIONS = [0, 60, 300, 900] as const;
export type LockTimeout = (typeof LOCK_TIMEOUT_OPTIONS)[number];

export type Settings = {
  profileId: string;
  theme: ThemePreference;
  currency: 'BRL';
  monthStartDay: number;
  timeZone: string;
  lockTimeoutSeconds: LockTimeout;
  biometricsEnabled: boolean;
  /** Impede prints e gravação de tela (Android: também esconde o app nos recentes). */
  blockScreenCapture: boolean;
  updatedAt: string;
};

export const DEFAULT_TIME_ZONE = 'America/Sao_Paulo';

/** Fusos do Brasil com nomes que a pessoa reconhece. */
export const BRAZIL_TIME_ZONES: readonly { id: string; label: string }[] = [
  { id: 'America/Sao_Paulo', label: 'Brasília (SP, RJ, MG, Sul, GO, DF, BA, Nordeste)' },
  { id: 'America/Manaus', label: 'Amazonas (Manaus)' },
  { id: 'America/Cuiaba', label: 'Mato Grosso (Cuiabá)' },
  { id: 'America/Campo_Grande', label: 'Mato Grosso do Sul (Campo Grande)' },
  { id: 'America/Porto_Velho', label: 'Rondônia (Porto Velho)' },
  { id: 'America/Boa_Vista', label: 'Roraima (Boa Vista)' },
  { id: 'America/Rio_Branco', label: 'Acre (Rio Branco)' },
  { id: 'America/Noronha', label: 'Fernando de Noronha' },
];

export const DISPLAY_NAME_MAX = 40;

export function normalizeDisplayName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function validateDisplayName(value: string): string | null {
  const name = normalizeDisplayName(value);
  if (name.length === 0) return 'Diga como podemos chamar você.';
  if (name.length > DISPLAY_NAME_MAX) return `Use até ${DISPLAY_NAME_MAX} caracteres.`;
  return null;
}

export function isLockTimeout(value: number): value is LockTimeout {
  return (LOCK_TIMEOUT_OPTIONS as readonly number[]).includes(value);
}

export function lockTimeoutLabel(value: LockTimeout): string {
  if (value === 0) return 'Imediatamente';
  return `Depois de ${value / 60} min`;
}

export function validateSettings(settings: Pick<Settings, 'monthStartDay' | 'timeZone' | 'lockTimeoutSeconds'>): string | null {
  if (!isValidMonthStartDay(settings.monthStartDay)) return 'O mês pode começar entre o dia 1 e o dia 28.';
  if (!BRAZIL_TIME_ZONES.some((zone) => zone.id === settings.timeZone)) return 'Fuso horário não reconhecido.';
  if (!isLockTimeout(settings.lockTimeoutSeconds)) return 'Tempo de bloqueio inválido.';
  return null;
}

export function defaultSettings(profileId: string, nowIso: string): Settings {
  return {
    profileId,
    theme: 'system',
    currency: 'BRL',
    monthStartDay: 1,
    timeZone: DEFAULT_TIME_ZONE,
    lockTimeoutSeconds: 60,
    biometricsEnabled: false,
    blockScreenCapture: false,
    updatedAt: nowIso,
  };
}
