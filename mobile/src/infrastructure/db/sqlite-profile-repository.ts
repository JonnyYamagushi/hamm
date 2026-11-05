import type { SQLiteDatabase } from 'expo-sqlite';

import type { ProfileRepository } from '@/application/ports';
import type { Category } from '@/domain/category';
import { isLockTimeout, type Profile, type Settings, type ThemePreference } from '@/domain/profile';

import { insertCategory } from './sqlite-category-repository';

type ProfileRow = {
  id: string;
  display_name: string;
  is_demo: number;
  created_at: string;
  updated_at: string;
  theme: string;
  currency: string;
  month_start_day: number;
  time_zone: string;
  lock_timeout_seconds: number;
  biometrics_enabled: number;
  block_screen_capture: number;
  settings_updated_at: string;
};

function toSettings(row: ProfileRow): Settings {
  if (!isLockTimeout(row.lock_timeout_seconds)) throw new Error(`lock_timeout_seconds inválido: ${row.lock_timeout_seconds}`);
  return {
    profileId: row.id,
    theme: row.theme as ThemePreference,
    currency: 'BRL',
    monthStartDay: row.month_start_day,
    timeZone: row.time_zone,
    lockTimeoutSeconds: row.lock_timeout_seconds,
    biometricsEnabled: row.biometrics_enabled === 1,
    blockScreenCapture: row.block_screen_capture === 1,
    updatedAt: row.settings_updated_at,
  };
}

async function upsertSettings(db: SQLiteDatabase, s: Settings): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_settings
       (profile_id, theme, currency, month_start_day, time_zone, lock_timeout_seconds, biometrics_enabled,
        block_screen_capture, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (profile_id) DO UPDATE SET
       theme = excluded.theme,
       currency = excluded.currency,
       month_start_day = excluded.month_start_day,
       time_zone = excluded.time_zone,
       lock_timeout_seconds = excluded.lock_timeout_seconds,
       biometrics_enabled = excluded.biometrics_enabled,
       block_screen_capture = excluded.block_screen_capture,
       updated_at = excluded.updated_at`,
    s.profileId,
    s.theme,
    s.currency,
    s.monthStartDay,
    s.timeZone,
    s.lockTimeoutSeconds,
    s.biometricsEnabled ? 1 : 0,
    s.blockScreenCapture ? 1 : 0,
    s.updatedAt,
  );
}

export class SqliteProfileRepository implements ProfileRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async get(): Promise<{ profile: Profile; settings: Settings } | null> {
    const row = await this.db.getFirstAsync<ProfileRow>(
      `SELECT p.id, p.display_name, p.is_demo, p.created_at, p.updated_at,
              s.theme, s.currency, s.month_start_day, s.time_zone, s.lock_timeout_seconds,
              s.biometrics_enabled, s.block_screen_capture, s.updated_at AS settings_updated_at
         FROM profiles p
         JOIN app_settings s ON (s.profile_id = p.id)
        ORDER BY p.created_at
        LIMIT 1`,
    );
    if (!row) return null;
    return {
      profile: {
        id: row.id,
        displayName: row.display_name,
        isDemo: row.is_demo === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      settings: toSettings(row),
    };
  }

  async create(profile: Profile, settings: Settings, categories: readonly Category[]): Promise<void> {
    await this.db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        `INSERT INTO profiles (id, display_name, is_demo, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
        profile.id,
        profile.displayName,
        profile.isDemo ? 1 : 0,
        profile.createdAt,
        profile.updatedAt,
      );
      await upsertSettings(txn, settings);
      for (const category of categories) {
        await insertCategory(txn, category);
      }
    });
  }

  async updateProfile(profile: Profile): Promise<void> {
    await this.db.runAsync(
      `UPDATE profiles SET display_name = ?, updated_at = ? WHERE (id = ?)`,
      profile.displayName,
      profile.updatedAt,
      profile.id,
    );
  }

  async updateSettings(settings: Settings): Promise<void> {
    await upsertSettings(this.db, settings);
  }

  async eraseAll(): Promise<void> {
    // Ordem explícita (filhos antes do pai): a conexão da transação exclusiva não liga foreign_keys.
    await this.db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(`
        DELETE FROM categories;
        DELETE FROM app_settings;
        DELETE FROM profiles;
      `);
    });
    // Recompacta o arquivo para não sobrar conteúdo apagado nas páginas livres.
    await this.db.execAsync('VACUUM');
  }
}
