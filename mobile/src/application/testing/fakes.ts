/// <reference types="node" />
// SÓ PARA TESTES: implementações em memória dos ports.
import { createHash } from 'node:crypto';

import type { Category } from '@/domain/category';
import { NO_FAILURES, type FailureRecord } from '@/domain/pin';
import type { Profile, Settings } from '@/domain/profile';

import type { CategoryRepository, Clock, IdGenerator, PinHasher, PinStore, ProfileRepository } from '../ports';

export class InMemoryProfiles implements ProfileRepository {
  profile: Profile | null = null;
  settings: Settings | null = null;
  failNextCreate = false;

  constructor(readonly categories: InMemoryCategories) {}

  async get() {
    return this.profile && this.settings ? { profile: this.profile, settings: this.settings } : null;
  }
  async create(profile: Profile, settings: Settings, categories: readonly Category[]) {
    if (this.failNextCreate) {
      this.failNextCreate = false;
      throw new Error('disco cheio');
    }
    this.profile = profile;
    this.settings = settings;
    this.categories.items.push(...categories);
  }
  async updateProfile(profile: Profile) {
    this.profile = profile;
  }
  async updateSettings(settings: Settings) {
    this.settings = settings;
  }
  async eraseAll() {
    this.profile = null;
    this.settings = null;
    this.categories.items.length = 0;
  }
}

export class InMemoryCategories implements CategoryRepository {
  items: Category[] = [];
  async list(ownerId: string) {
    return this.items.filter((c) => c.ownerId === ownerId).sort((a, b) => a.sortOrder - b.sortOrder);
  }
  async insert(category: Category) {
    this.items.push(category);
  }
  async update(category: Category) {
    this.items = this.items.map((c) => (c.id === category.id ? category : c));
  }
  async remove(id: string) {
    this.items = this.items.filter((c) => c.id !== id);
  }
}

export class InMemoryPins implements PinStore {
  record: { hash: string; salt: string; length: number } | null = null;
  failures: FailureRecord = NO_FAILURES;
  async get() {
    return this.record;
  }
  async set(record: { hash: string; salt: string; length: number }) {
    this.record = record;
  }
  async getFailures() {
    return this.failures;
  }
  async setFailures(record: FailureRecord) {
    this.failures = record;
  }
  async clear() {
    this.record = null;
    this.failures = NO_FAILURES;
  }
}

export class FakeClock implements Clock {
  constructor(public ms = Date.UTC(2026, 10, 5, 12)) {}
  nowIso() {
    return new Date(this.ms).toISOString();
  }
  nowMs() {
    return this.ms;
  }
  advance(ms: number) {
    this.ms += ms;
  }
}

export class SequentialIds implements IdGenerator {
  private next = 1;
  newId() {
    return `id-${this.next++}`;
  }
}

export const nodeHasher: PinHasher = {
  newSalt: () => 'sal-fixo',
  hash: async (pin, salt) => createHash('sha256').update(`${salt}:${pin}`).digest('hex'),
};

export function makeDeps() {
  const categories = new InMemoryCategories();
  const profiles = new InMemoryProfiles(categories);
  return {
    profiles,
    categories,
    pins: new InMemoryPins(),
    hasher: nodeHasher,
    clock: new FakeClock(),
    ids: new SequentialIds(),
  };
}
