import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useApp } from './lib/app-context'
import { copy } from './lib/i18n'
import Home from './pages/Home'
import Tools from './pages/Tools'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

function Shell() {
  const { language, toggleLanguage, theme, toggleTheme } = useApp()
  const t = copy[language]
  const location = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  if (location.pathname.startsWith('/admin')) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  if (location.pathname === '/tools') {
    return (
      <>
        <header className="header header-ltr">
          <a className="brand" href="#/" aria-label="Home">
            AA
          </a>

          <button
            className="mobile-menu"
            onClick={() => setOpen((current) => !current)}
            aria-label="Menu"
            aria-expanded={open}
          >
            ☰
          </button>

          <nav className={`nav ${open ? 'open' : ''}`}>
            <a href="#/">{language === 'en' ? 'Home' : 'خانه'}</a>

            <button className="circle-button" onClick={toggleLanguage}>
              {language === 'en' ? 'FA' : 'EN'}
            </button>

            <button className="circle-button" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? '☼' : '◐'}
            </button>
          </nav>
        </header>

        <div className={`page-language lang-${language}`}>
          <Routes>
            <Route path="/tools" element={<Tools />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </>
    )
  }

  return (
    <>
      <header className="header header-ltr">
        <a className="brand" href="#/" aria-label="Home">
          AA
        </a>

        <button
          className="mobile-menu"
          onClick={() => setOpen((current) => !current)}
          aria-label="Menu"
          aria-expanded={open}
        >
          ☰
        </button>

        <nav className={`nav ${open ? 'open' : ''}`}>
          <a href="#/">{t.nav.about === 'درباره' ? 'خانه' : 'Home'}</a>
          <a href="#about">{t.nav.about}</a>
          <a href="#work">{t.nav.work}</a>
          <a href="#stack">{t.nav.stack}</a>

          <NavLink to="/tools">
            {t.nav.tools}
          </NavLink>

          <a href="#contact">{t.nav.contact}</a>

          <button className="circle-button" onClick={toggleLanguage}>
            {language === 'en' ? 'FA' : 'EN'}
          </button>

          <button className="circle-button" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '☼' : '◐'}
          </button>
        </nav>
      </header>

      <div className={`page-language lang-${language}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  )
}

export default function App() {
  return <div className="site">{/* layout direction is intentionally always LTR */}<Shell /></div>
}