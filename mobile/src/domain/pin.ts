// PIN do app (D1: a própria pessoa escolhe o tamanho, de 4 a 8 dígitos) e espera entre tentativas.

export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 8;

/** A partir desta falha seguida, cada nova tentativa exige espera. Nunca apaga dados. */
export const FREE_ATTEMPTS = 4;

/** Espera (segundos) depois da 5ª, 6ª, 7ª, 8ª e 9ª+ falhas seguidas. */
const DELAYS_SECONDS = [30, 60, 300, 900, 1800] as const;

export function validatePin(pin: string): string | null {
  if (!/^\d*$/.test(pin)) return 'O PIN só pode ter números.';
  if (pin.length < PIN_MIN_LENGTH || pin.length > PIN_MAX_LENGTH) {
    return `O PIN precisa ter de ${PIN_MIN_LENGTH} a ${PIN_MAX_LENGTH} números.`;
  }
  if (/^(\d)\1+$/.test(pin)) return 'Evite números todos iguais.';
  if ('0123456789'.includes(pin) || '9876543210'.includes(pin)) return 'Evite sequências como 1234.';
  return null;
}

export function validatePinConfirmation(pin: string, confirmation: string): string | null {
  return pin === confirmation ? null : 'Os PINs não são iguais. Tente de novo.';
}

export type FailureRecord = {
  /** Falhas seguidas desde o último acerto. */
  count: number;
  /** Instante da última falha (ms desde a época). */
  lastFailureAt: number;
};

export const NO_FAILURES: FailureRecord = { count: 0, lastFailureAt: 0 };

export function delayAfterFailures(count: number): number {
  if (count <= FREE_ATTEMPTS) return 0;
  const index = Math.min(count - FREE_ATTEMPTS - 1, DELAYS_SECONDS.length - 1);
  return DELAYS_SECONDS[index];
}

/** Milissegundos que ainda faltam para poder tentar de novo (0 = pode tentar). */
export function remainingWaitMs(record: FailureRecord, nowMs: number): number {
  const delayMs = delayAfterFailures(record.count) * 1000;
  if (delayMs === 0) return 0;
  return Math.max(0, record.lastFailureAt + delayMs - nowMs);
}

export function registerFailure(record: FailureRecord, nowMs: number): FailureRecord {
  return { count: record.count + 1, lastFailureAt: nowMs };
}

/** "30 s", "5 min" */
export function formatWait(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds} s`;
  return `${Math.ceil(seconds / 60)} min`;
}
