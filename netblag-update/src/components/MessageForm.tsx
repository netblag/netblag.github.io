import { useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { config, hasSupabase } from '../lib/config'
import { supabase } from '../lib/supabase'

/**
 * Contact form — updated version.
 *
 * Delivery pipeline (so the message actually reaches YOU):
 *   1. INSERT into Supabase `public.messages` (existing schema, RLS anon-insert)
 *      → permanent record, visible in your Admin Dashboard.
 *   2. Fire-and-forget POST to `config.notifyEndpoint` (e.g. Formspree)
 *      → instant e-mail notification to your inbox, no backend needed.
 *
 * If Supabase is not configured, the notify endpoint becomes the primary
 * channel so the message is never lost. Raw database errors are logged to
 * the console only — visitors always get a friendly message.
 */

type Props = {
  text: string
  language: 'en' | 'fa'
}

const NAME_MAX = 80
const MESSAGE_MAX = 2000

const COPY = {
  en: {
    name: 'Name',
    namePlaceholder: 'Your name',
    message: 'Message',
    messagePlaceholder: 'Write something...',
    send: 'Send ↗',
    sending: 'Sending…',
    sent: 'Message sent successfully.',
    errName: 'Please enter your name (max 80 characters).',
    errMessage: 'Please write a message (max 2000 characters).',
    errGeneric: 'Something went wrong. Please try again.',
    errConfig: 'Message service is not configured.',
  },
  fa: {
    name: 'نام',
    namePlaceholder: 'نام شما',
    message: 'پیام',
    messagePlaceholder: 'چیزی بنویسید...',
    send: 'ارسال ↗',
    sending: 'در حال ارسال…',
    sent: 'پیام با موفقیت ارسال شد.',
    errName: 'لطفاً نام خود را وارد کنید (حداکثر ۸۰ کاراکتر).',
    errMessage: 'لطفاً پیام خود را بنویسید (حداکثر ۲۰۰۰ کاراکتر).',
    errGeneric: 'مشکلی پیش آمد. لطفاً دوباره تلاش کنید.',
    errConfig: 'اتصال به سرویس پیام فعال نیست.',
  },
} as const

async function notifyOwner(name: string, message: string): Promise<boolean> {
  if (!config.notifyEndpoint) return false

  try {
    const response = await fetch(config.notifyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name,
        message,
        _subject: `New message on netblag.github.io from ${name}`,
      }),
    })
    return response.ok
  } catch (error) {
    console.error('Notify endpoint error:', error)
    return false
  }
}

export default function MessageForm({ text, language }: Props) {
  const t = COPY[language]

  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const honeypotRef = useRef<HTMLInputElement>(null)

  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle',
  )
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldError, setFieldError] = useState<'name' | 'message' | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending') return

    const cleanName = name.trim()
    const cleanMessage = message.trim()

    // Honeypot: bots fill it, humans never see it. Pretend success, store nothing.
    if (honeypotRef.current && honeypotRef.current.value.trim() !== '') {
      setName('')
      setMessage('')
      setStatus('sent')
      return
    }

    // Client-side validation mirroring the DB check constraints (1–80 / 1–2000).
    if (!cleanName || cleanName.length > NAME_MAX) {
      setFieldError('name')
      setStatus('error')
      setErrorMessage(t.errName)
      return
    }
    if (!cleanMessage || cleanMessage.length > MESSAGE_MAX) {
      setFieldError('message')
      setStatus('error')
      setErrorMessage(t.errMessage)
      return
    }

    setFieldError(null)

    if (!hasSupabase && !config.notifyEndpoint) {
      setStatus('error')
      setErrorMessage(t.errConfig)
      return
    }

    setStatus('sending')
    setErrorMessage('')

    let stored = false

    // 1) Permanent record in Supabase (protected by the existing RLS model).
    if (hasSupabase && supabase) {
      try {
        const { error } = await supabase
          .from('messages')
          .insert({ name: cleanName, message: cleanMessage })

        if (error) {
          console.error('Supabase message error:', error)
        } else {
          stored = true
        }
      } catch (error) {
        console.error('Message submission error:', error)
      }
    }

    // 2) Instant notification straight to your inbox.
    //    Primary channel when Supabase is missing; best-effort otherwise.
    const notified = await notifyOwner(cleanName, cleanMessage)

    if (stored || notified) {
      setName('')
      setMessage('')
      setStatus('sent')
    } else {
      setStatus('error')
      setErrorMessage(t.errGeneric)
    }
  }

  return (
    <div className="message-area">
      <p className="contact-copy">{text}</p>

      <form className="message-form" onSubmit={submit} noValidate>
        {/* Honeypot — hidden from real visitors and screen readers */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            width: 1,
            height: 1,
            overflow: 'hidden',
          }}
        >
          <label>
            Company
            <input
              ref={honeypotRef}
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>

        <label>
          <span>{t.name}</span>
          <input
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              if (fieldError === 'name') {
                setFieldError(null)
                setStatus('idle')
              }
            }}
            placeholder={t.namePlaceholder}
            maxLength={NAME_MAX}
            autoComplete="name"
            aria-invalid={fieldError === 'name' || undefined}
            required
          />
        </label>

        <label>
          <span>{t.message}</span>
          <textarea
            value={message}
            onChange={(event) => {
              setMessage(event.target.value)
              if (fieldError === 'message') {
                setFieldError(null)
                setStatus('idle')
              }
            }}
            placeholder={t.messagePlaceholder}
            maxLength={MESSAGE_MAX}
            rows={5}
            aria-invalid={fieldError === 'message' || undefined}
            required
          />
        </label>

        <div className="message-actions">
          <button type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? t.sending : t.send}
          </button>

          <span role="status" aria-live="polite">
            {status === 'sent' && (
              <span className="form-status success">{t.sent}</span>
            )}
            {status === 'error' && (
              <span className="form-status error">{errorMessage}</span>
            )}
          </span>
        </div>
      </form>
    </div>
  )
}
