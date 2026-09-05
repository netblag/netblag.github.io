import {
  useEffect,
  useState,
} from 'react'

import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'

import { useApp } from './lib/app-context'
import { copy } from './lib/i18n'

import Home from './pages/Home'
import Tools from './pages/Tools'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

function Header() {
  const {
    language,
    toggleLanguage,
    theme,
    toggleTheme,
  } = useApp()

  const t = copy[language]

  const location = useLocation()

  const [open, setOpen] =
    useState(false)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <header className="site-header">
      <a
        className="brand"
        href="#/"
        aria-label="Home"
      >
        AA
      </a>

      <button
        className="mobile-menu"
        type="button"
        onClick={() =>
          setOpen((value) => !value)
        }
        aria-label="Menu"
        aria-expanded={open}
      >
        ☰
      </button>

      <nav
        className={`nav ${
          open ? 'open' : ''
        }`}
      >
        <a
          className="nav-link"
          href="#about"
        >
          {t.nav.about}
        </a>

        <a
          className="nav-link"
          href="#work"
        >
          {t.nav.work}
        </a>

        <a
          className="nav-link"
          href="#stack"
        >
          {t.nav.stack}
        </a>

        <NavLink
          className="nav-link"
          to="/tools"
        >
          {t.nav.tools}
        </NavLink>

        <a
          className="nav-link"
          href="#contact"
        >
          {t.nav.contact}
        </a>

        <button
          className="circle-button"
          type="button"
          onClick={toggleLanguage}
          aria-label="Change language"
        >
          {language === 'en'
            ? 'FA'
            : 'EN'}
        </button>

        <button
          className="circle-button"
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark'
            ? '☼'
            : '◐'}
        </button>
      </nav>
    </header>
  )
}

function Shell() {
  const location = useLocation()

  /*
   * Admin layout intentionally does not use
   * the public fixed header.
   */
  if (
    location.pathname.startsWith(
      '/admin',
    )
  ) {
    return (
      <Routes>
        <Route
          path="/admin"
          element={<AdminLogin />}
        />

        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    )
  }

  return (
    <>
      <Header />

      <div className="public-content">
        <Routes>
          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/tools"
            element={<Tools />}
          />

          {/*
           * Chat is intentionally removed.
           */}
          <Route
            path="/chat"
            element={
              <Navigate
                to="/tools"
                replace
              />
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
        </Routes>
      </div>
    </>
  )
}

export default function App() {
  return (
    <div className="site app-shell">
      <Shell />
    </div>
  )
}