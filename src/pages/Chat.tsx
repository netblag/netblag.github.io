import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../lib/app-context'
import { config } from '../lib/config'

export default function Chat() {
  const { language, toggleLanguage, theme, toggleTheme } = useApp()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{role: 'user'|'assistant', text: string}[]>([])
  const [busy, setBusy] = useState(false)
  async function send() { const text = input.trim(); if (!text || busy) return; setMessages(m => [...m, {role:'user', text}]); setInput(''); setBusy(true); try { if (!config.chatEndpoint) throw new Error('No endpoint'); const response = await fetch(config.chatEndpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ message: text }) }); const data = await response.json(); setMessages(m => [...m, {role:'assistant', text: data.text ?? 'No response'}]); } catch { setMessages(m => [...m, {role:'assistant', text: language === 'fa' ? 'اتصال چت هنوز تنظیم نشده است. API را از Backend متصل کن.' : 'The chat backend is not connected yet. Add the server endpoint in your environment.'}]); } finally { setBusy(false) } }
  return <div className="chat-page"><header className="header"><Link className="brand" to="/">AA</Link><nav className="nav"><Link to="/tools">Tools</Link><button className="circle-button" onClick={toggleLanguage}>{language === 'en' ? 'FA' : 'EN'}</button><button className="circle-button" onClick={toggleTheme}>{theme === 'dark' ? '☼' : '◐'}</button></nav></header><main className="chat-shell"><div className="chat-head"><div><span className="accent-text">CHAT</span><h1>{language === 'fa' ? 'گفت‌وگو' : 'Conversation'}</h1></div><span className="chat-note">{language === 'fa' ? 'Backend-ready' : 'Backend-ready'}</span></div><div className="chat-messages">{messages.length === 0 ? <div className="chat-empty">{language === 'fa' ? 'یک سؤال بپرس.' : 'Ask something.'}</div> : messages.map((m, i) => <div className={`chat-message ${m.role}`} key={i}><span>{m.role === 'user' ? 'YOU' : 'AI'}</span><p>{m.text}</p></div>)}</div><div className="chat-input-wrap"><textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder={language === 'fa' ? 'پیامت را بنویس...' : 'Type a message...'} /><button onClick={send} disabled={busy}>↗</button></div></main></div>
}
