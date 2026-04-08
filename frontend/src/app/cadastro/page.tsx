'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { API_BASE_URL } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function CadastroPage() {
  const [nome, setNome] = useState('');
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
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) throw error;

      const token = data.session?.access_token;
      if (!token) {
        throw new Error('Conta criada. Confirme o email e faça login.');
      }

      window.localStorage.setItem('gestor.authToken', token);

      // Bootstrap gestor workspace (tenant == user_id)
      const res = await fetch(`${API_BASE_URL}/v1/auth/bootstrap-gestor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: nome || email })
      });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      if (j?.tenantId) window.localStorage.setItem('gestor.tenantId', j.tenantId);

      window.location.href = '/';
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Falha no cadastro'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-semibold">Criar conta (Gestor)</h1>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Nome (empresa/gestor)</label>
          <input className="w-full rounded-md bg-black/20 border border-white/10 px-3 py-2" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Email</label>
          <input className="w-full rounded-md bg-black/20 border border-white/10 px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Senha</label>
          <input type="password" className="w-full rounded-md bg-black/20 border border-white/10 px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error ? <div className="text-sm text-red-300 whitespace-pre-wrap">{error}</div> : null}

        <button disabled={loading} className="w-full rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-3 py-2 font-medium">
          {loading ? 'Criando…' : 'Criar conta'}
        </button>

        <div className="text-sm text-white/60">
          Já tem conta? <a className="underline" href="/login">Entrar</a>
        </div>
      </form>
    </div>
  );
}
