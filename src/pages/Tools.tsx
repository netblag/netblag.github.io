import { Link } from 'react-router-dom'
import { useApp } from '../lib/app-context'
import { copy } from '../lib/i18n'
import { useMemo, useState } from 'react'
import Papa from 'papaparse'

export default function Tools() {
  const { language } = useApp()
  const t = copy[language]
  const [active, setActive] = useState<string | null>(null)
  return <div className="tool-page"><div className="tool-header"><div><Link className="back-link" to="/">{t.tools.back}</Link><h1>{t.tools.title}</h1><p>{t.tools.subtitle}</p></div><div className="tool-controls"><a href="/" className="tool-home">AA</a></div></div>{active ? <ToolWorkspace id={active} language={language} close={() => setActive(null)} /> : <div className="tool-list">{t.tools.items.map(([id, title, desc], i) => <button className="tool-item" key={id} onClick={() => setActive(id)}><span className="tool-number">{String(i + 1).padStart(2, '0')}</span><span><strong>{title}</strong><small>{desc}</small></span><b>↗</b></button>)}</div>}</div>
}

function ToolWorkspace({ id, language, close }: { id: string, language: 'en' | 'fa', close: () => void }) {
  const title = copy[language].tools.items.find(([key]) => key === id)?.[1] ?? id
  if (id === 'json') return <BasicTool title={title} close={close} language={language} />
  if (id === 'csv') return <CsvTool title={title} close={close} language={language} />
  if (id === 'text') return <TextTool title={title} close={close} language={language} />
  if (id === 'timestamp') return <TimestampTool title={title} close={close} language={language} />
  if (id === 'uuid') return <UuidTool title={title} close={close} language={language} />
  return <BasicTool title={title} close={close} language={language} placeholder={id === 'regex' ? 'Pattern + text' : id === 'markdown' ? '# Heading\n\nWrite Markdown here…' : 'Paste or type something…'} />
}

function Frame({ title, close, children, language }: { title: string, close: () => void, children: React.ReactNode, language: 'en' | 'fa' }) { return <section className="tool-workspace"><button className="back-link tool-back" onClick={close}>← {language === 'fa' ? 'ابزارها' : 'Tools'}</button><div className="workspace-top"><h2>{title}</h2><span>LOCAL</span></div>{children}</section> }
function BasicTool({ title, close, language, placeholder = 'Paste or type something…' }: { title: string, close: () => void, language: 'en' | 'fa', placeholder?: string }) { const [value, setValue] = useState(''); const [out, setOut] = useState(''); const isRegex = title.toLowerCase().includes('regex'); return <Frame title={title} close={close} language={language}><textarea className="tool-editor" value={value} onChange={e => setValue(e.target.value)} placeholder={placeholder} /><div className="tool-actions"><button onClick={() => { try { setOut(JSON.stringify(JSON.parse(value), null, 2)) } catch { setOut('Invalid JSON') } }}>{language === 'fa' ? 'اجرا' : 'Run'}</button><button onClick={() => { setValue(''); setOut('') }}>{language === 'fa' ? 'پاک کردن' : 'Clear'}</button></div><pre className="tool-output">{isRegex ? 'Regex tester workspace — wire your pattern and sample text here.' : out}</pre></Frame> }
function CsvTool({ title, close, language }: { title: string, close: () => void, language: 'en' | 'fa' }) { const [text, setText] = useState(''); const result = useMemo(() => { if (!text.trim()) return null; const parsed = Papa.parse<Record<string, string>>(text.trim(), { header: true, skipEmptyLines: true }); return { rows: parsed.data.length, fields: parsed.meta.fields?.length ?? 0, fieldsList: parsed.meta.fields ?? [] } }, [text]); return <Frame title={title} close={close} language={language}><textarea className="tool-editor" value={text} onChange={e => setText(e.target.value)} placeholder="name,age\nAshkan,21" />{result && <div className="stats-grid"><div><small>Rows</small><strong>{result.rows}</strong></div><div><small>Columns</small><strong>{result.fields}</strong></div><div className="wide"><small>Fields</small><strong>{result.fieldsList.join(' · ')}</strong></div></div>}</Frame> }
function TextTool({ title, close, language }: { title: string, close: () => void, language: 'en' | 'fa' }) { const [value, setValue] = useState(''); const words = value.trim() ? value.trim().split(/\s+/).length : 0; return <Frame title={title} close={close} language={language}><textarea className="tool-editor" value={value} onChange={e => setValue(e.target.value)} /><div className="stats-grid"><div><small>Characters</small><strong>{value.length}</strong></div><div><small>Words</small><strong>{words}</strong></div><div><small>Lines</small><strong>{value ? value.split('\n').length : 0}</strong></div></div></Frame> }
function TimestampTool({ title, close, language }: { title: string, close: () => void, language: 'en' | 'fa' }) { const [value, setValue] = useState(String(Math.floor(Date.now()/1000))); const date = new Date(Number(value) * 1000); return <Frame title={title} close={close} language={language}><div className="inline-form"><input value={value} onChange={e => setValue(e.target.value)} /><span>{Number.isFinite(date.getTime()) ? date.toLocaleString() : '—'}</span></div></Frame> }
function UuidTool({ title, close, language }: { title: string, close: () => void, language: 'en' | 'fa' }) { const [value, setValue] = useState(''); return <Frame title={title} close={close} language={language}><div className="uuid-box">{value || '—'}</div><button className="primary-button" onClick={() => setValue(crypto.randomUUID())}>{language === 'fa' ? 'ساخت UUID' : 'Generate UUID'}</button></Frame> }
