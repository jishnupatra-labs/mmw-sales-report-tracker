import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import Icon from '../dashboard/Icon'
import carLogo from '../assets/brand/mmw-car.png'
import DashboardPage from '../pages/DashboardPage'
import SalesPage from '../pages/SalesPage'
import ReportsPage from '../pages/ReportsPage'
import AccountPage from '../pages/AccountPage'
import { NavGuardProvider, useNavGuard } from '../nav/NavGuard'
import './AppShell.css'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home', Component: DashboardPage },
  { id: 'sales', label: 'Sales', icon: 'cart', Component: SalesPage },
  { id: 'reports', label: 'Reports', icon: 'bars', Component: ReportsPage },
]

function initialsOf(name) {
  if (!name) return '?'
  const base = name.includes('@') ? name.split('@')[0] : name
  const words = base.split(/[\s._-]+/).filter(Boolean)
  const letters = words.length > 1 ? words[0][0] + words[1][0] : (words[0] || '?')[0]
  return letters.toUpperCase()
}

function Shell() {
  const { user, signOut } = useAuth()
  const { requestLeave } = useNavGuard()
  const [active, setActive] = useState('dashboard')
  const [salesKey, setSalesKey] = useState(0) // clicking Sales always returns that tab to its landing page
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  // 'account' is reachable from the user chip, not from the tab bar.
  const Component = active === 'account'
    ? AccountPage
    : TABS.find((t) => t.id === active).Component
  const username = user?.user_metadata?.full_name || user?.email || ''
  const dark = active === 'dashboard' // the dark full-width canvas is used by the Dashboard only

  // Every way of leaving the current page goes through the unsaved-changes guard.
  function go(id) {
    setMenuOpen(false)
    requestLeave(() => {
      if (id === 'sales') setSalesKey((k) => k + 1)
      setActive(id)
    })
  }

  useEffect(() => {
    if (!menuOpen) return undefined
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [menuOpen])

  return (
    <div className={`sh-shell${dark ? ' is-dark' : ''}`}>
      <header className="sh-header">
        <div className="sh-header-inner">
          <img className="sh-silhouette" src={carLogo} alt="" aria-hidden="true" />

          <button type="button" className="sh-brand" aria-label="My Miniature World Sales Tracker" onClick={() => go('dashboard')}>
            <img className="sh-brand-logo" src={carLogo} alt="" />
            <span className="sh-brand-text">
              <span className="sh-brand-name">My Miniature World</span>
              <span className="sh-brand-sub">Sales Tracker</span>
            </span>
          </button>

          <nav className="sh-nav" aria-label="Main">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`sh-tab${active === t.id ? ' active' : ''}`}
                onClick={() => go(t.id)}
                aria-current={active === t.id ? 'page' : undefined}
              >
                <Icon name={t.icon} size={26} />
                <span>{t.label}</span>
              </button>
            ))}
          </nav>

          <div className="sh-user" ref={menuRef}>
            <button
              type="button"
              className="sh-chip"
              aria-label={username}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="sh-avatar" aria-hidden="true">{initialsOf(username)}</span>
              <span className="sh-username" aria-hidden="true">{username}</span>
              <span className={`sh-chip-chevron${menuOpen ? ' is-open' : ''}`} aria-hidden="true"><Icon name="chevron" size={16} /></span>
            </button>
            {menuOpen && (
              <div className="sh-dropdown" role="menu">
                <button type="button" role="menuitem" className="sh-menuitem" onClick={() => go('account')}>
                  <Icon name="user" size={20} />My Account
                </button>
                <button type="button" role="menuitem" className="sh-menuitem danger" onClick={() => { setMenuOpen(false); requestLeave(() => signOut()) }}>
                  <Icon name="logout" size={20} />Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className={dark ? 'sh-canvas' : 'content'}>
        <Component key={active === 'sales' ? salesKey : active} />
      </main>
    </div>
  )
}

export default function AppShell() {
  return (
    <NavGuardProvider>
      <Shell />
    </NavGuardProvider>
  )
}
