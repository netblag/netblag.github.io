import {
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { Link } from 'react-router-dom'
import Papa from 'papaparse'

import { useApp } from '../lib/app-context'
import { copy } from '../lib/i18n'

type Language = 'en' | 'fa'

type Tool = {
  id: string
  title: string
  description: string
}

function text(
  language: Language,
  en: string,
  fa: string,
) {
  return language === 'fa' ? fa : en
}

function ToolFrame({
  title,
  language,
  onBack,
  children,
}: {
  title: string
  language: Language
  onBack: () => void
  children: ReactNode
}) {
  return (
    <section className="tool-workspace">
      <button
        type="button"
        className="back-link tool-back"
        onClick={onBack}
      >
        {text(language, '← Tools', '← ابزارها')}
      </button>

      <div className="workspace-top">
        <h2>{title}</h2>
        <span>
          {text(language, 'LOCAL', 'محلی')}
        </span>
      </div>

      {children}
    </section>
  )
}

export default function Tools() {
  const { language } = useApp()
  const t = copy[language]

  const [activeTool, setActiveTool] =
    useState<string | null>(null)

  const tools: Tool[] = t.tools.items.map(
    ([id, title, description]) => ({
      id,
      title,
      description,
    }),
  )

  if (activeTool) {
    const selected = tools.find(
      (tool) => tool.id === activeTool,
    )

    if (selected) {
      return (
        <div className="tool-page">
          <ToolWorkspace
            tool={selected}
            language={language}
            onBack={() => setActiveTool(null)}
          />
        </div>
      )
    }
  }

  return (
    <div className="tool-page">
      <div className="tool-header">
        <div>
          <Link
            className="back-link"
            to="/"
          >
            {t.tools.back}
          </Link>

          <h1>{t.tools.title}</h1>

          <p>{t.tools.subtitle}</p>
        </div>

        <div className="tool-controls">
          <Link
            className="tool-home"
            to="/"
          >
            AA
          </Link>
        </div>
      </div>

      <div className="tool-list">
        {tools.map((tool, index) => (
          <button
            type="button"
            className="tool-item"
            key={tool.id}
            onClick={() =>
              setActiveTool(tool.id)
            }
          >
            <span className="tool-number">
              {String(index + 1).padStart(
                2,
                '0',
              )}
            </span>

            <span className="tool-item-main">
              <strong>{tool.title}</strong>

              <small>
                {tool.description}
              </small>
            </span>

            <b className="tool-arrow">
              ↗
            </b>
          </button>
        ))}
      </div>
    </div>
  )
}

function ToolWorkspace({
  tool,
  language,
  onBack,
}: {
  tool: Tool
  language: Language
  onBack: () => void
}) {
  switch (tool.id) {
    case 'json':
      return (
        <JsonTool
          title={tool.title}
          language={language}
          onBack={onBack}
        />
      )

    case 'csv':
      return (
        <CsvTool
          title={tool.title}
          language={language}
          onBack={onBack}
        />
      )

    case 'regex':
      return (
        <RegexTool
          title={tool.title}
          language={language}
          onBack={onBack}
        />
      )

    case 'markdown':
      return (
        <MarkdownTool
          title={tool.title}
          language={language}
          onBack={onBack}
        />
      )

    case 'text':
      return (
        <TextTool
          title={tool.title}
          language={language}
          onBack={onBack}
        />
      )

    case 'timestamp':
      return (
        <TimestampTool
          title={tool.title}
          language={language}
          onBack={onBack}
        />
      )

    case 'base64':
      return (
        <Base64Tool
          title={tool.title}
          language={language}
          onBack={onBack}
        />
      )

    case 'uuid':
      return (
        <UuidTool
          title={tool.title}
          language={language}
          onBack={onBack}
        />
      )

    default:
      return null
  }
}

/* =========================================================
   JSON
   ========================================================= */

function JsonTool({
  title,
  language,
  onBack,
}: {
  title: string
  language: Language
  onBack: () => void
}) {
  const [input, setInput] =
    useState('')

  const [output, setOutput] =
    useState('')

  const [error, setError] =
    useState('')

  function formatJson() {
    try {
      const parsed = JSON.parse(input)

      setOutput(
        JSON.stringify(
          parsed,
          null,
          2,
        ),
      )

      setError('')
    } catch (err) {
      setOutput('')

      setError(
        err instanceof Error
          ? err.message
          : text(
              language,
              'Invalid JSON.',
              'JSON نامعتبر است.',
            ),
      )
    }
  }

  function minifyJson() {
    try {
      const parsed = JSON.parse(input)

      setOutput(
        JSON.stringify(parsed),
      )

      setError('')
    } catch (err) {
      setOutput('')

      setError(
        err instanceof Error
          ? err.message
          : text(
              language,
              'Invalid JSON.',
              'JSON نامعتبر است.',
            ),
      )
    }
  }

  function clear() {
    setInput('')
    setOutput('')
    setError('')
  }

  return (
    <ToolFrame
      title={title}
      language={language}
      onBack={onBack}
    >
      <textarea
        className="tool-editor"
        value={input}
        onChange={(event) =>
          setInput(event.target.value)
        }
        placeholder='{"name":"Ashkan","role":"Developer"}'
        spellCheck={false}
      />

      <div className="tool-actions">
        <button
          type="button"
          onClick={formatJson}
        >
          {text(
            language,
            'Format',
            'مرتب‌سازی',
          )}
        </button>

        <button
          type="button"
          onClick={minifyJson}
        >
          {text(
            language,
            'Minify',
            'فشرده‌سازی',
          )}
        </button>

        <button
          type="button"
          onClick={clear}
        >
          {text(
            language,
            'Clear',
            'پاک کردن',
          )}
        </button>
      </div>

      {error && (
        <div className="tool-error">
          {error}
        </div>
      )}

      <pre className="tool-output">
        {output}
      </pre>
    </ToolFrame>
  )
}

/* =========================================================
   CSV
   ========================================================= */

function CsvTool({
  title,
  language,
  onBack,
}: {
  title: string
  language: Language
  onBack: () => void
}) {
  const [input, setInput] =
    useState('')

  const [rows, setRows] =
    useState<string[][]>([])

  const [error, setError] =
    useState('')

  function analyzeCsv() {
    if (!input.trim()) {
      setRows([])
      setError(
        text(
          language,
          'Paste CSV data first.',
          'ابتدا داده CSV را وارد کنید.',
        ),
      )
      return
    }

    const result = Papa.parse(input, {
      skipEmptyLines: true,
    })

    if (result.errors.length > 0) {
      setError(
        result.errors[0]?.message ??
          text(
            language,
            'Could not parse CSV.',
            'خواندن CSV ناموفق بود.',
          ),
      )
      return
    }

    const parsedRows = result.data.map(
      (row) =>
        Array.isArray(row)
          ? row.map((cell) =>
              String(cell ?? ''),
            )
          : [],
    )

    setRows(parsedRows)
    setError('')
  }

  const headers = rows[0] ?? []
  const body = rows.slice(1)

  return (
    <ToolFrame
      title={title}
      language={language}
      onBack={onBack}
    >
      <textarea
        className="tool-editor"
        value={input}
        onChange={(event) =>
          setInput(event.target.value)
        }
        placeholder={
          'name,age,role\nAshkan,21,Developer\nSara,24,Designer'
        }
        spellCheck={false}
      />

      <div className="tool-actions">
        <button
          type="button"
          onClick={analyzeCsv}
        >
          {text(
            language,
            'Analyze',
            'تحلیل',
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setInput('')
            setRows([])
            setError('')
          }}
        >
          {text(
            language,
            'Clear',
            'پاک کردن',
          )}
        </button>
      </div>

      {error && (
        <div className="tool-error">
          {error}
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="stats-grid">
            <div>
              <small>
                {text(
                  language,
                  'Rows',
                  'ردیف',
                )}
              </small>

              <strong>
                {body.length}
              </strong>
            </div>

            <div>
              <small>
                {text(
                  language,
                  'Columns',
                  'ستون',
                )}
              </small>

              <strong>
                {headers.length}
              </strong>
            </div>

            <div>
              <small>
                {text(
                  language,
                  'Cells',
                  'سلول',
                )}
              </small>

              <strong>
                {body.reduce(
                  (sum, row) =>
                    sum + row.length,
                  0,
                )}
              </strong>
            </div>
          </div>

          <div className="csv-table-wrap">
            <table className="csv-table">
              <thead>
                <tr>
                  {headers.map(
                    (
                      header,
                      index,
                    ) => (
                      <th
                        key={`${header}-${index}`}
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {body
                  .slice(0, 100)
                  .map(
                    (
                      row,
                      rowIndex,
                    ) => (
                      <tr
                        key={rowIndex}
                      >
                        {headers.map(
                          (
                            _header,
                            columnIndex,
                          ) => (
                            <td
                              key={
                                columnIndex
                              }
                            >
                              {
                                row[
                                  columnIndex
                                ]
                              }
                            </td>
                          ),
                        )}
                      </tr>
                    ),
                  )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </ToolFrame>
  )
}

/* =========================================================
   REGEX
   ========================================================= */

function RegexTool({
  title,
  language,
  onBack,
}: {
  title: string
  language: Language
  onBack: () => void
}) {
  const [pattern, setPattern] =
    useState('')

  const [flags, setFlags] =
    useState('g')

  const [sample, setSample] =
    useState('')

  const [matches, setMatches] =
    useState<string[]>([])

  const [error, setError] =
    useState('')

  function testRegex() {
    try {
      const regex = new RegExp(
        pattern,
        flags,
      )

      const result =
        sample.match(regex) ?? []

      setMatches(result)
      setError('')
    } catch (err) {
      setMatches([])

      setError(
        err instanceof Error
          ? err.message
          : text(
              language,
              'Invalid regular expression.',
              'عبارت منظم نامعتبر است.',
            ),
      )
    }
  }

  return (
    <ToolFrame
      title={title}
      language={language}
      onBack={onBack}
    >
      <div className="regex-grid">
        <input
          className="tool-input"
          value={pattern}
          onChange={(event) =>
            setPattern(
              event.target.value,
            )
          }
          placeholder={text(
            language,
            'Regular expression',
            'عبارت منظم',
          )}
        />

        <input
          className="tool-input regex-flags"
          value={flags}
          onChange={(event) =>
            setFlags(
              event.target.value,
            )
          }
          placeholder="gim"
        />
      </div>

      <textarea
        className="tool-editor"
        value={sample}
        onChange={(event) =>
          setSample(
            event.target.value,
          )
        }
        placeholder={text(
          language,
          'Sample text',
          'متن نمونه',
        )}
        spellCheck={false}
      />

      <div className="tool-actions">
        <button
          type="button"
          onClick={testRegex}
        >
          {text(
            language,
            'Test',
            'آزمایش',
          )}
        </button>
      </div>

      {error && (
        <div className="tool-error">
          {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="wide">
          <small>
            {text(
              language,
              'Matches',
              'تطبیق‌ها',
            )}
          </small>

          <strong>
            {matches.length}
          </strong>
        </div>
      </div>

      <pre className="tool-output">
        {matches.join('\n')}
      </pre>
    </ToolFrame>
  )
}

/* =========================================================
   MARKDOWN
   ========================================================= */

function MarkdownTool({
  title,
  language,
  onBack,
}: {
  title: string
  language: Language
  onBack: () => void
}) {
  const [input, setInput] =
    useState(
      '# Hello\n\nWrite **Markdown** here.',
    )

  const preview = useMemo(() => {
    let html = input
      .replace(/&/g, '&amp;')
      .replace(
        /</g,
        '&lt;',
      )
      .replace(
        />/g,
        '&gt;',
      )

    html = html.replace(
      /^### (.+)$/gm,
      '<h3>$1</h3>',
    )

    html = html.replace(
      /^## (.+)$/gm,
      '<h2>$1</h2>',
    )

    html = html.replace(
      /^# (.+)$/gm,
      '<h1>$1</h1>',
    )

    html = html.replace(
      /\*\*(.+?)\*\*/g,
      '<strong>$1</strong>',
    )

    html = html.replace(
      /`([^`]+)`/g,
      '<code>$1</code>',
    )

    html = html.replace(
      /^- (.+)$/gm,
      '<li>$1</li>',
    )

    html = html.replace(
      /\n/g,
      '<br />',
    )

    return html
  }, [input])

  return (
    <ToolFrame
      title={title}
      language={language}
      onBack={onBack}
    >
      <div className="markdown-grid">
        <textarea
          className="tool-editor"
          value={input}
          onChange={(event) =>
            setInput(
              event.target.value,
            )
          }
          spellCheck={false}
        />

        <div
          className="markdown-preview"
          dangerouslySetInnerHTML={{
            __html: preview,
          }}
        />
      </div>
    </ToolFrame>
  )
}

/* =========================================================
   TEXT
   ========================================================= */

function TextTool({
  title,
  language,
  onBack,
}: {
  title: string
  language: Language
  onBack: () => void
}) {
  const [value, setValue] =
    useState('')

  const trimmed =
    value.trim()

  const wordCount = trimmed
    ? trimmed.split(/\s+/).length
    : 0

  const lineCount = value
    ? value.split(/\r?\n/).length
    : 0

  return (
    <ToolFrame
      title={title}
      language={language}
      onBack={onBack}
    >
      <textarea
        className="tool-editor"
        value={value}
        onChange={(event) =>
          setValue(
            event.target.value,
          )
        }
        placeholder={text(
          language,
          'Type or paste text here…',
          'متن را اینجا وارد کنید…',
        )}
      />

      <div className="stats-grid">
        <div>
          <small>
            {text(
              language,
              'Characters',
              'نویسه',
            )}
          </small>

          <strong>
            {value.length}
          </strong>
        </div>

        <div>
          <small>
            {text(
              language,
              'Words',
              'کلمه',
            )}
          </small>

          <strong>
            {wordCount}
          </strong>
        </div>

        <div>
          <small>
            {text(
              language,
              'Lines',
              'خط',
            )}
          </small>

          <strong>
            {lineCount}
          </strong>
        </div>
      </div>

      <div className="tool-actions">
        <button
          type="button"
          onClick={() =>
            setValue(
              (current) =>
                current.toUpperCase(),
            )
          }
        >
          {text(
            language,
            'UPPERCASE',
            'حروف بزرگ',
          )}
        </button>

        <button
          type="button"
          onClick={() =>
            setValue(
              (current) =>
                current.toLowerCase(),
            )
          }
        >
          {text(
            language,
            'lowercase',
            'حروف کوچک',
          )}
        </button>

        <button
          type="button"
          onClick={() =>
            setValue('')
          }
        >
          {text(
            language,
            'Clear',
            'پاک کردن',
          )}
        </button>
      </div>
    </ToolFrame>
  )
}

/* =========================================================
   TIMESTAMP
   ========================================================= */

function TimestampTool({
  title,
  language,
  onBack,
}: {
  title: string
  language: Language
  onBack: () => void
}) {
  const [value, setValue] =
    useState(
      String(
        Math.floor(
          Date.now() / 1000,
        ),
      ),
    )

  const result = useMemo(() => {
    const numeric =
      Number(value)

    if (!Number.isFinite(numeric)) {
      return text(
        language,
        'Invalid timestamp.',
        'زمان واردشده معتبر نیست.',
      )
    }

    const milliseconds =
      Math.abs(numeric) <
      1_000_000_000_000
        ? numeric * 1000
        : numeric

    const date =
      new Date(milliseconds)

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return text(
        language,
        'Invalid date.',
        'تاریخ معتبر نیست.',
      )
    }

    return [
      `ISO: ${date.toISOString()}`,
      `${text(
        language,
        'Local',
        'محلی',
      )}: ${date.toLocaleString()}`,
      `Unix: ${Math.floor(
        date.getTime() / 1000,
      )}`,
    ].join('\n')
  }, [language, value])

  return (
    <ToolFrame
      title={title}
      language={language}
      onBack={onBack}
    >
      <div className="inline-form">
        <input
          className="tool-input"
          value={value}
          onChange={(event) =>
            setValue(
              event.target.value,
            )
          }
        />

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            setValue(
              String(
                Math.floor(
                  Date.now() /
                    1000,
                ),
              ),
            )
          }
        >
          {text(
            language,
            'Now',
            'اکنون',
          )}
        </button>
      </div>

      <pre className="tool-output">
        {result}
      </pre>
    </ToolFrame>
  )
}

/* =========================================================
   BASE64
   ========================================================= */

function Base64Tool({
  title,
  language,
  onBack,
}: {
  title: string
  language: Language
  onBack: () => void
}) {
  const [value, setValue] =
    useState('')

  const [output, setOutput] =
    useState('')

  function encode() {
    const bytes =
      new TextEncoder().encode(
        value,
      )

    let binary = ''

    for (const byte of bytes) {
      binary += String.fromCharCode(
        byte,
      )
    }

    setOutput(
      btoa(binary),
    )
  }

  function decode() {
    try {
      const binary =
        atob(value)

      const bytes =
        Uint8Array.from(
          binary,
          (char) =>
            char.charCodeAt(
              0,
            ),
        )

      setOutput(
        new TextDecoder().decode(
          bytes,
        ),
      )
    } catch {
      setOutput(
        text(
          language,
          'Invalid Base64.',
          'Base64 نامعتبر است.',
        ),
      )
    }
  }

  return (
    <ToolFrame
      title={title}
      language={language}
      onBack={onBack}
    >
      <textarea
        className="tool-editor"
        value={value}
        onChange={(event) =>
          setValue(
            event.target.value,
          )
        }
        placeholder={text(
          language,
          'Text or Base64',
          'متن یا Base64',
        )}
      />

      <div className="tool-actions">
        <button
          type="button"
          onClick={encode}
        >
          {text(
            language,
            'Encode',
            'کدگذاری',
          )}
        </button>

        <button
          type="button"
          onClick={decode}
        >
          {text(
            language,
            'Decode',
            'بازگردانی',
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setValue('')
            setOutput('')
          }}
        >
          {text(
            language,
            'Clear',
            'پاک کردن',
          )}
        </button>
      </div>

      <pre className="tool-output">
        {output}
      </pre>
    </ToolFrame>
  )
}

/* =========================================================
   UUID
   ========================================================= */

function UuidTool({
  title,
  language,
  onBack,
}: {
  title: string
  language: Language
  onBack: () => void
}) {
  const [value, setValue] =
    useState('')

  function generate() {
    setValue(
      crypto.randomUUID(),
    )
  }

  async function copy() {
    if (!value) {
      return
    }

    await navigator.clipboard?.writeText(
      value,
    )
  }

  return (
    <ToolFrame
      title={title}
      language={language}
      onBack={onBack}
    >
      <div className="uuid-box">
        {value || '—'}
      </div>

      <div className="tool-actions">
        <button
          type="button"
          className="primary-button"
          onClick={generate}
        >
          {text(
            language,
            'Generate',
            'ساخت شناسه',
          )}
        </button>

        <button
          type="button"
          onClick={copy}
          disabled={!value}
        >
          {text(
            language,
            'Copy',
            'کپی',
          )}
        </button>
      </div>
    </ToolFrame>
  )
}