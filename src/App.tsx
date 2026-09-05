import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useApp } from './lib/app-context'
import { copy } from './lib/i18n'

import Home from './pages/Home'
import Tools from './pages/Tools'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

function PublicHeader() {
  const { language, toggleLanguage, theme, toggleTheme } = useApp()
  const t = copy[language]
  const location = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  const homeLabel = language === 'fa' ? 'خانه' : 'Home'

  return (
    <header className="header site-header">
      <a className="brand" href="#/" aria-label="Home">
        AA
      </a>

      <button
        className="mobile-menu"
        onClick={() => setOpen((value) => !value)}
        aria-label="Menu"
        aria-expanded={open}
      >
        ☰
      </button>

      <nav className={`nav ${open ? 'open' : ''}`}>
        <a href="#/" className="nav-link">
          {homeLabel}
        </a>

        <a href="#about" className="nav-link">
          {t.nav.about}
        </a>

        <a href="#work" className="nav-link">
          {t.nav.work}
        </a>

        <a href="#stack" className="nav-link">
          {t.nav.stack}
        </a>

        <NavLink to="/tools" className="nav-link">
          {t.nav.tools}
        </NavLink>

        <a href="#contact" className="nav-link">
          {t.nav.contact}
        </a>

        <button
          className="circle-button language-button"
          onClick={toggleLanguage}
          aria-label="Change language"
        >
          {language === 'en' ? 'FA' : 'EN'}
        </button>

        <button
          className="circle-button theme-button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☼' : '◐'}
        </button>
      </nav>
    </header>
  )
}

function Shell() {
  const location = useLocation()

  if (location.pathname.startsWith('/admin')) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
    <>
      <PublicHeader />

      <div className="public-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/chat" element={<Navigate to="/tools" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  )
}

export default function App() {
  return <div className="site app-shell">{<Shell />}</div>
}