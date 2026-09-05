import { useEffect, useState } from 'react'
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

  const [session, setSession] = useState<boolean | undefined>(undefined)
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const client = supabase

    if (!client) {
      setSession(false)
      return
    }

    let active = true

    client.auth.getSession().then(async ({ data }) => {
      if (!active) return

      if (!data.session) {
        setSession(false)
        return
      }

      const { data: admin, error: adminError } = await client
        .from('admin_users')
        .select('user_id')
        .eq('user_id', data.session.user.id)
        .maybeSingle()

      if (!active) return

      if (adminError || !admin) {
        await client.auth.signOut()

        if (active) {
          setSession(false)
        }

        return
      }

      setSession(true)
    })

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return

      setSession(Boolean(nextSession))
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const client = supabase

    if (!client || !session) {
      return
    }

    let active = true

    async function loadMessages() {
      setError('')

      const {
        data,
        error: queryError,
      } = await client
        .from('messages')
        .select(
          'id, name, message, created_at, read',
        )
        .order('created_at', {
          ascending: false,
        })

      if (!active) return

      if (queryError) {
        setError(queryError.message)
        return
      }

      setMessages((data ?? []) as Message[])
    }

    void loadMessages()

    return () => {
      active = false
    }
  }, [session])

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
    return <Navigate to="/admin" replace />
  }

  const unreadCount =
    messages.filter((message) => !message.read).length

  const readCount =
    messages.filter((message) => message.read).length

  const normalizedSearch =
    search.trim().toLowerCase()

  const filteredMessages = messages.filter((message) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'unread'
          ? !message.read
          : message.read

    const matchesSearch =
      normalizedSearch.length === 0 ||
      message.name
        .toLowerCase()
        .includes(normalizedSearch) ||
      message.message
        .toLowerCase()
        .includes(normalizedSearch)

    return matchesFilter && matchesSearch
  })

  function formatDate(value: string) {
    const date = new Date(value)

    return new Intl.DateTimeFormat(
      language === 'fa' ? 'fa-IR' : 'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    ).format(date)
  }

  async function logout() {
    const client = supabase

    if (client) {
      await client.auth.signOut()
    }

    navigate('/admin', {
      replace: true,
    })
  }

  async function markRead(
    id: number,
    nextRead: boolean,
  ) {
    const client = supabase

    if (!client) {
      return
    }

    const {
      error: updateError,
    } = await client
      .from('messages')
      .update({
        read: nextRead,
      })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setMessages((current) =>
      current.map((message) =>
        message.id === id
          ? {
              ...message,
              read: nextRead,
            }
          : message,
      ),
    )
  }

  async function remove(id: number) {
    const client = supabase

    if (!client) {
      return
    }

    const confirmed = window.confirm(
      language === 'fa'
        ? 'این پیام حذف شود؟'
        : 'Delete this message?',
    )

    if (!confirmed) {
      return
    }

    const {
      error: deleteError,
    } = await client
      .from('messages')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setMessages((current) =>
      current.filter(
        (message) => message.id !== id,
      ),
    )
  }

  return (
    <div className="admin-page">

      <header className="admin-top">

        <a
          href="/"
          className="brand"
          aria-label="Home"
        >
          AA
        </a>

        <div className="admin-top-actions">

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
            className="admin-exit"
            onClick={logout}
            type="button"
          >
            {language === 'fa'
              ? 'خروج'
              : 'Sign out'}
          </button>

        </div>

      </header>


      <main className="admin-dashboard">

        <div className="admin-hero">

          <div>

            <span className="accent-text admin-kicker">
              ADMIN
            </span>

            <h1>
              {language === 'fa'
                ? 'پیام‌ها'
                : 'Messages'}
            </h1>

          </div>


          <div className="admin-summary">

            <div>
              <strong>
                {messages.length}
              </strong>

              <span>
                {language === 'fa'
                  ? 'همه'
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

          </div>

        </div>


        <div className="message-toolbar">

          <div className="message-filters">

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

              <span>
                {messages.length}
              </span>

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

              <span>
                {unreadCount}
              </span>

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

              <span>
                {readCount}
              </span>

            </button>

          </div>


          <label className="message-search">

            <span>
              {language === 'fa'
                ? 'جستجو'
                : 'Search'}
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder={
                language === 'fa'
                  ? 'نام یا متن پیام…'
                  : 'Name or message…'
              }
            />

          </label>

        </div>


        {error && (
          <div className="form-status error">
            {error}
          </div>
        )}


        {filteredMessages.length === 0 ? (

          <div className="message-empty">

            <div className="message-empty-number">
              00
            </div>

            <div>

              <strong>
                {messages.length === 0
                  ? language === 'fa'
                    ? 'هنوز پیامی نیست'
                    : 'No messages yet'
                  : language === 'fa'
                    ? 'نتیجه‌ای پیدا نشد'
                    : 'Nothing found'}
              </strong>

              <p>
                {messages.length === 0
                  ? language === 'fa'
                    ? 'وقتی کسی از سایت برایت پیامی بفرستد، اینجا نمایش داده می‌شود.'
                    : 'Messages sent from your website will appear here.'
                  : language === 'fa'
                    ? 'فیلتر یا عبارت جستجو را تغییر بده.'
                    : 'Try changing the filter or search term.'}
              </p>

            </div>

          </div>

        ) : (

          <div className="message-inbox">

            {filteredMessages.map(
              (message, index) => (

                <article
                  className={`inbox-message ${
                    message.read
                      ? 'is-read'
                      : 'is-unread'
                  }`}
                  key={message.id}
                >

                  <div className="inbox-index">
                    {String(index + 1).padStart(
                      2,
                      '0',
                    )}
                  </div>


                  <div className="inbox-main">

                    <div className="inbox-topline">

                      <div className="sender">

                        <span
                          className="sender-dot"
                          aria-hidden="true"
                        />

                        <strong>
                          {message.name}
                        </strong>

                        {!message.read && (
                          <span className="new-badge">
                            {language === 'fa'
                              ? 'جدید'
                              : 'NEW'}
                          </span>
                        )}

                      </div>


                      <time
                        dateTime={
                          message.created_at
                        }
                        className="message-date"
                      >
                        {formatDate(
                          message.created_at,
                        )}
                      </time>

                    </div>


                    <p className="inbox-text">
                      {message.message}
                    </p>


                    <div className="inbox-actions">

                      <button
                        type="button"
                        onClick={() =>
                          markRead(
                            message.id,
                            !message.read,
                          )
                        }
                      >
                        {message.read
                          ? language === 'fa'
                            ? 'خوانده‌نشده'
                            : 'Mark unread'
                          : language === 'fa'
                            ? 'خوانده شد'
                            : 'Mark as read'}
                      </button>


                      <button
                        type="button"
                        className="danger-action"
                        onClick={() =>
                          remove(message.id)
                        }
                      >
                        {language === 'fa'
                          ? 'حذف'
                          : 'Delete'}
                      </button>

                    </div>

                  </div>

                </article>

              ),
            )}

          </div>

        )}

      </main>

    </div>
  )
}