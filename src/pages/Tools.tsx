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

type ToolId =
  | 'json'
  | 'csv'
  | 'regex'
  | 'text'
  | 'url'
  | 'timestamp'
  | 'base64'
  | 'uuid'

type Tool = {
  id: ToolId
  title: string
  description: string
}

const TOOL_DEFINITIONS: Record<
  Language,
  Tool[]
> = {
  en: [
    {
      id: 'json',
      title: 'JSON Formatter',
      description:
        'Format, validate and minify JSON data.',
    },
    {
      id: 'csv',
      title: 'CSV Analyzer',
      description:
        'Inspect rows, columns and sample CSV data.',
    },
    {
      id: 'regex',
      title: 'Regex Tester',
      description:
        'Test regular expressions against text.',
    },
    {
      id: 'text',
      title: 'Text Tools',
      description:
        'Count, transform and inspect text.',
    },
    {
      id: 'url',
      title: 'URL Encoder',
      description:
        'Encode and decode URL-safe text.',
    },
    {
      id: 'timestamp',
      title: 'Unix Timestamp',
      description:
        'Convert Unix timestamps to readable dates.',
    },
    {
      id: 'base64',
      title: 'Base64',
      description:
        'Encode and decode UTF-8 text with Base64.',
    },
    {
      id: 'uuid',
      title: 'UUID Generator',
      description:
        'Generate a random UUID directly in the browser.',
    },
  ],
  fa: [
    {
      id: 'json',
      title: 'قالب‌بندی JSON',
      description:
        'مرتب‌سازی، اعتبارسنجی و فشرده‌سازی JSON.',
    },
    {
      id: 'csv',
      title: 'تحلیل CSV',
      description:
        'بررسی ردیف‌ها، ستون‌ها و نمونه داده‌های CSV.',
    },
    {
      id: 'regex',
      title: 'آزمایش Regex',
      description:
        'آزمودن عبارت‌های منظم روی متن.',
    },
    {
      id: 'text',
      title: 'ابزارهای متن',
      description:
        'شمارش، تبدیل و بررسی متن.',
    },
    {
      id: 'url',
      title: 'کدگذاری URL',
      description:
        'کدگذاری و بازگردانی متن برای URL.',
    },
    {
      id: 'timestamp',
      title: 'تبدیل زمان یونیکس',
      description:
        'تبدیل Timestamp به تاریخ و ساعت خوانا.',
    },
    {
      id: 'base64',
      title: 'Base64',
      description:
        'کدگذاری و بازگردانی متن UTF-8 با Base64.',
    },
    {
      id: 'uuid',
      title: 'ساخت UUID',
      description:
        'ساخت یک شناسه تصادفی و یکتا در مرورگر.',
    },
  ],
}

function label(
  language: Language,
  en: string,
  fa: string,
) {
  return language === 'fa' ? fa : en
}

async function copyText(
  value: string,
) {
  if (!value) return

  try {
    await navigator.clipboard.writeText(
      value,
    )
  } catch {
    // Clipboard can be unavailable on insecure origins.
  }
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
        {label(
          language,
          '← Tools',
          '← ابزارها',
        )}
      </button>

      <div className="workspace-top">
        <h2>{title}</h2>

        <span>
          {label(
            language,
            'LOCAL',
            'محلی',
          )}
        </span>
      </div>

      {children}
    </section>
  )
}

