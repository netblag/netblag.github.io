import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type Language = 'en' | 'fa'
type Theme = 'light' | 'dark'

type AppContextValue = {
  language: Language
  theme: Theme
  toggleLanguage: () => void
  toggleTheme: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return localStorage.getItem('site-language') === 'fa' ? 'fa' : 'en'
  })

  const [theme, setTheme] = useState<Theme>(() => {
    return localStorage.getItem('site-theme') === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.lang = language
    document.documentElement.lang = language

    /*
     * مهم:
     * هیچ‌وقت direction کل document را RTL نمی‌کنیم.
     * این کار باعث جابه‌جایی flex/grid و layout می‌شد.
     */
    document.documentElement.dir = 'ltr'

    localStorage.setItem('site-language', language)
  }, [language])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('site-theme', theme)
  }, [theme])

  const value = useMemo<AppContextValue>(
    () => ({
      language,
      theme,

      toggleLanguage: () => {
        setLanguage((current) => (current === 'en' ? 'fa' : 'en'))
      },

      toggleTheme: () => {
        setTheme((current) => (current === 'light' ? 'dark' : 'light'))
      },
    }),
    [language, theme],
  )

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }

  return context
}