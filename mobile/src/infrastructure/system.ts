import * as Crypto from 'expo-crypto';

import type { Clock, IdGenerator, PinHasher } from '@/application/ports';

export const systemClock: Clock = {
  nowIso: () => new Date().toISOString(),
  nowMs: () => Date.now(),
};

export const uuidGenerator: IdGenerator = {
  newId: () => Crypto.randomUUID(),
};

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** SHA-256(sal:PIN). A proteção real é o Keychain/Keystore + a espera entre tentativas (spec F1 §4). */
export const pinHasher: PinHasher = {
  newSalt: () => toHex(Crypto.getRandomBytes(16)),
  hash: (pin, salt) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`),
};
