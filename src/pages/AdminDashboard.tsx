import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { supabase } from '../lib/supabase'
import { useApp } from '../lib/app-context'

type Message = {
  id: number
  name: string
  message: string
  created_at: string
  read: boolean
}

type Filter = 'all' | 'unread' | 'read'

export default function AdminDashboard() {
  const {
    language,
    toggleLanguage,
    theme,
    toggleTheme,
  } = useApp()

  const navigate = useNavigate()

  const [session, setSession] = useState<boolean | undefined>(
    undefined,
  )

  const [messages, setMessages] = useState<Message[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    if (!supabase) {
      setSession(false)
      return
    }

    const client = supabase
    let mounted = true

    async function checkAdmin() {
      try {
        const { data, error: sessionError } =
          await client.auth.getSession()

        if (!mounted) return

        if (sessionError || !data.session) {
          setSession(false)
          return
        }

        const { data: admin, error: adminError } =
          await client
            .from('admin_users')
            .select('user_id')
            .eq(
              'user_id',
              data.session.user.id,
            )
            .maybeSingle()

        if (!mounted) return

        if (adminError || !admin) {
          await client.auth.signOut()
          setSession(false)
          return
        }

        setSession(true)
      } catch {
        if (mounted) {
          setSession(false)
        }
      }
    }

    void checkAdmin()

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) return

        setSession(Boolean(nextSession))
      },
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!supabase || !session) {
      return
    }

    const client = supabase
    let mounted = true

    async function loadMessages() {
      setError('')

      const { data, error: queryError } =
        await client
          .from('messages')
          .select(
            'id, name, message, created_at, read',
          )
          .order('created_at', {
            ascending: false,
          })

      if (!mounted) return

      if (queryError) {
        setError(queryError.message)
        return
      }

      setMessages(
        (data ?? []) as Message[],
      )
    }

    void loadMessages()

    return () => {
      mounted = false
    }
  }, [session])

  const unreadCount = useMemo(
    () =>
      messages.filter(
        (item) => !item.read,
      ).length,
    [messages],
  )

  const readCount =
    messages.length - unreadCount

  const visibleMessages = useMemo(() => {
    const term =
      search.trim().toLocaleLowerCase()

    return messages.filter((item) => {
      const filterMatches =
        filter === 'all' ||
        (filter === 'unread' && !item.read) ||
        (filter === 'read' && item.read)

      if (!filterMatches) {
        return false
      }

      if (!term) {
        return true
      }

      return (
        item.name
          .toLocaleLowerCase()
          .includes(term) ||
        item.message
          .toLocaleLowerCase()
          .includes(term)
      )
    })
  }, [filter, messages, search])

  function formatDate(value: string) {
    return new Intl.DateTimeFormat(
      language === 'fa'
        ? 'fa-IR'
        : 'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    ).format(new Date(value))
  }

  async function logout() {
    if (supabase) {
      await supabase.auth.signOut()
    }

    navigate('/admin', {
      replace: true,
    })
  }

  async function toggleRead(
    id: number,
    value: boolean,
  ) {
    if (!supabase) return

    setBusyId(id)

    const { error: updateError } =
      await supabase
        .from('messages')
        .update({
          read: value,
        })
        .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setBusyId(null)
      return
    }

    setMessages((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              read: value,
            }
          : item,
      ),
    )

    setBusyId(null)
  }

  async function removeMessage(id: number) {
    if (!supabase) return

    const confirmed = window.confirm(
      language === 'fa'
        ? 'این پیام حذف شود؟'
        : 'Delete this message?',
    )

    if (!confirmed) return

    setBusyId(id)

    const { error: deleteError } =
      await supabase
        .from('messages')
        .delete()
        .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      setBusyId(null)
      return
    }

    setMessages((current) =>
      current.filter(
        (item) => item.id !== id,
      ),
    )

    setBusyId(null)
  }

  if (session === undefined) {
    return (
      <div className="center-state">
        {language === 'fa'
          ? 'در حال بارگذاری…'
          : 'Loading…'}
      </div>
    )
  }

  if (!session) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    )
  }

  return (
    <div className="admin-shell">

      <header className="admin-navbar">

        <a
          href="/"
          className="admin-brand"
        >
          AA
        </a>

        <div className="admin-navbar-actions">

          <button
            className="admin-circle-button"
            onClick={toggleLanguage}
            type="button"
          >
            {language === 'en'
              ? 'FA'
              : 'EN'}
          </button>

          <button
            className="admin-circle-button"
            onClick={toggleTheme}
            type="button"
          >
            {theme === 'dark'
              ? '☼'
              : '◐'}
          </button>

          <button
            className="admin-signout"
            onClick={logout}
            type="button"
          >
            {language === 'fa'
              ? 'خروج'
              : 'Sign out'}
          </button>

        </div>

      </header>


      <main className="admin-main">

        <div className="admin-title-row">

          <div>

            <span className="admin-eyebrow">
              ADMIN
            </span>

            <h1>
              {language === 'fa'
                ? 'پیام‌ها'
                : 'Messages'}
            </h1>

            <p>
              {language === 'fa'
                ? 'پیام‌های دریافتی سایت، در یک نگاه.'
                : 'Messages from your website, in one place.'}
            </p>

          </div>


          <div className="admin-metrics">

            <div>
              <strong>
                {messages.length}
              </strong>

              <span>
                {language === 'fa'
                  ? 'کل'
                  : 'Total'}
              </span>
            </div>

            <div>
              <strong>
                {unreadCount}
              </strong>

              <span>
                {language === 'fa'
                  ? 'جدید'
                  : 'Unread'}
              </span>
            </div>

            <div>
              <strong>
                {readCount}
              </strong>

              <span>
                {language === 'fa'
                  ? 'خوانده'
                  : 'Read'}
              </span>
            </div>

          </div>

        </div>


        <div className="admin-toolbar">

          <div className="admin-filters">

            <button
              className={
                filter === 'all'
                  ? 'active'
                  : ''
              }
              onClick={() => setFilter('all')}
              type="button"
            >
              {language === 'fa'
                ? 'همه'
                : 'All'}

              <b>{messages.length}</b>
            </button>

            <button
              className={
                filter === 'unread'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setFilter('unread')
              }
              type="button"
            >
              {language === 'fa'
                ? 'جدید'
                : 'Unread'}

              <b>{unreadCount}</b>
            </button>

            <button
              className={
                filter === 'read'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setFilter('read')
              }
              type="button"
            >
              {language === 'fa'
                ? 'خوانده‌شده'
                : 'Read'}

              <b>{readCount}</b>
            </button>

          </div>


          <input
            className="admin-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder={
              language === 'fa'
                ? 'جستجوی نام یا پیام…'
                : 'Search name or message…'
            }
          />

        </div>


        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}


        {visibleMessages.length === 0 ? (

          <div className="admin-empty">

            <span>00</span>

            <div>

              <h2>
                {messages.length === 0
                  ? language === 'fa'
                    ? 'هنوز پیامی نیست'
                    : 'No messages yet'
                  : language === 'fa'
                    ? 'نتیجه‌ای پیدا نشد'
                    : 'Nothing found'}
              </h2>

              <p>
                {messages.length === 0
                  ? language === 'fa'
                    ? 'هر پیامی که از فرم سایت دریافت کنی، اینجا نمایش داده می‌شود.'
                    : 'Messages sent from your website will appear here.'
                  : language === 'fa'
                    ? 'عبارت جستجو یا فیلتر را تغییر بده.'
                    : 'Try another search or filter.'}
              </p>

            </div>

          </div>

        ) : (

          <div className="admin-inbox">

            {visibleMessages.map(
              (item, index) => {

                const busy =
                  busyId === item.id

                return (
                  <article
                    key={item.id}
                    className={
                      item.read
                        ? 'admin-message'
                        : 'admin-message new'
                    }
                  >

                    <div className="admin-message-number">
                      {String(
                        index + 1,
                      ).padStart(2, '0')}
                    </div>


                    <div className="admin-message-body">

                      <div className="admin-message-meta">

                        <div className="admin-sender">

                          <span />

                          <strong>
                            {item.name}
                          </strong>

                          {!item.read && (
                            <em>
                              {language === 'fa'
                                ? 'جدید'
                                : 'NEW'}
                            </em>
                          )}

                        </div>


                        <time>
                          {formatDate(
                            item.created_at,
                          )}
                        </time>

                      </div>


                      <p className="admin-message-text">
                        {item.message}
                      </p>


                      <div className="admin-message-actions">

                        <button
                          disabled={busy}
                          onClick={() =>
                            toggleRead(
                              item.id,
                              !item.read,
                            )
                          }
                          type="button"
                        >
                          {item.read
                            ? language === 'fa'
                              ? 'خوانده‌نشده'
                              : 'Mark unread'
                            : language === 'fa'
                              ? 'خوانده شد'
                              : 'Mark as read'}
                        </button>


                        <button
                          className="delete"
                          disabled={busy}
                          onClick={() =>
                            removeMessage(
                              item.id,
                            )
                          }
                          type="button"
                        >
                          {language === 'fa'
                            ? 'حذف'
                            : 'Delete'}
                        </button>

                      </div>

                    </div>

                  </article>
                )
              },
            )}

          </div>

        )}

      </main>

    </div>
  )
}