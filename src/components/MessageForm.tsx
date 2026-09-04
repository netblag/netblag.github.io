import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { hasSupabase } from '../lib/config'

export default function MessageForm({ text, language }: { text: string, language: 'en' | 'fa' }) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !message.trim()) return
    setStatus('sending')
    if (!hasSupabase || !supabase) {
      setStatus('error')
      return
    }
    const { error } = await supabase.from('messages').insert({ name: name.trim(), message: message.trim() })
    if (error) setStatus('error')
    else { setStatus('sent'); setName(''); setMessage('') }
  }

  const done = language === 'fa' ? 'پیام ارسال شد.' : 'Message sent.'
  const fail = language === 'fa' ? 'ارسال انجام نشد.' : 'Something went wrong.'
  const send = language === 'fa' ? 'ارسال ↗' : 'Send ↗'

  return <div className="message-area">
    <p className="contact-copy">{text}</p>
    <form className="message-form" onSubmit={submit}>
      <label><span>{language === 'fa' ? 'نام' : 'Name'}</span><input value={name} onChange={e => setName(e.target.value)} placeholder={language === 'fa' ? 'نام شما' : 'Your name'} maxLength={80} required /></label>
      <label><span>{language === 'fa' ? 'پیام' : 'Message'}</span><textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={language === 'fa' ? 'چیزی بنویسید...' : 'Write something...'} maxLength={2000} rows={5} required /></label>
      <div className="message-actions"><button type="submit" disabled={status === 'sending'}>{status === 'sending' ? '…' : send}</button>{status === 'sent' && <span className="form-status success">{done}</span>}{status === 'error' && <span className="form-status error">{fail}</span>}</div>
    </form>
  </div>
}
