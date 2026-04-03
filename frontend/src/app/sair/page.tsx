'use client';

import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function SairPage() {
  useEffect(() => {
    (async () => {
      try {
        // best-effort Supabase signOut (even though we only store token locally)
        const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
        await sb.auth.signOut();
      } catch {
        // ignore
      }

      try {
        window.localStorage.removeItem('gestor.authToken');
        window.localStorage.removeItem('gestor.tenantId');
      } catch {
        // ignore
      }

      window.location.href = '/login';
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-white/70">Saindo…</div>
    </div>
  );
}
