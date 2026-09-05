import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import type { SupabaseClient } from '@supabase/supabase-js'

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

function getClient(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  return supabase
}

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
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    if (!supabase) {
      setSession(false)
      return
    }

    const client = getClient()

    let active = true

    async function checkAdmin() {
      try {
        const {
          data: sessionData,
          error: sessionError,
        } = await client.auth.getSession()

        if (!active) return

        if (sessionError || !sessionData.session) {
          setSession(false)
          return
        }

        const {
          data: admin,
          error: adminError,
        } = await client
          .from('admin_users')
          .select('user_id')
          .eq(
            'user_id',
            sessionData.session.user.id,
          )
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
      } catch (caught) {
        if (!active) return

        setSession(false)

        setError(
          caught instanceof Error
            ? caught.message
            : 'Authentication error.',
        )
      }
    }

    void checkAdmin()

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!active) return

        setSession(Boolean(nextSession))
      },
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!supabase || !session) {
      return
    }

    const client = getClient()

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

      setMessages(
        (data ?? []) as Message[],
      )
    }

    void loadMessages()

    return () => {
      active = false
    }
  }, [session])

  const unreadCount = useMemo(
    () =>
      messages.filter(
        (message) => !message.read,
      ).length,
    [messages],
  )

  const readCount =
    messages.length - unreadCount

  const visibleMessages = useMemo(() => {
    const term =
      search.trim().toLocaleLowerCase()

    return messages.filter((message) => {
      const filterMatch =
        filter === 'all' ||
        (filter === 'unread' && !message.read) ||
        (filter === 'read' && message.read)

      if (!filterMatch) {
        return false
      }

      if (!term) {
        return true
      }

      return (
        message.name
          .toLocaleLowerCase()
          .includes(term) ||
        message.message
          .toLocaleLowerCase()
          .includes(term)
      )
    })
  }, [filter, messages, search])

  function formatDate(
    value: string,
  ) {
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
      const client = getClient()
      await client.auth.signOut()
    }

    navigate('/admin', {
      replace: true,
    })
  }

  async function toggleRead(
    id: number,
    nextRead: boolean,
  ) {
    if (!supabase) {
      return
    }

    const client = getClient()

    setBusyId(id)
    setError('')

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
      setBusyId(null)
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

    setBusyId(null)
  }

  async function removeMessage(
    id: number,
  ) {
    if (!supabase) {
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

    const client = getClient()

    setBusyId(id)
    setError('')

    const {
      error: deleteError,
    } = await client
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
        (message) =>
          message.id !== id,
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
            {language === 'en'
              ? 'FA'
              : 'EN'}
          </button>

          <button
            className="circle-button"
            onClick={toggleTheme}
            type="button"
          >
            {theme === 'dark'
              ? '☼'
              : '◐'}
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

        <section className="admin-hero">

          <div>

            <span className="accent-text admin-kicker">
              ADMIN
            </span>

            <h1>
              {language === 'fa'
                ? 'پیام‌ها'
                : 'Messages'}
            </h1>

            <p className="admin-subtitle">
              {language === 'fa'
                ? 'پیام‌های دریافتی سایت، یک‌جا و مرتب.'
                : 'Everything people send you, in one place.'}
            </p>

          </div>


          <div className="admin-stats">

            <div className="admin-stat">
              <strong>
                {messages.length}
              </strong>

              <span>
                {language === 'fa'
                  ? 'همه'
                  : 'Total'}
              </span>
            </div>

            <div className="admin-stat">
              <strong>
                {unreadCount}
              </strong>

              <span>
                {language === 'fa'
                  ? 'جدید'
                  : 'Unread'}
              </span>
            </div>

            <div className="admin-stat">
              <strong>
                {readCount}
              </strong>

              <span>
                {language === 'fa'
                  ? 'خوانده‌شده'
                  : 'Read'}
              </span>
            </div>

          </div>

        </section>


        <section className="message-toolbar">

          <div className="message-filters">

            <button
              className={
                filter === 'all'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setFilter('all')
              }
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
                setSearch(
                  event.target.value,
                )
              }
              placeholder={
                language === 'fa'
                  ? 'نام یا متن پیام…'
                  : 'Name or message…'
              }
            />

          </label>

        </section>


        {error && (
          <div className="form-status error admin-error">
            {error}
          </div>
        )}


        {visibleMessages.length === 0 ? (

          <section className="message-empty">

            <span className="message-empty-number">
              00
            </span>

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
                    : 'Messages sent from the public site will appear here.'
                  : language === 'fa'
                    ? 'فیلتر یا عبارت جستجو را تغییر بده.'
                    : 'Try a different filter or search term.'}
              </p>

            </div>

          </section>

        ) : (

          <section className="message-inbox">

            {visibleMessages.map(
              (message, index) => {

                const isBusy =
                  busyId === message.id

                return (
                  <article
                    key={message.id}
                    className={[
                      'inbox-message',
                      message.read
                        ? 'is-read'
                        : 'is-unread',
                    ].join(' ')}
                  >

                    <div className="inbox-index">
                      {String(
                        index + 1,
                      ).padStart(2, '0')}
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
                          className="message-date"
                          dateTime={
                            message.created_at
                          }
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
                          disabled={isBusy}
                          onClick={() =>
                            toggleRead(
                              message.id,
                              !message.read,
                            )
                          }
                          type="button"
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
                          disabled={isBusy}
                          className="danger-action"
                          onClick={() =>
                            removeMessage(
                              message.id,
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

          </section>

        )}

      </main>

    </div>
  )
}