'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const token = data.session?.access_token;
      if (!token) throw new Error('No access token returned');

      window.localStorage.setItem('gestor.authToken', token);

      // ensure tenant id is stored
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://gestorapi.magicti.com'}/v1/auth/bootstrap-gestor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({})
        });
        if (res.ok) {
          const j = await res.json();
          if (j?.tenantId) window.localStorage.setItem('gestor.tenantId', j.tenantId);
        }
      } catch {
        // ignore
      }

      window.location.href = '/';
    } catch (err: any) {
      setError(err?.message || 'Falha no login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-semibold">Login</h1>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Email</label>
          <input className="w-full rounded-md bg-black/20 border border-white/10 px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Senha</label>
          <input type="password" className="w-full rounded-md bg-black/20 border border-white/10 px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error ? <div className="text-sm text-red-300">{error}</div> : null}

        <button disabled={loading} className="w-full rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-3 py-2 font-medium">
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
