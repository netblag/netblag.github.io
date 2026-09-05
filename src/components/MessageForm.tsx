import { useState } from 'react'
import type { FormEvent } from 'react'

import { hasSupabase } from '../lib/config'
import { supabase } from '../lib/supabase'

type Props = {
  text: string
  language: 'en' | 'fa'
}

export default function MessageForm({
  text,
  language,
}: Props) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  const [status, setStatus] = useState<
    'idle' | 'sending' | 'sent' | 'error'
  >('idle')

  const [errorMessage, setErrorMessage] =
    useState('')

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const cleanName = name.trim()
    const cleanMessage = message.trim()

    if (!cleanName || !cleanMessage) {
      return
    }

    if (!hasSupabase || !supabase) {
      setStatus('error')
      setErrorMessage(
        language === 'fa'
          ? 'اتصال به سرویس پیام فعال نیست.'
          : 'Message service is not configured.',
      )
      return
    }

    setStatus('sending')
    setErrorMessage('')

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          name: cleanName,
          message: cleanMessage,
        })

      if (error) {
        console.error(
          'Supabase message error:',
          error,
        )

        setStatus('error')

        setErrorMessage(
          language === 'fa'
            ? `ارسال انجام نشد: ${error.message}`
            : `Message could not be sent: ${error.message}`,
        )

        return
      }

      setName('')
      setMessage('')
      setStatus('sent')
    } catch (error) {
      console.error(
        'Message submission error:',
        error,
      )

      setStatus('error')

      setErrorMessage(
        language === 'fa'
          ? 'ارتباط با سرور برقرار نشد.'
          : 'Could not connect to the server.',
      )
    }
  }

  const sendLabel =
    language === 'fa'
      ? 'ارسال ↗'
      : 'Send ↗'

  return (
    <div className="message-area">

      <p className="contact-copy">
        {text}
      </p>

      <form
        className="message-form"
        onSubmit={submit}
      >

        <label>
          <span>
            {language === 'fa'
              ? 'نام'
              : 'Name'}
          </span>

          <input
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder={
              language === 'fa'
                ? 'نام شما'
                : 'Your name'
            }
            maxLength={80}
            autoComplete="name"
            required
          />
        </label>


        <label>
          <span>
            {language === 'fa'
              ? 'پیام'
              : 'Message'}
          </span>

          <textarea
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            placeholder={
              language === 'fa'
                ? 'چیزی بنویسید...'
                : 'Write something...'
            }
            maxLength={2000}
            rows={5}
            required
          />
        </label>


        <div className="message-actions">

          <button
            type="submit"
            disabled={status === 'sending'}
          >
            {status === 'sending'
              ? '…'
              : sendLabel}
          </button>


          {status === 'sent' && (
            <span className="form-status success">
              {language === 'fa'
                ? 'پیام ارسال شد.'
                : 'Message sent.'}
            </span>
          )}


          {status === 'error' && (
            <span className="form-status error">
              {errorMessage}
            </span>
          )}

        </div>

      </form>

    </div>
  )
}