// Migrations versionadas por PRAGMA user_version (ADR-002). Nunca editar uma migration já
// entregue: sempre acrescentar a próxima. SQL explícito, sem ORM.
import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'hamm.db';

type Migration = { version: number; name: string; sql: string };

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    name: 'profiles_settings_categories',
    sql: `
      CREATE TABLE profiles (
        id            TEXT PRIMARY KEY NOT NULL,
        display_name  TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 40),
        is_demo       INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
        created_at    TEXT NOT NULL,
        updated_at    TEXT NOT NULL
      );

      CREATE TABLE app_settings (
        profile_id            TEXT PRIMARY KEY NOT NULL REFERENCES profiles (id),
        theme                 TEXT NOT NULL CHECK (theme IN ('system', 'light', 'dark')),
        currency              TEXT NOT NULL CHECK (currency IN ('BRL')),
        month_start_day       INTEGER NOT NULL CHECK (month_start_day BETWEEN 1 AND 28),
        time_zone             TEXT NOT NULL,
        lock_timeout_seconds  INTEGER NOT NULL CHECK (lock_timeout_seconds IN (0, 60, 300, 900)),
        biometrics_enabled    INTEGER NOT NULL CHECK (biometrics_enabled IN (0, 1)),
        updated_at            TEXT NOT NULL
      );

      CREATE TABLE categories (
        id          TEXT PRIMARY KEY NOT NULL,
        owner_id    TEXT NOT NULL REFERENCES profiles (id),
        name        TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 30),
        name_key    TEXT NOT NULL,
        kind        TEXT NOT NULL CHECK (kind IN ('EXPENSE', 'INCOME')),
        icon        TEXT NOT NULL,
        color       TEXT NOT NULL,
        parent_id   TEXT NULL REFERENCES categories (id),
        sort_order  INTEGER NOT NULL,
        is_system   INTEGER NOT NULL CHECK (is_system IN (0, 1)),
        archived_at TEXT NULL,
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
      );

      CREATE UNIQUE INDEX ux_categories_owner_kind_name ON categories (owner_id, kind, name_key);
    `,
  },
  {
    // Impedir prints e gravação de tela: opcional, desligado por padrão (pedido do João, 2026-11-05).
    version: 2,
    name: 'block_screen_capture',
    sql: `
      ALTER TABLE app_settings
        ADD COLUMN block_screen_capture INTEGER NOT NULL DEFAULT 0 CHECK (block_screen_capture IN (0, 1));
    `,
  },
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

/** Aplica as migrations de (from, to] na conexão recebida (já dentro de uma transação). */
export async function applyMigrations(txn: SQLiteDatabase, from: number, to: number): Promise<void> {
  for (const migration of MIGRATIONS) {
    if ((migration.version > from) && (migration.version <= to)) {
      await txn.execAsync(migration.sql);
    }
  }
  await txn.execAsync(`PRAGMA user_version = ${to}`);
}

/** `onInit` do SQLiteProvider: sobe o banco até a última versão numa única transação. */
export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current > LATEST_SCHEMA_VERSION) {
    throw new Error('Os dados foram gravados por uma versão mais nova do app. Atualize o app para continuar.');
  }
  if (current === LATEST_SCHEMA_VERSION) return;
  await db.withExclusiveTransactionAsync((txn) => applyMigrations(txn, current, LATEST_SCHEMA_VERSION));
}
