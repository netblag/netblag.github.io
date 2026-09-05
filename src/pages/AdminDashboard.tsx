import { useCallback, useEffect, useState } from 'react'

import { Navigate, useNavigate } from 'react-router-dom'

import { supabase } from '../lib/supabase'
import { useApp } from '../lib/app-context'

type Message = {
  id: string
  name: string
  message: string
  is_read: boolean
  created_at: string
}

export default function AdminDashboard() {
  const {
    language,
    toggleLanguage,
    theme,
    toggleTheme,
  } = useApp()

  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState('')

  const loadMessages = useCallback(async () => {
    if (!supabase) {
      setError(
        language === 'fa'
          ? 'Supabase تنظیم نشده است.'
          : 'Supabase is not configured.',
      )
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        navigate('/admin', { replace: true })
        return
      }

      const { data, error: messagesError } =
        await supabase
          .from('messages')
          .select(
            'id, name, message, is_read, created_at',
          )
          .order('created_at', {
            ascending: false,
          })

      if (messagesError) {
        throw messagesError
      }

      setMessages((data ?? []) as Message[])
    } catch {
      setError(
        language === 'fa'
          ? 'دریافت پیام‌ها ناموفق بود.'
          : 'Could not load messages.',
      )
    } finally {
      setLoading(false)
    }
  }, [language, navigate])

  useEffect(() => {
    void loadMessages()
  }, [loadMessages])

  async function markAsRead(id: string) {
    if (!supabase) return

    const { error: updateError } =
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', id)

    if (updateError) {
      setError(
        language === 'fa'
          ? 'تغییر وضعیت پیام ناموفق بود.'
          : 'Could not update the message.',
      )
      return
    }

    setMessages((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, is_read: true }
          : item,
      ),
    )
  }

  async function deleteMessage(id: string) {
    if (!supabase) return

    const { error: deleteError } =
      await supabase
        .from('messages')
        .delete()
        .eq('id', id)

    if (deleteError) {
      setError(
        language === 'fa'
          ? 'حذف پیام ناموفق بود.'
          : 'Could not delete the message.',
      )
      return
    }

    setMessages((current) =>
      current.filter((item) => item.id !== id),
    )
  }

  async function logout() {
    if (supabase) {
      await supabase.auth.signOut()
    }

    navigate('/admin', { replace: true })
  }

  if (!supabase) {
    return (
      <div className="admin-page">
        <div className="admin-login">
          <span className="accent-text">ADMIN</span>

          <h1>
            {language === 'fa'
              ? 'اتصال برقرار نیست'
              : 'Not configured'}
          </h1>

          <p>
            {language === 'fa'
              ? 'Supabase برای این Build تنظیم نشده است.'
              : 'Supabase is not configured for this build.'}
          </p>

          <button
            className="primary-button"
            onClick={() => navigate('/')}
            type="button"
          >
            {language === 'fa'
              ? 'بازگشت'
              : 'Back'}
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="center-state">
        {language === 'fa'
          ? 'در حال دریافت…'
          : 'Loading…'}
      </div>
    )
  }

  return (
    <div className="admin-page">
      <header className="admin-top">
        <a href="/" className="brand">
          AA
        </a>

        <div className="admin-actions">
          <button
            className="circle-button"
            onClick={toggleLanguage}
            type="button"
          >
            {language === 'en' ? 'FA' : 'EN'}
          </button>

          <button
            className="circle-button"
            onClick={toggleTheme}
            type="button"
          >
            {theme === 'dark' ? '☼' : '◐'}
          </button>

          <button
            className="admin-logout"
            onClick={logout}
            type="button"
          >
            {language === 'fa'
              ? 'خروج'
              : 'Sign out'}
          </button>
        </div>
      </header>

      <main className="admin-content">
        <div className="admin-heading">
          <div>
            <span className="accent-text">ADMIN</span>

            <h1>
              {language === 'fa'
                ? 'پیام‌ها'
                : 'Messages'}
            </h1>
          </div>

          <div className="admin-count">
            {messages.length}
          </div>
        </div>

        {error && (
          <div className="form-status error">
            {error}
          </div>
        )}

        {messages.length === 0 ? (
          <div className="empty-state">
            {language === 'fa'
              ? 'هنوز پیامی دریافت نشده.'
              : 'No messages yet.'}
          </div>
        ) : (
          <div className="admin-messages">
            {messages.map((item) => (
              <article
                className={`admin-message ${
                  item.is_read ? 'read' : 'unread'
                }`}
                key={item.id}
              >
                <div className="admin-message-head">
                  <strong>{item.name}</strong>

                  <time dateTime={item.created_at}>
                    {new Date(
                      item.created_at,
                    ).toLocaleString(
                      language === 'fa'
                        ? 'fa-IR'
                        : 'en-US',
                    )}
                  </time>
                </div>

                <p>{item.message}</p>

                <div className="admin-message-actions">
                  {!item.is_read && (
                    <button
                      onClick={() =>
                        markAsRead(item.id)
                      }
                      type="button"
                    >
                      {language === 'fa'
                        ? 'خوانده شد'
                        : 'Mark as read'}
                    </button>
                  )}

                  <button
                    onClick={() =>
                      deleteMessage(item.id)
                    }
                    type="button"
                  >
                    {language === 'fa'
                      ? 'حذف'
                      : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}