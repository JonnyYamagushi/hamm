/// <reference types="node" />
// SÓ PARA TESTES: expõe o subconjunto da API do expo-sqlite usado pelos repositórios sobre o motor
// SQLite embutido no Node (`node:sqlite`), para testar SQL e migrations contra SQLite real sem
// dependência nova (mesmo recurso do MosaInk). Nunca importar no app.
import { DatabaseSync } from 'node:sqlite';

import type { SQLiteDatabase } from 'expo-sqlite';

type Params = (string | number | null)[];

function flatten(params: unknown[]): Params {
  return (params.length === 1 && Array.isArray(params[0]) ? params[0] : params) as Params;
}

/** Linhas do node:sqlite vêm com protótipo nulo; copia para objeto comum (como o expo-sqlite). */
function plain<T>(row: unknown): T {
  return { ...(row as object) } as T;
}

export class NodeSqliteDatabase {
  readonly raw: DatabaseSync;

  constructor(path = ':memory:') {
    this.raw = new DatabaseSync(path);
  }

  async execAsync(sql: string): Promise<void> {
    this.raw.exec(sql);
  }

  async runAsync(sql: string, ...params: unknown[]): Promise<{ changes: number; lastInsertRowId: number }> {
    const result = this.raw.prepare(sql).run(...flatten(params));
    return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid) };
  }

  async getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null> {
    const row = this.raw.prepare(sql).get(...flatten(params));
    return row === undefined ? null : plain<T>(row);
  }

  async getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]> {
    return this.raw
      .prepare(sql)
      .all(...flatten(params))
      .map((row) => plain<T>(row));
  }

  async withExclusiveTransactionAsync(task: (txn: NodeSqliteDatabase) => Promise<void>): Promise<void> {
    this.raw.exec('BEGIN EXCLUSIVE');
    try {
      await task(this);
      this.raw.exec('COMMIT');
    } catch (error) {
      this.raw.exec('ROLLBACK');
      throw error;
    }
  }

  close(): void {
    this.raw.close();
  }

  asExpo(): SQLiteDatabase {
    return this as unknown as SQLiteDatabase;
  }
}
