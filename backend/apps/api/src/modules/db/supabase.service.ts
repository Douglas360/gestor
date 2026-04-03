import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

//

@Injectable()
export class SupabaseService {
  /** Admin client (service role) — bypasses RLS. Use carefully. */
  readonly client: SupabaseClient;

  /** Stored for building user-scoped clients (RLS) + token validation. */
  private readonly url: string;
  private readonly anonKey: string | null;

  /** Public/anon client used only for token validation. */
  private readonly anonClient: SupabaseClient | null;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    this.url = url || '';
    this.anonKey = anonKey || null;

    if (!url) throw new Error('SUPABASE_URL is required');
    if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

    this.client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    this.anonClient = anonKey
      ? createClient(url, anonKey, {
          auth: { persistSession: false, autoRefreshToken: false }
        })
      : null;
  }

  /**
   * Build a Supabase client that runs queries as the authenticated user.
   * This is required for RLS to actually enforce policies.
   */
  clientForAccessToken(accessToken: string): SupabaseClient {
    if (!this.anonKey) {
      throw new Error('SUPABASE_ANON_KEY is required when AUTH_ENABLED=true');
    }

    return createClient(this.url, this.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    });
  }

  async getUserFromAccessToken(accessToken: string) {
    if (!this.anonClient) {
      throw new Error('SUPABASE_ANON_KEY is required when AUTH_ENABLED=true');
    }

    const { data, error } = await this.anonClient.auth.getUser(accessToken);
    if (error) return null;
    return data.user;
  }
}

