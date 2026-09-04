import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../lib/app-context'

type Message = { id: number; name: string; message: string; created_at: string; read: boolean }

export default function AdminDashboard() {
  const { language, toggleLanguage, theme, toggleTheme } = useApp()
  const [session, setSession] = useState<unknown>(undefined)
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState('')
  const navigate = useNavigate()
  useEffect(() => { if (!supabase) { setSession(null); return } supabase.auth.getSession().then(({ data }) => setSession(data.session)); const { data: auth } = supabase.auth.onAuthStateChange((_e, s) => setSession(s)); return () => auth.subscription.unsubscribe() }, [])
  useEffect(() => { if (!supabase || !session) return; supabase.from('messages').select('*').order('created_at', { ascending: false }).then(({ data, error }) => { if (error) setError(error.message); else setMessages((data ?? []) as Message[]) }) }, [session])
  if (session === undefined) return <div className="center-state">Loading…</div>
  if (!session) return <Navigate to="/admin" replace />
  async function logout() { await supabase?.auth.signOut(); navigate('/admin') }
  async function markRead(id: number, read: boolean) { if (!supabase) return; await supabase.from('messages').update({ read }).eq('id', id); setMessages(current => current.map(m => m.id === id ? { ...m, read } : m)) }
  async function remove(id: number) { if (!supabase) return; await supabase.from('messages').delete().eq('id', id); setMessages(current => current.filter(m => m.id !== id)) }
  return <div className="admin-page"><div className="admin-top"><a href="/" className="brand">AA</a><div><button className="circle-button" onClick={toggleLanguage}>{language === 'en' ? 'FA' : 'EN'}</button><button className="circle-button" onClick={toggleTheme}>{theme === 'dark' ? '☼' : '◐'}</button><button className="ghost-button" onClick={logout}>{language === 'fa' ? 'خروج' : 'Sign out'}</button></div></div><main className="admin-dashboard"><div className="admin-heading"><div><span className="accent-text">ADMIN</span><h1>{language === 'fa' ? 'پیام‌ها' : 'Messages'}</h1></div><span className="count">{messages.length}</span></div>{error && <div className="form-status error">{error}</div>}<div className="message-list">{messages.length === 0 ? <div className="empty-state">{language === 'fa' ? 'پیامی نیست.' : 'No messages yet.'}</div> : messages.map(message => <article className={`message-card ${message.read ? '' : 'unread'}`} key={message.id}><div className="message-card-head"><strong>{message.name}</strong><span>{new Date(message.created_at).toLocaleString()}</span></div><p>{message.message}</p><div className="message-card-actions"><button onClick={() => markRead(message.id, !message.read)}>{message.read ? (language === 'fa' ? 'خوانده‌نشده' : 'Mark unread') : (language === 'fa' ? 'خوانده شد' : 'Mark read')}</button><button onClick={() => remove(message.id)}>{language === 'fa' ? 'حذف' : 'Delete'}</button></div></article>)}</div></main></div>
}
