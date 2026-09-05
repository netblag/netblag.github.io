import {
  useEffect,
  useState,
} from 'react'

import type {
  FormEvent,
} from 'react'

import {
  Navigate,
  useNavigate,
} from 'react-router-dom'

import { hasSupabase } from '../lib/config'
import { supabase } from '../lib/supabase'
import { useApp } from '../lib/app-context'

export default function AdminLogin() {
  const {
    language,
    toggleLanguage,
    theme,
    toggleTheme,
  } = useApp()

  const [session, setSession] =
    useState<boolean | undefined>(
      undefined,
    )

  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [error, setError] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const navigate =
    useNavigate()

  useEffect(() => {
    if (!supabase) {
      setSession(false)
      return
    }

    let mounted = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) {
          setSession(
            Boolean(data.session),
          )
        }
      })

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (_event, currentSession) => {
          if (mounted) {
            setSession(
              Boolean(currentSession),
            )
          }
        },
      )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (session === undefined) {
    return (
      <div className="center-state">
        {language === 'fa'
          ? 'در حال بارگذاری...'
          : 'Loading...'}
      </div>
    )
  }

  if (
    session &&
    hasSupabase
  ) {
    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    )
  }

  async function login(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')
    setLoading(true)

    if (!supabase) {
      setError(
        language === 'fa'
          ? 'اتصال Supabase تنظیم نشده است.'
          : 'Supabase is not configured.',
      )

      setLoading(false)
      return
    }

    try {
      const {
        error: loginError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email,
            password,
          },
        )

      if (loginError) {
        setError(
          language === 'fa'
            ? 'ایمیل یا رمز عبور صحیح نیست.'
            : 'Invalid email or password.',
        )

        return
      }

      navigate(
        '/admin/dashboard',
      )
    } catch {
      setError(
        language === 'fa'
          ? 'خطایی هنگام ورود رخ داد.'
          : 'Something went wrong while signing in.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-top">
        <a
          href="/"
          className="brand"
        >
          AA
        </a>

        <div className="admin-top-actions">
          <button
            className="circle-button"
            type="button"
            onClick={toggleLanguage}
          >
            {language === 'en'
              ? 'FA'
              : 'EN'}
          </button>

          <button
            className="circle-button"
            type="button"
            onClick={toggleTheme}
          >
            {theme === 'dark'
              ? '☼'
              : '◐'}
          </button>
        </div>
      </div>

      <div className="admin-login">
        <span className="accent-text">
          {language === 'fa'
            ? 'مدیریت'
            : 'ADMIN'}
        </span>

        <h1>
          {language === 'fa'
            ? 'ورود'
            : 'Sign in'}
        </h1>

        <p>
          {language === 'fa'
            ? 'این بخش عمومی نیست.'
            : 'This area is not linked from the public site.'}
        </p>

        <form onSubmit={login}>
          <label>
            {language === 'fa'
              ? 'ایمیل'
              : 'Email'}

            <input
              type="email"
              value={email}
              onChange={(
                event,
              ) =>
                setEmail(
                  event.target
                    .value,
                )
              }
              autoComplete="username"
              required
            />
          </label>

          <label>
            {language === 'fa'
              ? 'رمز عبور'
              : 'Password'}

            <input
              type="password"
              value={password}
              onChange={(
                event,
              ) =>
                setPassword(
                  event.target
                    .value,
                )
              }
              autoComplete="current-password"
              required
            />
          </label>

          <button
            className="primary-button"
            disabled={
              loading ||
              !hasSupabase
            }
            type="submit"
          >
            {loading
              ? '…'
              : language === 'fa'
                ? 'ورود ↗'
                : 'Enter ↗'}
          </button>

          {error && (
            <div className="form-status error">
              {error}
            </div>
          )}
        </form>

        {!hasSupabase && (
          <small className="config-note">
            {language === 'fa'
              ? 'اتصال Supabase هنوز برای این Build تنظیم نشده است.'
              : 'Supabase is not configured for this build.'}
          </small>
        )}
      </div>
    </div>
  )
}