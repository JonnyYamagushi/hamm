// Abstrações que a infraestrutura implementa (SQLite, Secure Store, relógio, criptografia).
import type { Category } from '@/domain/category';
import type { FailureRecord } from '@/domain/pin';
import type { Profile, Settings } from '@/domain/profile';

export interface ProfileRepository {
  /** Perfil do aparelho (um titular por instalação). */
  get(): Promise<{ profile: Profile; settings: Settings } | null>;
  /** Cria perfil, preferências e categorias numa única transação (onboarding). */
  create(profile: Profile, settings: Settings, categories: readonly Category[]): Promise<void>;
  updateProfile(profile: Profile): Promise<void>;
  updateSettings(settings: Settings): Promise<void>;
  /** Apaga TODOS os dados do banco (perfil, preferências, categorias). */
  eraseAll(): Promise<void>;
}

export interface CategoryRepository {
  list(ownerId: string): Promise<Category[]>;
  insert(category: Category): Promise<void>;
  update(category: Category): Promise<void>;
  remove(id: string): Promise<void>;
}

/** Hash do PIN e falhas seguidas, fora do SQLite (Keychain/Keystore). */
export interface PinStore {
  get(): Promise<{ hash: string; salt: string; length: number } | null>;
  set(record: { hash: string; salt: string; length: number }): Promise<void>;
  getFailures(): Promise<FailureRecord>;
  setFailures(record: FailureRecord): Promise<void>;
  clear(): Promise<void>;
}

export interface Clock {
  /** ISO 8601 UTC */
  nowIso(): string;
  nowMs(): number;
}

export interface IdGenerator {
  newId(): string;
}

export interface PinHasher {
  newSalt(): string;
  hash(pin: string, salt: string): Promise<string>;
}
