import { DEFAULT_CATEGORIES } from '@/domain/category';
import { completeOnboarding, eraseAllData } from '@/application/onboarding';
import { createCategory } from '@/application/categories';
import { updateSettings } from '@/application/settings';
import { FakeClock, InMemoryPins, SequentialIds, nodeHasher } from '@/application/testing/fakes';

import { LATEST_SCHEMA_VERSION, applyMigrations, migrateDatabase } from '../migrations';
import { SqliteCategoryRepository } from '../sqlite-category-repository';
import { SqliteProfileRepository } from '../sqlite-profile-repository';
import { NodeSqliteDatabase } from '../testing/node-sqlite-database';

async function setup() {
  const db = new NodeSqliteDatabase();
  await migrateDatabase(db.asExpo());
  const deps = {
    profiles: new SqliteProfileRepository(db.asExpo()),
    categories: new SqliteCategoryRepository(db.asExpo()),
    pins: new InMemoryPins(),
    hasher: nodeHasher,
    clock: new FakeClock(),
    ids: new SequentialIds(),
  };
  return { db, deps };
}

const input = {
  displayName: 'João',
  pin: '2580',
  pinConfirmation: '2580',
  biometricsEnabled: false,
  monthStartDay: 10,
  timeZone: 'America/Manaus',
  categories: DEFAULT_CATEGORIES,
};

describe('SQLite real (node:sqlite)', () => {
  it('Success: migration 1 em banco vazio cria as tabelas e marca a versão', async () => {
    const { db } = await setup();
    const tables = await db.getAllAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE (type = 'table') AND (name NOT LIKE 'sqlite_%') ORDER BY name`,
    );
    expect(tables.map((t) => t.name)).toEqual(['app_settings', 'categories', 'profiles']);
    expect((await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version).toBe(
      LATEST_SCHEMA_VERSION,
    );
    await migrateDatabase(db.asExpo()); // idempotente
    db.close();
  });

  it('onboarding grava e lê de volta perfil, preferências e categorias', async () => {
    const { db, deps } = await setup();
    await completeOnboarding(deps, input);
    const stored = await deps.profiles.get();
    expect(stored?.profile.displayName).toBe('João');
    expect(stored?.settings).toMatchObject({ monthStartDay: 10, timeZone: 'America/Manaus', theme: 'system' });
    const categories = await deps.categories.list(stored!.profile.id);
    expect(categories).toHaveLength(DEFAULT_CATEGORIES.length);
    expect(categories[0].kind).toBe('INCOME');
    db.close();
  });

  it('onboarding é tudo ou nada: categoria inválida desfaz o perfil', async () => {
    const { db, deps } = await setup();
    const duplicated = [DEFAULT_CATEGORIES[0], DEFAULT_CATEGORIES[0]];
    await expect(completeOnboarding(deps, { ...input, categories: duplicated })).rejects.toThrow();
    expect(await deps.profiles.get()).toBeNull();
    expect(deps.pins.record).toBeNull();
    db.close();
  });

  it('constraints recusam valores fora do domínio', async () => {
    const { db } = await setup();
    await db.runAsync(`INSERT INTO profiles (id, display_name, is_demo, created_at, updated_at) VALUES ('p', 'A', 0, 'x', 'x')`);
    const insert = (theme: string, day: number, block: number) =>
      db.runAsync(
        `INSERT INTO app_settings
           (profile_id, theme, currency, month_start_day, time_zone, lock_timeout_seconds,
            biometrics_enabled, block_screen_capture, updated_at)
         VALUES ('p', ?, 'BRL', ?, 'America/Sao_Paulo', 60, 0, ?, 'x')`,
        theme,
        day,
        block,
      );
    await expect(insert('system', 31, 0)).rejects.toThrow();
    await expect(insert('neon', 1, 0)).rejects.toThrow();
    await expect(insert('system', 1, 2)).rejects.toThrow();
    // Controle: a mesma linha com valores válidos entra (prova que as recusas acima são das constraints).
    await insert('system', 1, 1);
    db.close();
  });

  it('nome de categoria único por dono e tipo, sem diferenciar acento', async () => {
    const { db, deps } = await setup();
    const { profile } = await completeOnboarding(deps, input);
    await createCategory(deps, profile.id, { name: 'Viagem', kind: 'EXPENSE', icon: 'airplane-outline', color: '#4A86B8' });
    await expect(
      db.runAsync(
        `INSERT INTO categories (id, owner_id, name, name_key, kind, icon, color, sort_order, is_system, created_at, updated_at)
         VALUES ('z', ?, 'VIAGEM', 'viagem', 'EXPENSE', 'i', 'c', 99, 0, 'x', 'x')`,
        profile.id,
      ),
    ).rejects.toThrow();
    db.close();
  });

  it('atualiza preferências', async () => {
    const { db, deps } = await setup();
    const { settings } = await completeOnboarding(deps, input);
    expect(settings.blockScreenCapture).toBe(false);
    await updateSettings(deps, settings, {
      theme: 'dark',
      lockTimeoutSeconds: 300,
      biometricsEnabled: true,
      blockScreenCapture: true,
    });
    expect((await deps.profiles.get())?.settings).toMatchObject({
      theme: 'dark',
      lockTimeoutSeconds: 300,
      biometricsEnabled: true,
      blockScreenCapture: true,
    });
    db.close();
  });

  it('migration 2 em banco da versão 1 preserva o perfil e deixa o bloqueio de print desligado', async () => {
    const db = new NodeSqliteDatabase();
    await db.withExclusiveTransactionAsync((txn) => applyMigrations(txn.asExpo(), 0, 1));
    await db.runAsync(`INSERT INTO profiles (id, display_name, is_demo, created_at, updated_at) VALUES ('p', 'Ana', 0, 'x', 'x')`);
    await db.runAsync(`INSERT INTO app_settings VALUES ('p', 'dark', 'BRL', 5, 'America/Sao_Paulo', 300, 1, 'x')`);

    await migrateDatabase(db.asExpo());

    const stored = await new SqliteProfileRepository(db.asExpo()).get();
    expect(stored?.profile.displayName).toBe('Ana');
    expect(stored?.settings).toMatchObject({ theme: 'dark', monthStartDay: 5, lockTimeoutSeconds: 300, blockScreenCapture: false });
    db.close();
  });

  it('apagar todos os dados deixa o banco vazio e pronto para um novo onboarding', async () => {
    const { db, deps } = await setup();
    await completeOnboarding(deps, input);
    await eraseAllData(deps);
    expect(await deps.profiles.get()).toBeNull();
    expect((await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM categories'))?.n).toBe(0);
    await completeOnboarding(deps, input);
    expect((await deps.profiles.get())?.profile.displayName).toBe('João');
    db.close();
  });
});
