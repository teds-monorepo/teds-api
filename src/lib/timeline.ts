import type { SupabaseClient } from '@supabase/supabase-js';

export interface TimelineEvent {
  id: string;
  name: string;
  solar_date: string;
  lunar_date: string;
  type: 'lunar' | 'solar';
  icon: string;
  note: string;
  category: string;
}

export interface TimelineStore {
  list(category?: string): Promise<TimelineEvent[]>;
}

const TABLE = 'timeline_events';

export class SupabaseTimelineStore implements TimelineStore {
  constructor(private db: SupabaseClient) {}

  async list(category?: string): Promise<TimelineEvent[]> {
    let query = this.db
      .from(TABLE)
      .select('id, name, solar_date, lunar_date, type, icon, note, category')
      .order('solar_date', { ascending: true });
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) throw new Error(`Timeline list failed: ${error.message}`);
    return (data ?? []) as TimelineEvent[];
  }
}
