// PIN: gravar, conferir com espera entre tentativas e trocar.
import { NO_FAILURES, registerFailure, remainingWaitMs, validatePin, validatePinConfirmation } from '@/domain/pin';

import type { Clock, PinHasher, PinStore } from './ports';

export type SecurityDeps = { pins: PinStore; hasher: PinHasher; clock: Clock };

export class PinValidationError extends Error {}

export async function savePin(deps: Pick<SecurityDeps, 'pins' | 'hasher'>, pin: string): Promise<void> {
  const salt = deps.hasher.newSalt();
  const hash = await deps.hasher.hash(pin, salt);
  await deps.pins.set({ hash, salt, length: pin.length });
  await deps.pins.setFailures(NO_FAILURES);
}

export type VerifyResult =
  | { status: 'ok' }
  | { status: 'wrong'; failures: number; waitMs: number }
  | { status: 'wait'; waitMs: number }
  | { status: 'noPin' };

/** Confere o PIN respeitando a espera. Durante a espera, nem compara (não conta tentativa). */
export async function verifyPin(deps: SecurityDeps, pin: string): Promise<VerifyResult> {
  const record = await deps.pins.get();
  if (!record) return { status: 'noPin' };

  const failures = await deps.pins.getFailures();
  const now = deps.clock.nowMs();
  const wait = remainingWaitMs(failures, now);
  if (wait > 0) return { status: 'wait', waitMs: wait };

  const hash = await deps.hasher.hash(pin, record.salt);
  if (hash === record.hash) {
    if (failures.count > 0) await deps.pins.setFailures(NO_FAILURES);
    return { status: 'ok' };
  }

  const next = registerFailure(failures, now);
  await deps.pins.setFailures(next);
  return { status: 'wrong', failures: next.count, waitMs: remainingWaitMs(next, now) };
}

/** Espera atual (ex.: ao abrir a tela de bloqueio depois de fechar o app no meio da espera). */
export async function currentWaitMs(deps: SecurityDeps): Promise<number> {
  return remainingWaitMs(await deps.pins.getFailures(), deps.clock.nowMs());
}

/** Desbloqueio por biometria zera as falhas, como um acerto de PIN. */
export async function registerBiometricUnlock(deps: Pick<SecurityDeps, 'pins'>): Promise<void> {
  await deps.pins.setFailures(NO_FAILURES);
}

export async function changePin(
  deps: SecurityDeps,
  input: { currentPin: string; newPin: string; confirmation: string },
): Promise<VerifyResult> {
  const error = validatePin(input.newPin) ?? validatePinConfirmation(input.newPin, input.confirmation);
  if (error) throw new PinValidationError(error);
  const check = await verifyPin(deps, input.currentPin);
  if (check.status !== 'ok') return check;
  await savePin(deps, input.newPin);
  return check;
}

export async function pinLength(deps: Pick<SecurityDeps, 'pins'>): Promise<number | null> {
  return (await deps.pins.get())?.length ?? null;
}
