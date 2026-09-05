import {
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { Link } from 'react-router-dom'
import Papa from 'papaparse'

import { useApp } from '../lib/app-context'
import { copy } from '../lib/i18n'

type Language =
  | 'en'
  | 'fa'

type ToolDefinition = {
  id: string
  title: string
  description: string
}

function localized(
  language: Language,
  en: string,
  fa: string,
) {
  return language === 'fa'
    ? fa
    : en
}

function Frame({
  title,
  close,
  language,
  children,
}: {
  title: string
  close: () => void
  language: Language
  children: ReactNode
}) {
  const t = copy[language]

  return (
    <section className="tool-workspace">
      <button
        className="back-link tool-back"
        type="button"
        onClick={close}
      >
        {t.tools.back}
      </button>

      <div className="workspace-top">
        <h2>{title}</h2>

        <span>
          {t.tools.local}
        </span>
      </div>

      {children}
    </section>
  )
}

export default function Tools() {
  const {
    language,
  } = useApp()

  const t = copy[language]

  const [
    active,
    setActive,
  ] = useState<
    string | null
  >(null)

  const tools: ToolDefinition[] =
    t.tools.items.map(
      ([
        id,
        title,
        description,
      ]) => ({
        id,
        title,
        description,
      }),
    )

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

          <h1>
            {t.tools.title}
          </h1>

          <p>
            {t.tools.subtitle}
          </p>
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

      {active ? (
        <ToolWorkspace
          id={active}
          language={language}
          close={() =>
            setActive(null)
          }
          tools={tools}
        />
      ) : (
        <div className="tool-list">
          {tools.map(
            (
              tool,
              index,
            ) => (
              <button
                className="tool-item"
                type="button"
                key={tool.id}
                onClick={() =>
                  setActive(
                    tool.id,
                  )
                }
              >
                <span className="tool-number">
                  {String(
                    index + 1,
                  ).padStart(
                    2,
                    '0',
                  )}
                </span>

                <span className="tool-item-main">
                  <strong>
                    {tool.title}
                  </strong>

                  <small>
                    {
                      tool.description
                    }
                  </small>
                </span>

                <b className="tool-arrow">
                  ↗
                </b>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}

function ToolWorkspace({
  id,
  language,
  close,
  tools,
}: {
  id: string
  language: Language
  close: () => void
  tools: ToolDefinition[]
}) {
  const title =
    tools.find(
      (tool) =>
        tool.id === id,
    )?.title ?? id

  switch (id) {
    case 'json':
      return (
        <JsonTool
          title={title}
          language={language}
          close={close}
        />
      )

    case 'csv':
      return (
        <CsvTool
          title={title}
          language={language}
          close={close}
        />
      )

    case 'regex':
      return (
        <RegexTool
          title={title}
          language={language}
          close={close}
        />
      )

    case 'markdown':
      return (
        <MarkdownTool
          title={title}
          language={language}
          close={close}
        />
      )

    case 'text':
      return (
        <TextTool
          title={title}
          language={language}
          close={close}
        />
      )

    case 'timestamp':
      return (
        <TimestampTool
          title={title}
          language={language}
          close={close}
        />
      )

    case 'base64':
      return (
        <Base64Tool
          title={title}
          language={language}
          close={close}
        />
      )

    case 'uuid':
      return (
        <UuidTool
          title={title}
          language={language}
          close={close}
        />
      )

    default:
      return null
  }
}

function JsonTool({
  title,
  language,
  close,
}: {
  title: string
  language: Language
  close: () => void
}) {
  const [
    value,
    setValue,
  ] = useState('')

  const [
    output,
    setOutput,
  ] = useState('')

  const [
    error,
    setError,
  ] = useState('')

  function format() {
    try {
      const parsed =
        JSON.parse(value)

      setOutput(
        JSON.stringify(
          parsed,
          null,
          2,
        ),
      )

      setError('')
    } catch (
      error,
    ) {
      setOutput('')

      setError(
        error instanceof Error
          ? error.message
          : localized(
              language,
              'Invalid JSON.',
              'JSON نامعتبر است.',
            ),
      )
    }
  }

  function minify() {
    try {
      const parsed =
        JSON.parse(value)

      setOutput(
        JSON.stringify(
          parsed,
        ),
      )

      setError('')
    } catch (
      error,
    ) {
      setOutput('')

      setError(
        error instanceof Error
          ? error.message
          : localized(
              language,
              'Invalid JSON.',
              'JSON نامعتبر است.',
            ),
      )
    }
  }

  return (
    <Frame
      title={title}
      language={language}
      close={close}
    >
      <textarea
        className="tool-editor"
        value={value}
        onChange={(
          event,
        ) =>
          setValue(
            event.target
              .value,
          )
        }
        placeholder='{"name":"Ashkan"}'
        spellCheck={false}
      />

      <div className="tool-actions">
        <button
          type="button"
          onClick={format}
        >
          {localized(
            language,
            'Format',
            'مرتب‌سازی',
          )}
        </button>

        <button
          type="button"
          onClick={minify}
        >
          {localized(
            language,
            'Minify',
            'فشرده‌سازی',
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setValue('')
            setOutput('')
            setError('')
          }}
        >
          {localized(
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
    </Frame>
  )
}

function CsvTool({
  title,
  language,
  close,
}: {
  title: string
  language: Language
  close: () => void
}) {
  const [
    value,
    setValue,
  ] = useState('')

  const [
    rows,
    setRows,
  ] = useState<
    string[][]
  >([])

  const [
    error,
    setError,
  ] = useState('')

  function analyze() {
    Papa.parse<
      string[]
    >(value, {
      skipEmptyLines: true,

      complete(result) {
        if (
          result.errors.length
        ) {
          setError(
            result.errors[0]
              ?.message ??
              localized(
                language,
                'CSV parsing failed.',
                'خواندن CSV ناموفق بود.',
              ),
          )

          return
        }

        setRows(
          result.data,
        )

        setError('')
      },
    })
  }

  const headers =
    rows[0] ?? []

  const dataRows =
    rows.slice(1)

  return (
    <Frame
      title={title}
      language={language}
      close={close}
    >
      <textarea
        className="tool-editor"
        value={value}
        onChange={(
          event,
        ) =>
          setValue(
            event.target
              .value,
          )
        }
        placeholder={
          'name,age,role\nAshkan,21,Developer'
        }
        spellCheck={false}
      />

      <div className="tool-actions">
        <button
          type="button"
          onClick={analyze}
        >
          {localized(
            language,
            'Analyze CSV',
            'تحلیل CSV',
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setValue('')
            setRows([])
            setError('')
          }}
        >
          {localized(
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
                {localized(
                  language,
                  'Rows',
                  'ردیف',
                )}
              </small>

              <strong>
                {dataRows.length}
              </strong>
            </div>

            <div>
              <small>
                {localized(
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
                {localized(
                  language,
                  'Cells',
                  'خانه',
                )}
              </small>

              <strong>
                {dataRows.reduce(
                  (
                    total,
                    row,
                  ) =>
                    total +
                    row.length,
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
                        {
                          header
                        }
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {dataRows
                  .slice(
                    0,
                    100,
                  )
                  .map(
                    (
                      row,
                      rowIndex,
                    ) => (
                      <tr
                        key={
                          rowIndex
                        }
                      >
                        {headers.map(
                          (
                            _,
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
    </Frame>
  )
}

function RegexTool({
  title,
  language,
  close,
}: {
  title: string
  language: Language
  close: () => void
}) {
  const [
    pattern,
    setPattern,
  ] = useState('')

  const [
    flags,
    setFlags,
  ] = useState('g')

  const [
    text,
    setText,
  ] = useState('')

  const [
    result,
    setResult,
  ] = useState<
    string[]
  >([])

  const [
    error,
    setError,
  ] = useState('')

  function test() {
    try {
      const regex =
        new RegExp(
          pattern,
          flags,
        )

      const matches =
        text.match(regex) ?? []

      setResult(matches)
      setError('')
    } catch (
      error,
    ) {
      setResult([])

      setError(
        error instanceof Error
          ? error.message
          : localized(
              language,
              'Invalid regular expression.',
              'عبارت منظم نامعتبر است.',
            ),
      )
    }
  }

  return (
    <Frame
      title={title}
      language={language}
      close={close}
    >
      <div className="regex-grid">
        <input
          className="tool-input"
          value={pattern}
          onChange={(
            event,
          ) =>
            setPattern(
              event.target
                .value,
            )
          }
          placeholder={localized(
            language,
            'Regular expression',
            'عبارت منظم',
          )}
        />

        <input
          className="tool-input regex-flags"
          value={flags}
          onChange={(
            event,
          ) =>
            setFlags(
              event.target
                .value,
            )
          }
          placeholder="gim"
        />
      </div>

      <textarea
        className="tool-editor"
        value={text}
        onChange={(
          event,
        ) =>
          setText(
            event.target
              .value,
          )
        }
        placeholder={localized(
          language,
          'Sample text',
          'متن نمونه',
        )}
        spellCheck={false}
      />

      <div className="tool-actions">
        <button
          type="button"
          onClick={test}
        >
          {localized(
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
            {localized(
              language,
              'Matches',
              'تطبیق‌ها',
            )}
          </small>

          <strong>
            {result.length}
          </strong>
        </div>
      </div>

      <pre className="tool-output">
        {result.join('\n')}
      </pre>
    </Frame>
  )
}

function MarkdownTool({
  title,
  language,
  close,
}: {
  title: string
  language: Language
  close: () => void
}) {
  const [
    value,
    setValue,
  ] = useState(
    '# Hello\n\nWrite **Markdown** here.',
  )

  const preview =
    useMemo(() => {
      let html =
        value
          .replace(
            /&/g,
            '&amp;',
          )
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
        /\n/g,
        '<br />',
      )

      return html
    }, [value])

  return (
    <Frame
      title={title}
      language={language}
      close={close}
    >
      <div className="markdown-grid">
        <textarea
          className="tool-editor"
          value={value}
          onChange={(
            event,
          ) =>
            setValue(
              event.target
                .value,
            )
          }
          spellCheck={false}
        />

        <div
          className="markdown-preview"
          dangerouslySetInnerHTML={{
            __html:
              preview,
          }}
        />
      </div>
    </Frame>
  )
}

function TextTool({
  title,
  language,
  close,
}: {
  title: string
  language: Language
  close: () => void
}) {
  const [
    value,
    setValue,
  ] = useState('')

  const words =
    value.trim()
      ? value
          .trim()
          .split(/\s+/)
          .length
      : 0

  return (
    <Frame
      title={title}
      language={language}
      close={close}
    >
      <textarea
        className="tool-editor"
        value={value}
        onChange={(
          event,
        ) =>
          setValue(
            event.target
              .value,
          )
        }
      />

      <div className="stats-grid">
        <div>
          <small>
            {localized(
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
            {localized(
              language,
              'Words',
              'کلمه',
            )}
          </small>

          <strong>
            {words}
          </strong>
        </div>

        <div>
          <small>
            {localized(
              language,
              'Lines',
              'خط',
            )}
          </small>

          <strong>
            {
              value
                ? value.split(
                    '\n',
                  ).length
                : 0
            }
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
          {localized(
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
          {localized(
            language,
            'lowercase',
            'حروف کوچک',
          )}
        </button>
      </div>
    </Frame>
  )
}

function TimestampTool({
  title,
  language,
  close,
}: {
  title: string
  language: Language
  close: () => void
}) {
  const [
    value,
    setValue,
  ] = useState(
    String(
      Math.floor(
        Date.now() /
          1000,
      ),
    ),
  )

  const result =
    useMemo(() => {
      const number =
        Number(value)

      if (
        !Number.isFinite(
          number,
        )
      ) {
        return localized(
          language,
          'Invalid timestamp.',
          'زمان واردشده معتبر نیست.',
        )
      }

      const date =
        new Date(
          Math.abs(
            number,
          ) <
            1_000_000_000_000
            ? number *
                1000
            : number,
        )

      if (
        Number.isNaN(
          date.getTime(),
        )
      ) {
        return localized(
          language,
          'Invalid date.',
          'تاریخ معتبر نیست.',
        )
      }

      return [
        `ISO: ${date.toISOString()}`,
        `${localized(
          language,
          'Local',
          'محلی',
        )}: ${date.toLocaleString()}`,
        `Unix: ${Math.floor(
          date.getTime() /
            1000,
        )}`,
      ].join('\n')
    }, [
      language,
      value,
    ])

  return (
    <Frame
      title={title}
      language={language}
      close={close}
    >
      <div className="inline-form">
        <input
          className="tool-input"
          value={value}
          onChange={(
            event,
          ) =>
            setValue(
              event.target
                .value,
            )
          }
        />

        <button
          className="primary-button"
          type="button"
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
          {localized(
            language,
            'Now',
            'اکنون',
          )}
        </button>
      </div>

      <pre className="tool-output">
        {result}
      </pre>
    </Frame>
  )
}

function Base64Tool({
  title,
  language,
  close,
}: {
  title: string
  language: Language
  close: () => void
}) {
  const [
    value,
    setValue,
  ] = useState('')

  const [
    output,
    setOutput,
  ] = useState('')

  function encode() {
    const bytes =
      new TextEncoder().encode(
        value,
      )

    let binary = ''

    bytes.forEach(
      (byte) => {
        binary += String.fromCharCode(
          byte,
        )
      },
    )

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
        localized(
          language,
          'Invalid Base64.',
          'Base64 نامعتبر است.',
        ),
      )
    }
  }

  return (
    <Frame
      title={title}
      language={language}
      close={close}
    >
      <textarea
        className="tool-editor"
        value={value}
        onChange={(
          event,
        ) =>
          setValue(
            event.target
              .value,
          )
        }
      />

      <div className="tool-actions">
        <button
          type="button"
          onClick={encode}
        >
          {localized(
            language,
            'Encode',
            'کدگذاری',
          )}
        </button>

        <button
          type="button"
          onClick={decode}
        >
          {localized(
            language,
            'Decode',
            'بازگردانی',
          )}
        </button>
      </div>

      <pre className="tool-output">
        {output}
      </pre>
    </Frame>
  )
}

function UuidTool({
  title,
  language,
  close,
}: {
  title: string
  language: Language
  close: () => void
}) {
  const [
    value,
    setValue,
  ] = useState(
    crypto.randomUUID(),
  )

  return (
    <Frame
      title={title}
      language={language}
      close={close}
    >
      <div className="uuid-box">
        {value}
      </div>

      <div className="tool-actions">
        <button
          className="primary-button"
          type="button"
          onClick={() =>
            setValue(
              crypto.randomUUID(),
            )
          }
        >
          {localized(
            language,
            'Generate',
            'ساخت شناسه',
          )}
        </button>

        <button
          type="button"
          onClick={() =>
            void navigator.clipboard?.writeText(
              value,
            )
          }
        >
          {localized(
            language,
            'Copy',
            'کپی',
          )}
        </button>
      </div>
    </Frame>
  )
}