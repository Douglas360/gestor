import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url) throw new Error('SUPABASE_URL is required');
    if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

    this.client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
}
