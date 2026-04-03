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
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

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
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://gestorapi.magicti.com'}/v1/auth/bootstrap-gestor`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({}),
          }
        );
        if (res.ok) {
          const j = await res.json();
          if (j?.tenantId) window.localStorage.setItem('gestor.tenantId', j.tenantId);
        }
      } catch {
        // ignore
      }

      window.location.href = '/';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha no login';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .ghost-border {
          border: 1px solid rgba(72, 72, 72, 0.15);
        }
        .frosted {
          backdrop-filter: blur(12px);
          background-color: rgba(38, 38, 38, 0.8);
        }
        .login-input {
          display: block;
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          background-color: var(--color-surface-container-low);
          border: 0;
          border-radius: 0.5rem;
          color: var(--color-on-surface);
          font-size: 0.875rem;
          transition: all 200ms ease-out;
          outline: none;
        }
        .login-input::placeholder {
          color: var(--color-outline);
        }
        .login-input:focus {
          background-color: var(--color-surface-container-highest);
          box-shadow: 0 0 0 1px rgba(173, 198, 255, 0.2);
        }
        .login-input-password {
          padding-right: 3rem;
        }
        .login-group:focus-within .input-icon {
          color: var(--color-primary);
        }
        .login-btn-primary {
          width: 100%;
          padding: 1rem 1.5rem;
          background-color: var(--color-primary-container);
          color: var(--color-on-primary-container);
          font-weight: 600;
          border-radius: 0.5rem;
          border: none;
          cursor: pointer;
          transition: all 200ms ease-out;
          font-size: 0.9375rem;
          letter-spacing: 0.01em;
          box-shadow: 0 8px 24px rgba(0, 67, 149, 0.2);
        }
        .login-btn-primary:hover:not(:disabled) {
          filter: brightness(1.1);
        }
        .login-btn-primary:active:not(:disabled) {
          transform: scale(0.98);
        }
        .login-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background-color: var(--color-surface-container-low);
          border-radius: 0.5rem;
          border: none;
          cursor: pointer;
          transition: background-color 200ms ease-out;
          color: var(--color-on-surface);
          font-size: 0.875rem;
          font-weight: 500;
        }
        .social-btn:hover {
          background-color: var(--color-surface-container-highest);
        }
        .social-btn img {
          opacity: 0.8;
          transition: opacity 200ms;
        }
        .social-btn:hover img {
          opacity: 1;
        }
        .divider-text {
          background-color: var(--color-background);
          padding: 0 1rem;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--color-on-surface-variant);
        }
        .hero-card {
          background-color: rgba(38, 38, 38, 0.4);
        }
        .bento-aspect {
          aspect-ratio: 16 / 9;
        }
        .avatar-stack {
          display: flex;
        }
        .avatar-stack > div {
          margin-left: -0.75rem;
        }
        .avatar-stack > div:first-child {
          margin-left: 0;
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.25; }
        }
        .pulse-glow {
          animation: pulse-glow 4s ease-in-out infinite;
        }
      `}</style>

      <main
        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row', overflow: 'hidden', backgroundColor: 'var(--color-background)' }}
      >
        {/* Left Column: Branding & Art */}
        <section
          style={{
            display: 'none',
            flex: '0 0 60%',
            backgroundColor: 'var(--color-surface-container-low)',
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem',
          }}
          className="login-left-section"
        >
          <style>{`
            @media (min-width: 768px) {
              .login-left-section {
                display: flex !important;
              }
              .login-main-wrapper {
                flex-direction: row !important;
              }
              .mobile-logo {
                display: none !important;
              }
              .login-right-section {
                padding: 3rem !important;
              }
            }
            @media (min-width: 1024px) {
              .login-right-section {
                padding: 6rem !important;
              }
            }
          `}</style>

          {/* Background Texture */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              opacity: 0.2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-6rem',
                left: '-6rem',
                width: '24rem',
                height: '24rem',
                backgroundColor: 'var(--color-primary-container)',
                borderRadius: '9999px',
                filter: 'blur(120px)',
              }}
              className="pulse-glow"
            />
            <div
              style={{
                position: 'absolute',
                bottom: '25%',
                right: 0,
                width: '32rem',
                height: '32rem',
                backgroundColor: 'rgba(173, 198, 255, 0.1)',
                borderRadius: '9999px',
                filter: 'blur(100px)',
              }}
              className="pulse-glow"
            />
          </div>

          <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '42rem' }}>
            {/* Brand Lockup */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
              <div
                style={{
                  width: '3rem',
                  height: '3rem',
                  backgroundColor: 'var(--color-primary-container)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-on-primary-container)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.75rem' }}>psychology</span>
              </div>
              <span
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  letterSpacing: '-0.05em',
                  color: 'var(--color-primary)',
                }}
              >
                Gestor AI
              </span>
            </div>

            {/* Bento Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1rem' }}>
              {/* Hero text card */}
              <div
                className="ghost-border hero-card"
                style={{ gridColumn: 'span 12', padding: '2rem', borderRadius: '0.75rem' }}
              >
                <h1
                  style={{
                    fontSize: 'clamp(2rem, 3vw, 3rem)',
                    fontWeight: 700,
                    color: 'var(--color-on-surface)',
                    lineHeight: 1.2,
                    marginBottom: '1rem',
                    letterSpacing: '-0.03em',
                  }}
                >
                  Controle total com o seu{' '}
                  <span style={{ color: 'var(--color-primary)' }}>Gestor AI</span>.
                </h1>
                <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '1.125rem', maxWidth: '28rem' }}>
                  Gerencie tarefas e operadores com o poder da inteligência artificial aplicada ao seu fluxo de trabalho.
                </p>
              </div>

              {/* Dashboard image */}
              <div
                className="ghost-border bento-aspect"
                style={{
                  gridColumn: 'span 7',
                  backgroundColor: 'var(--color-surface-container-high)',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                }}
              >
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAHCk9sdW3ZdtJIEnbu5NIdVNiMVnd7sofZsRYH6X0KA0HMNINt791q1yLUCs8qXg-vAvL7Zmqtu9URl_FcgJR-cRKs44VdB1PIXBW8zPhnNbfGZ6-ziAVKFqa86dmBbcx15eyPJT26lA8xq2J__tUhchAgRO2OQ0lLb98XPv80QroqJDcKh2ooJ8sio_pJWsZxTMP7KBVP1vAYIMPIRhMmQAxAGvWQ_3w6HVX3G5FP38mzWJVM60eRhZeAfKjIWx3BL40Mzy5T0_p"
                  alt="Modern AI dashboard interface"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'grayscale(1)',
                    opacity: 0.6,
                    transition: 'filter 500ms, opacity 500ms',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLImageElement).style.filter = 'grayscale(0)';
                    (e.target as HTMLImageElement).style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLImageElement).style.filter = 'grayscale(1)';
                    (e.target as HTMLImageElement).style.opacity = '0.6';
                  }}
                />
              </div>

              {/* Stats card */}
              <div
                className="ghost-border"
                style={{
                  gridColumn: 'span 5',
                  backgroundColor: 'rgba(0, 67, 149, 0.2)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: '1.5rem',
                }}
              >
                <div className="avatar-stack" style={{ marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '9999px',
                      border: '2px solid var(--color-background)',
                      backgroundColor: 'var(--color-secondary)',
                    }}
                  />
                  <div
                    style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '9999px',
                      border: '2px solid var(--color-background)',
                      backgroundColor: 'var(--color-primary-fixed-dim)',
                    }}
                  />
                  <div
                    style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '9999px',
                      border: '2px solid var(--color-background)',
                      backgroundColor: 'var(--color-surface-container-highest)',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'Inter, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    color: 'var(--color-primary)',
                    fontWeight: 500,
                  }}
                >
                  +200 operadores ativos
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Login Form */}
        <section
          className="login-right-section"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            backgroundColor: 'var(--color-background)',
          }}
        >
          <div style={{ width: '100%', maxWidth: '26rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Mobile Logo */}
            <div
              className="mobile-logo"
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            >
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: 'var(--color-primary-container)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-on-primary-container)',
                }}
              >
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  letterSpacing: '-0.05em',
                  color: 'var(--color-primary)',
                }}
              >
                Gestor AI
              </span>
            </div>

            {/* Header */}
            <header>
              <h2
                style={{
                  fontSize: '1.875rem',
                  fontWeight: 700,
                  color: 'var(--color-on-surface)',
                  letterSpacing: '-0.03em',
                  marginBottom: '0.5rem',
                }}
              >
                Bem-vindo ao Gestor AI
              </h2>
              <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.875rem' }}>
                Acesse sua conta para gerenciar suas tarefas com IA
              </p>
            </header>

            {/* Social Login */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button className="social-btn ghost-border" type="button">
                <img
                  alt="Google"
                  style={{ width: '1.25rem', height: '1.25rem' }}
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXBxRRbzuW2kzvoXk59CQwSm4LYku5uQPlTz-CxzJRXdO340x3oc-STr32-0s3JckkdQ02sDkofREBGsGQw3N2Oh2RRMb3mNPLPcFYfaIlutIJmhxeMMZViHGrnMFL1UTnnz62W-f83wQf0gxO7-7J8qgaZWEWj75bR2BCc_yKaIkyu1nuFBYok4XnAYf2xyuc1MbfBxo8sS6aVKA1NwSn3v2Uf2uMHZcKnRLjCkAQsqmDDw_n0X19eIR9mAx6x9RRfS_ywxfVk6Rk"
                />
                <span>Google</span>
              </button>
              <button className="social-btn ghost-border" type="button">
                <img
                  alt="Microsoft"
                  style={{ width: '1.25rem', height: '1.25rem' }}
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCo6e7wCsxL7CbGiu3_qSxI46i3F_HjIBOFOOC_ghspi0O9duJJYuf0Kek5e-UWBjUgcs_4zdpn7j52elIt5po18gEsTfPdRKrE6GLob1YMXvybavlZYRAxDJdHuIB2fU7ckrLdXU7JokfxsHqnBixjcWc5akhxZa_qgWNMKI7OrKdO-I6ShWEwyjqpEBCZdOy67fT6trRsCbCqcEqRPbelXu-FJFhNuhBMIO9j1mhcXoPkWnP3PscnuVuVQHb9IAJ5rjhobg0ek95Y"
                />
                <span>Microsoft</span>
              </button>
            </div>

            {/* Divider */}
            <div style={{ position: 'relative', padding: '0.5rem 0' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    borderTop: '1px solid rgba(72, 72, 72, 0.3)',
                  }}
                />
              </div>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <span className="divider-text">Ou continue com e-mail</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Email field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label
                  htmlFor="email"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--color-on-surface-variant)',
                    marginLeft: '0.25rem',
                  }}
                >
                  E-mail
                </label>
                <div className="login-group" style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      paddingLeft: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <span
                      className="material-symbols-outlined input-icon"
                      style={{
                        fontSize: '1.25rem',
                        color: 'var(--color-on-surface-variant)',
                        transition: 'color 200ms',
                      }}
                    >
                      mail
                    </span>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nome@exemplo.com"
                    className="login-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.25rem' }}>
                  <label
                    htmlFor="password"
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'var(--color-on-surface-variant)',
                    }}
                  >
                    Senha
                  </label>
                  <a
                    href="#"
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: 'var(--color-primary)',
                      textDecoration: 'none',
                      transition: 'color 200ms',
                    }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--color-primary-dim)'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--color-primary)'}
                  >
                    Esqueceu a senha?
                  </a>
                </div>
                <div className="login-group" style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      paddingLeft: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <span
                      className="material-symbols-outlined input-icon"
                      style={{
                        fontSize: '1.25rem',
                        color: 'var(--color-on-surface-variant)',
                        transition: 'color 200ms',
                      }}
                    >
                      lock
                    </span>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="login-input login-input-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      right: 0,
                      paddingRight: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--color-on-surface-variant)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'color 200ms',
                    }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--color-primary)'}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--color-on-surface-variant)'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 0' }}>
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{
                    width: '1rem',
                    height: '1rem',
                    borderRadius: '0.25rem',
                    backgroundColor: 'var(--color-surface-container-highest)',
                    accentColor: 'var(--color-primary)',
                    cursor: 'pointer',
                  }}
                />
                <label
                  htmlFor="remember"
                  style={{
                    marginLeft: '0.75rem',
                    fontSize: '0.875rem',
                    color: 'var(--color-on-surface-variant)',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  Lembrar-me por 30 dias
                </label>
              </div>

              {/* Error message */}
              {error && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(127, 41, 39, 0.3)',
                    borderRadius: '0.5rem',
                    color: 'var(--color-on-error-container)',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>error</span>
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="login-btn-primary"
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '1rem',
                        height: '1rem',
                        border: '2px solid rgba(189, 208, 255, 0.3)',
                        borderTopColor: 'var(--color-on-primary-container)',
                        borderRadius: '9999px',
                        animation: 'spin 0.7s linear infinite',
                      }}
                    />
                    Entrando...
                  </span>
                ) : (
                  'Entrar na plataforma'
                )}
              </button>
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </form>

            {/* Footer */}
            <footer style={{ paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-on-surface-variant)' }}>
                Não tem uma conta?{' '}
                <a
                  href="#"
                  style={{
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.textDecoration = 'underline'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.textDecoration = 'none'}
                >
                  Solicite acesso
                </a>
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                {['Privacidade', 'Termos', 'Suporte'].map((item, i) => (
                  <>
                    {i > 0 && (
                      <span
                        key={`sep-${i}`}
                        style={{
                          width: '0.25rem',
                          height: '0.25rem',
                          borderRadius: '9999px',
                          backgroundColor: 'var(--color-outline-variant)',
                          display: 'block',
                        }}
                      />
                    )}
                    <a
                      key={item}
                      href="#"
                      style={{
                        fontSize: '0.6875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.2em',
                        color: 'var(--color-outline)',
                        textDecoration: 'none',
                        transition: 'color 200ms',
                      }}
                      onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--color-on-surface)'}
                      onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--color-outline)'}
                    >
                      {item}
                    </a>
                  </>
                ))}
              </div>

              <p
                style={{
                  fontSize: '0.625rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.25em',
                  color: '#484848',
                  textAlign: 'center',
                }}
              >
                © 2024 Gestor AI. Inteligência Artificial Aplicada.
              </p>
            </footer>
          </div>
        </section>
      </main>
    </>
  );
}
