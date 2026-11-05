// PIN fora do SQLite: Keychain (iOS) / Keystore (Android) via expo-secure-store.
// THIS_DEVICE_ONLY: o PIN não migra para outro aparelho por backup do sistema.
import * as SecureStore from 'expo-secure-store';

import type { PinStore } from '@/application/ports';
import { NO_FAILURES, type FailureRecord } from '@/domain/pin';

const KEYS = {
  pin: 'hamm.pin',
  failures: 'hamm.pin.failures',
} as const;

const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

function parse<T>(raw: string | null, isValid: (value: unknown) => value is T): T | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return isValid(value) ? value : null;
  } catch {
    return null;
  }
}

function isPinRecord(value: unknown): value is { hash: string; salt: string; length: number } {
  const v = value as { hash?: unknown; salt?: unknown; length?: unknown } | null;
  return typeof v?.hash === 'string' && typeof v.salt === 'string' && typeof v.length === 'number';
}

function isFailureRecord(value: unknown): value is FailureRecord {
  const v = value as { count?: unknown; lastFailureAt?: unknown } | null;
  return typeof v?.count === 'number' && typeof v.lastFailureAt === 'number';
}

export const securePinStore: PinStore = {
  async get() {
    return parse(await SecureStore.getItemAsync(KEYS.pin, OPTIONS), isPinRecord);
  },
  async set(record) {
    await SecureStore.setItemAsync(KEYS.pin, JSON.stringify(record), OPTIONS);
  },
  async getFailures() {
    return parse(await SecureStore.getItemAsync(KEYS.failures, OPTIONS), isFailureRecord) ?? NO_FAILURES;
  },
  async setFailures(record) {
    await SecureStore.setItemAsync(KEYS.failures, JSON.stringify(record), OPTIONS);
  },
  async clear() {
    await SecureStore.deleteItemAsync(KEYS.pin, OPTIONS);
    await SecureStore.deleteItemAsync(KEYS.failures, OPTIONS);
  },
};