function ActionButton({
  children,
  onClick,
  primary = false,
  disabled = false,
}: {
  children: ReactNode
  onClick: () => void
  primary?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      className={
        primary
          ? 'primary-button'
          : undefined
      }
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function ErrorBox({
  children,
}: {
  children: ReactNode
}) {
  if (!children) return null

  return (
    <div className="tool-error">
      {children}
    </div>
  )
}

export default function Tools() {
  const { language } = useApp()
  const t = copy[language]

  const [activeTool, setActiveTool] =
    useState<ToolId | null>(null)

  const tools =
    TOOL_DEFINITIONS[language]

  const selectedTool = tools.find(
    (tool) => tool.id === activeTool,
  )

  if (selectedTool) {
    return (
      <div className="tool-page">
        <ToolWorkspace
          tool={selectedTool}
          language={language}
          onBack={() => setActiveTool(null)}
        />
      </div>
    )
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

          <p>
            {t.tools.subtitle}
          </p>
        </div>

        <div className="tool-controls">
          <Link
            className="tool-home"
            to="/"
            aria-label={label(
              language,
              'Home',
              'خانه',
            )}
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
              <strong>
                {tool.title}
              </strong>

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

    case 'text':
      return (
        <TextTool
          title={tool.title}
          language={language}
          onBack={onBack}
        />
      )

    case 'url':
      return (
        <UrlTool
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

  function parseJson(
    mode: 'format' | 'minify',
  ) {
    if (!input.trim()) {
      setOutput('')
      setError(
        label(
          language,
          'Paste JSON data first.',
          'ابتدا JSON را وارد کنید.',
        ),
      )
      return
    }

    try {
      const parsed =
        JSON.parse(input)

      setOutput(
        mode === 'format'
          ? JSON.stringify(
              parsed,
              null,
              2,
            )
          : JSON.stringify(parsed),
      )

      setError('')
    } catch (err) {
      setOutput('')
      setError(
        err instanceof Error
          ? err.message
          : label(
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
        placeholder={
          '{"name":"Ashkan","role":"Developer"}'
        }
        spellCheck={false}
      />

      <div className="tool-actions">
        <ActionButton
          primary
          onClick={() =>
            parseJson('format')
          }
        >
          {label(
            language,
            'Format',
            'مرتب‌سازی',
          )}
        </ActionButton>

        <ActionButton
          onClick={() =>
            parseJson('minify')
          }
        >
          {label(
            language,
            'Minify',
            'فشرده‌سازی',
          )}
        </ActionButton>

        <ActionButton
          onClick={clear}
        >
          {label(
            language,
            'Clear',
            'پاک کردن',
          )}
        </ActionButton>

        <ActionButton
          onClick={() =>
            copyText(output)
          }
          disabled={!output}
        >
          {label(
            language,
            'Copy',
            'کپی',
          )}
        </ActionButton>
      </div>

      <ErrorBox>
        {error}
      </ErrorBox>

      {output && (
        <pre className="tool-output">
          {output}
        </pre>
      )}
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
        label(
          language,
          'Paste CSV data first.',
          'ابتدا داده CSV را وارد کنید.',
        ),
      )
      return
    }

    const result =
      Papa.parse<string[]>(
        input,
        {
          skipEmptyLines: true,
        },
      )

    if (result.errors.length) {
      setRows([])
      setError(
        result.errors[0]?.message ??
          label(
            language,
            'Could not parse CSV.',
            'خواندن CSV ناموفق بود.',
          ),
      )
      return
    }

    const parsedRows =
      result.data.map(
        (row) =>
          row.map((cell) =>
            String(cell ?? ''),
          ),
      )

    setRows(parsedRows)
    setError('')
  }

  function clear() {
    setInput('')
    setRows([])
    setError('')
  }

  const headers =
    rows[0] ?? []
  const body =
    rows.slice(1)

  const cellCount =
    body.reduce(
      (total, row) =>
        total + row.length,
      0,
    )

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
        <ActionButton
          primary
          onClick={analyzeCsv}
        >
          {label(
            language,
            'Analyze',
            'تحلیل',
          )}
        </ActionButton>

        <ActionButton
          onClick={clear}
        >
          {label(
            language,
            'Clear',
            'پاک کردن',
          )}
        </ActionButton>
      </div>

      <ErrorBox>
        {error}
      </ErrorBox>

      {rows.length > 0 && (
        <>
          <div className="stats-grid">
            <div>
              <small>
                {label(
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
                {label(
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
                {label(
                  language,
                  'Cells',
                  'سلول',
                )}
              </small>

              <strong>
                {cellCount}
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
    if (!pattern) {
      setMatches([])
      setError(
        label(
          language,
          'Enter a regular expression.',
          'عبارت منظم را وارد کنید.',
        ),
      )
      return
    }

    try {
      const regex =
        new RegExp(
          pattern,
          flags,
        )

      if (regex.global) {
        const found =
          Array.from(
            sample.matchAll(regex),
          ).map(
            (match) =>
              match[0],
          )

        setMatches(found)
      } else {
        const match =
          sample.match(regex)

        setMatches(
          match
            ? [match[0]]
            : [],
        )
      }

      setError('')
    } catch (err) {
      setMatches([])
      setError(
        err instanceof Error
          ? err.message
          : label(
              language,
              'Invalid regular expression.',
              'عبارت منظم نامعتبر است.',
            ),
      )
    }
  }

  function clear() {
    setPattern('')
    setFlags('g')
    setSample('')
    setMatches([])
    setError('')
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
          placeholder={label(
            language,
            'Regular expression',
            'عبارت منظم',
          )}
          spellCheck={false}
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
          spellCheck={false}
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
        placeholder={label(
          language,
          'Sample text',
          'متن نمونه',
        )}
        spellCheck={false}
      />

      <div className="tool-actions">
        <ActionButton
          primary
          onClick={testRegex}
        >
          {label(
            language,
            'Test',
            'آزمایش',
          )}
        </ActionButton>

        <ActionButton
          onClick={clear}
        >
          {label(
            language,
            'Clear',
            'پاک کردن',
          )}
        </ActionButton>
      </div>

      <ErrorBox>
        {error}
      </ErrorBox>

      <div className="stats-grid">
        <div className="wide">
          <small>
            {label(
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

  const statistics =
    useMemo(() => {
      const trimmed =
        value.trim()

      const words = trimmed
        ? trimmed.split(/\s+/)
            .length
        : 0

      const lines = value
        ? value.split(
            /\r?\n/,
          ).length
        : 0

      const paragraphs = trimmed
        ? trimmed
            .split(
              /\n\s*\n/,
            )
            .filter(Boolean)
            .length
        : 0

      return {
        characters: value.length,
        charactersNoSpaces:
          value.replace(
            /\s/g,
            '',
          ).length,
        words,
        lines,
        paragraphs,
      }
    }, [value])

  function clear() {
    setValue('')
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
          setValue(event.target.value)
        }
        placeholder={label(
          language,
          'Type or paste text here…',
          'متن را اینجا وارد کنید…',
        )}
      />

      <div className="stats-grid">
        <div>
          <small>
            {label(
              language,
              'Characters',
              'نویسه',
            )}
          </small>

          <strong>
            {statistics.characters}
          </strong>
        </div>

        <div>
          <small>
            {label(
              language,
              'No spaces',
              'بدون فاصله',
            )}
          </small>

          <strong>
            {
              statistics.charactersNoSpaces
            }
          </strong>
        </div>

        <div>
          <small>
            {label(
              language,
              'Words',
              'کلمه',
            )}
          </small>

          <strong>
            {statistics.words}
          </strong>
        </div>

        <div>
          <small>
            {label(
              language,
              'Lines',
              'خط',
            )}
          </small>

          <strong>
            {statistics.lines}
          </strong>
        </div>

        <div>
          <small>
            {label(
              language,
              'Paragraphs',
              'پاراگراف',
            )}
          </small>

          <strong>
            {statistics.paragraphs}
          </strong>
        </div>
      </div>

      <div className="tool-actions">
        <ActionButton
          onClick={() =>
            setValue(
              (current) =>
                current.toUpperCase(),
            )
          }
        >
          {label(
            language,
            'UPPERCASE',
            'حروف بزرگ',
          )}
        </ActionButton>

        <ActionButton
          onClick={() =>
            setValue(
              (current) =>
                current.toLowerCase(),
            )
          }
        >
          {label(
            language,
            'lowercase',
            'حروف کوچک',
          )}
        </ActionButton>

        <ActionButton
          onClick={() =>
            setValue(
              (current) =>
                current.trim(),
            )
          }
        >
          {label(
            language,
            'Trim',
            'حذف فاصله اضافی',
          )}
        </ActionButton>

        <ActionButton
          onClick={() =>
            copyText(value)
          }
          disabled={!value}
        >
          {label(
            language,
            'Copy',
            'کپی',
          )}
        </ActionButton>

        <ActionButton
          onClick={clear}
          disabled={!value}
        >
          {label(
            language,
            'Clear',
            'پاک کردن',
          )}
        </ActionButton>
      </div>
    </ToolFrame>
  )
}

/* =========================================================
   URL
   ========================================================= */

function UrlTool({
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

  function encode() {
    try {
      setOutput(
        encodeURIComponent(input),
      )
      setError('')
    } catch {
      setOutput('')
      setError(
        label(
          language,
          'Could not encode the text.',
          'کدگذاری متن ناموفق بود.',
        ),
      )
    }
  }

  function decode() {
    try {
      setOutput(
        decodeURIComponent(input),
      )
      setError('')
    } catch {
      setOutput('')
      setError(
        label(
          language,
          'Invalid encoded URL text.',
          'متن کدگذاری‌شده معتبر نیست.',
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
        placeholder={label(
          language,
          'https://example.com/search?q=hello world',
          'متن یا آدرس را وارد کنید…',
        )}
        spellCheck={false}
      />

      <div className="tool-actions">
        <ActionButton
          primary
          onClick={encode}
        >
          {label(
            language,
            'Encode',
            'کدگذاری',
          )}
        </ActionButton>

        <ActionButton
          onClick={decode}
        >
          {label(
            language,
            'Decode',
            'بازگردانی',
          )}
        </ActionButton>

        <ActionButton
          onClick={() =>
            copyText(output)
          }
          disabled={!output}
        >
          {label(
            language,
            'Copy',
            'کپی',
          )}
        </ActionButton>

        <ActionButton
          onClick={clear}
        >
          {label(
            language,
            'Clear',
            'پاک کردن',
          )}
        </ActionButton>
      </div>

      <ErrorBox>
        {error}
      </ErrorBox>

      {output && (
        <pre className="tool-output">
          {output}
        </pre>
      )}
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

  const result =
    useMemo(() => {
      const numeric =
        Number(value.trim())

      if (
        !value.trim() ||
        Number.isNaN(numeric)
      ) {
        return ''
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
        return ''
      }

      const formatter =
        new Intl.DateTimeFormat(
          language === 'fa'
            ? 'fa-IR'
            : 'en-US',
          {
            dateStyle: 'full',
            timeStyle: 'long',
            calendar:
              language === 'fa'
                ? 'persian'
                : 'gregory',
          },
        )

      return [
        `ISO: ${date.toISOString()}`,
        `${label(
          language,
          'Local',
          'محلی',
        )}: ${formatter.format(
          date,
        )}`,
        `Unix seconds: ${Math.floor(
          date.getTime() / 1000,
        )}`,
        `Unix milliseconds: ${date.getTime()}`,
      ].join('\n')
    }, [
      language,
      value,
    ])

  function setNow() {
    setValue(
      String(
        Math.floor(
          Date.now() / 1000,
        ),
      ),
    )
  }

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
          inputMode="numeric"
        />

        <ActionButton
          primary
          onClick={setNow}
        >
          {label(
            language,
            'Now',
            'اکنون',
          )}
        </ActionButton>
      </div>

      {result ? (
        <pre className="tool-output">
          {result}
        </pre>
      ) : (
        <ErrorBox>
          {label(
            language,
            'Invalid timestamp.',
            'Timestamp معتبر نیست.',
          )}
        </ErrorBox>
      )}
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
  const [error, setError] =
    useState('')

  function encode() {
    try {
      const bytes =
        new TextEncoder().encode(
          value,
        )

      let binary = ''

      for (
        const byte of bytes
      ) {
        binary +=
          String.fromCharCode(
            byte,
          )
      }

      setOutput(
        btoa(binary),
      )

      setError('')
    } catch {
      setOutput('')
      setError(
        label(
          language,
          'Encoding failed.',
          'کدگذاری ناموفق بود.',
        ),
      )
    }
  }

  function decode() {
    try {
      const binary =
        atob(value)

      const bytes =
        Uint8Array.from(
          binary,
          (character) =>
            character.charCodeAt(
              0,
            ),
        )

      setOutput(
        new TextDecoder().decode(
          bytes,
        ),
      )

      setError('')
    } catch {
      setOutput('')
      setError(
        label(
          language,
          'Invalid Base64.',
          'Base64 نامعتبر است.',
        ),
      )
    }
  }

  function clear() {
    setValue('')
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
        value={value}
        onChange={(event) =>
          setValue(
            event.target.value,
          )
        }
        placeholder={label(
          language,
          'Text or Base64',
          'متن یا Base64',
        )}
        spellCheck={false}
      />

      <div className="tool-actions">
        <ActionButton
          primary
          onClick={encode}
        >
          {label(
            language,
            'Encode',
            'کدگذاری',
          )}
        </ActionButton>

        <ActionButton
          onClick={decode}
        >
          {label(
            language,
            'Decode',
            'بازگردانی',
          )}
        </ActionButton>

        <ActionButton
          onClick={() =>
            copyText(output)
          }
          disabled={!output}
        >
          {label(
            language,
            'Copy',
            'کپی',
          )}
        </ActionButton>

        <ActionButton
          onClick={clear}
        >
          {label(
            language,
            'Clear',
            'پاک کردن',
          )}
        </ActionButton>
      </div>

      <ErrorBox>
        {error}
      </ErrorBox>

      {output && (
        <pre className="tool-output">
          {output}
        </pre>
      )}
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
    try {
      setValue(
        crypto.randomUUID(),
      )
    } catch {
      setValue(
        ''
      )
    }
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
        <ActionButton
          primary
          onClick={generate}
        >
          {label(
            language,
            'Generate',
            'ساخت شناسه',
          )}
        </ActionButton>

        <ActionButton
          onClick={() =>
            copyText(value)
          }
          disabled={!value}
        >
          {label(
            language,
            'Copy',
            'کپی',
          )}
        </ActionButton>
      </div>
    </ToolFrame>
  )
}