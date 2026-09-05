import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
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

  useEffect(() => {
    if (!supabase) {
      setSession(false)
      return
    }

    let mounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      if (!data.session) {
        setSession(false)
        return
      }

      const { data: admin } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', data.session.user.id)
        .maybeSingle()

      if (admin) {
        setSession(true)
      } else {
        await supabase.auth.signOut()
        setSession(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return
      if (!nextSession) {
        setSession(false)
        return
      }

      const { data: admin } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', nextSession.user.id)
        .maybeSingle()

      if (admin) {
        setSession(true)
      } else {
        await supabase.auth.signOut()
        setSession(false)
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  if (session === undefined) return <div className="center-state">Loading…</div>
  if (session && hasSupabase) return <Navigate to="/admin/dashboard" replace />

  async function login(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)

    if (!supabase) {
      setError(language === 'fa' ? 'اتصال Supabase تنظیم نشده است.' : 'Supabase is not configured.')
      setLoading(false)
      return
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError || !data.user) {
      setError(language === 'fa' ? 'ایمیل یا رمز عبور نادرست است.' : 'Invalid email or password.')
      setLoading(false)
      return
    }

    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', data.user.id)
      .maybeSingle()

    if (adminError || !admin) {
      await supabase.auth.signOut()
      setError(language === 'fa' ? 'این حساب مجوز مدیریت ندارد.' : 'This account is not an administrator.')
      setLoading(false)
      return
    }

    navigate('/admin/dashboard')
    setLoading(false)
  }

  return (
    <div className="admin-page">
      <div className="admin-top">
        <a href="/" className="brand">AA</a>
        <div>
          <button className="circle-button" onClick={toggleLanguage}>{language === 'en' ? 'FA' : 'EN'}</button>
          <button className="circle-button" onClick={toggleTheme}>{theme === 'dark' ? '☼' : '◐'}</button>
        </div>
      </div>

      <div className="admin-login">
        <span className="accent-text">ADMIN</span>
        <h1>{language === 'fa' ? 'ورود' : 'Sign in'}</h1>
        <p>{language === 'fa' ? 'این بخش عمومی نیست.' : 'This area is not linked from the public site.'}</p>

        <form onSubmit={login}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label>
            {language === 'fa' ? 'رمز عبور' : 'Password'}
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <button className="primary-button" disabled={loading}>
            {loading ? '…' : language === 'fa' ? 'ورود ↗' : 'Enter ↗'}
          </button>

          {error && <div className="form-status error">{error}</div>}
        </form>
      </div>
    </div>
  )
}
