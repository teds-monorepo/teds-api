import type { SupabaseClient } from '@supabase/supabase-js';

export interface KvListResult {
  keys: { name: string; expiration: number | null }[];
  cursor: string | null;
}

export interface KvStore {
  get(key: string): Promise<unknown>;
  put(key: string, value: unknown, expirationTtl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix?: string, limit?: number, cursor?: string): Promise<KvListResult>;
}

interface Row {
  key: string;
  value: unknown;
  expires_at: string | null;
}

const TABLE = 'kv_entries';

function toEpochSeconds(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
}

export class SupabaseKvStore implements KvStore {
  constructor(private db: SupabaseClient) {}

  async get(key: string): Promise<unknown> {
    const { data, error } = await this.db
      .from(TABLE)
      .select('value, expires_at')
      .eq('key', key)
      .maybeSingle();
    if (error) throw new Error(`KV get failed: ${error.message}`);
    if (!data) return undefined;
    const row = data as Pick<Row, 'value' | 'expires_at'>;
    if (row.expires_at !== null && Date.parse(row.expires_at) <= Date.now()) {
      await this.delete(key);
      return undefined;
    }
    return row.value;
  }

  async put(key: string, value: unknown, expirationTtl?: number): Promise<void> {
    const expires_at =
      expirationTtl === undefined ? null : new Date(Date.now() + expirationTtl * 1000).toISOString();
    const { error } = await this.db
      .from(TABLE)
      .upsert({ key, value: value as never, expires_at }, { onConflict: 'key' });
    if (error) throw new Error(`KV put failed: ${error.message}`);
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.db.from(TABLE).delete().eq('key', key);
    if (error) throw new Error(`KV delete failed: ${error.message}`);
  }

  async list(prefix?: string, limit = 100, cursor?: string): Promise<KvListResult> {
    let query = this.db.from(TABLE).select('key, expires_at').order('key', { ascending: true });
    if (prefix) query = query.like('key', `${prefix}%`);
    if (cursor) query = query.gt('key', cursor);
    const { data, error } = await query.limit(limit + 1);
    if (error) throw new Error(`KV list failed: ${error.message}`);
    const rows = (data ?? []) as Pick<Row, 'key' | 'expires_at'>[];
    const page = rows.slice(0, limit);
    return {
      keys: page.map((r) => ({ name: r.key, expiration: toEpochSeconds(r.expires_at) })),
      cursor: rows.length > limit ? page[page.length - 1].key : null,
    };
  }
}
