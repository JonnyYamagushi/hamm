import type { SQLiteDatabase } from 'expo-sqlite';

import type { CategoryRepository } from '@/application/ports';
import { categoryNameKey, type Category, type CategoryKind } from '@/domain/category';

type CategoryRow = {
  id: string;
  owner_id: string;
  name: string;
  kind: string;
  icon: string;
  color: string;
  sort_order: number;
  is_system: number;
  created_at: string;
  updated_at: string;
};

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    kind: row.kind as CategoryKind,
    icon: row.icon,
    color: row.color,
    sortOrder: row.sort_order,
    isSystem: row.is_system === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Também usado pelo onboarding, dentro da transação dele. */
export async function insertCategory(db: SQLiteDatabase, c: Category): Promise<void> {
  await db.runAsync(
    `INSERT INTO categories
       (id, owner_id, name, name_key, kind, icon, color, parent_id, sort_order, is_system, archived_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, NULL, ?, ?)`,
    c.id,
    c.ownerId,
    c.name,
    categoryNameKey(c.name),
    c.kind,
    c.icon,
    c.color,
    c.sortOrder,
    c.isSystem ? 1 : 0,
    c.createdAt,
    c.updatedAt,
  );
}

export class SqliteCategoryRepository implements CategoryRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async list(ownerId: string): Promise<Category[]> {
    const rows = await this.db.getAllAsync<CategoryRow>(
      `SELECT id, owner_id, name, kind, icon, color, sort_order, is_system, created_at, updated_at
         FROM categories
        WHERE (owner_id = ?)
          AND (archived_at IS NULL)
        ORDER BY kind DESC, sort_order, name`,
      ownerId,
    );
    return rows.map(toCategory);
  }

  async insert(category: Category): Promise<void> {
    await insertCategory(this.db, category);
  }

  async update(c: Category): Promise<void> {
    await this.db.runAsync(
      `UPDATE categories
          SET name = ?, name_key = ?, icon = ?, color = ?, sort_order = ?, updated_at = ?
        WHERE (id = ?)`,
      c.name,
      categoryNameKey(c.name),
      c.icon,
      c.color,
      c.sortOrder,
      c.updatedAt,
      c.id,
    );
  }

  async remove(id: string): Promise<void> {
    await this.db.runAsync(`DELETE FROM categories WHERE (id = ?)`, id);
  }
}
