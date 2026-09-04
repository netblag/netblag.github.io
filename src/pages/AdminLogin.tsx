import { FormEvent, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { hasSupabase } from '../lib/config'
import { supabase } from '../lib/supabase'
import { useApp } from '../lib/app-context'

export default function AdminLogin() {
  const { language, toggleLanguage, theme, toggleTheme } = useApp()
  const [session, setSession] = useState<boolean | undefined>(undefined)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  useEffect(() => { if (!supabase) return; supabase.auth.getSession().then(({ data }) => setSession(Boolean(data.session))); const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(Boolean(s))); return () => listener.subscription.unsubscribe() }, [])
  if (session === undefined) return <div className="center-state">Loading…</div>
  if (session && hasSupabase) return <Navigate to="/admin/dashboard" replace />
  async function login(e: FormEvent) { e.preventDefault(); setError(''); setLoading(true); if (!supabase) { setError(language === 'fa' ? 'ابتدا Supabase را در .env تنظیم کن.' : 'Configure Supabase in .env first.'); setLoading(false); return } const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setError(language === 'fa' ? 'ورود ناموفق بود.' : 'Login failed.'); else navigate('/admin/dashboard'); setLoading(false) }
  return <div className="admin-page"><div className="admin-top"><a href="/" className="brand">AA</a><div><button className="circle-button" onClick={toggleLanguage}>{language === 'en' ? 'FA' : 'EN'}</button><button className="circle-button" onClick={toggleTheme}>{theme === 'dark' ? '☼' : '◐'}</button></div></div><div className="admin-login"><span className="accent-text">ADMIN</span><h1>{language === 'fa' ? 'ورود' : 'Sign in'}</h1><p>{language === 'fa' ? 'این بخش عمومی نیست.' : 'This area is not linked from the public site.'}</p><form onSubmit={login}><label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label><label>{language === 'fa' ? 'رمز عبور' : 'Password'}<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label><button className="primary-button" disabled={loading}>{loading ? '…' : language === 'fa' ? 'ورود ↗' : 'Enter ↗'}</button>{error && <div className="form-status error">{error}</div>}</form>{!hasSupabase && <small className="config-note">No admin credentials are stored in the frontend. Supabase Auth is required.</small>}</div></div>
}
