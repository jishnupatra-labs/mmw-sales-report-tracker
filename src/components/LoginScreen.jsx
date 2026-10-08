import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import carLogo from '../assets/brand/mmw-car.png'
import './LoginScreen.css'

const MSG_USERNAME_REQUIRED = 'Username is required'
const MSG_PASSWORD_REQUIRED = 'Password is required'
const MSG_INVALID = 'Invalid username or password'
const MSG_UNAVAILABLE = 'Unable to sign in right now. Please try again.'

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6.5L20.5 7" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <circle cx="12" cy="15.5" r="1" fill="currentColor" />
    </svg>
  )
}

function EyeIcon({ off }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="m4 4 16 16" />}
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export default function LoginScreen() {
  const { signIn } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [authError, setAuthError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (busy) return

    const trimmed = username.trim()
    const errors = {}
    if (!trimmed) errors.username = MSG_USERNAME_REQUIRED
    if (!password) errors.password = MSG_PASSWORD_REQUIRED
    setFieldErrors(errors)
    setAuthError('')
    if (errors.username || errors.password) return // no authentication attempt

    setBusy(true)
    // Supabase signs in with email + password; the UI simply calls the email "Username".
    const { error } = await signIn(trimmed, password)
    if (error) {
      // Never show raw Supabase messages.
      const status = error.status
      const rejected = status >= 400 && status < 500 && status !== 429
      setAuthError(rejected ? MSG_INVALID : MSG_UNAVAILABLE)
    }
    setBusy(false)
  }

  function onUsernameChange(e) {
    setUsername(e.target.value)
    setFieldErrors((prev) => ({ ...prev, username: undefined }))
    setAuthError('')
  }

  function onPasswordChange(e) {
    setPassword(e.target.value)
    setFieldErrors((prev) => ({ ...prev, password: undefined }))
    setAuthError('')
  }

  return (
    <div className="lg-page">
      <div className="lg-bg-car" style={{ backgroundImage: `url(${carLogo})` }} aria-hidden="true" />

      <form className="lg-card" onSubmit={handleSubmit} noValidate>
        <img className="lg-logo" src={carLogo} alt="" />
        <div className="lg-brand">My Miniature World</div>
        <div className="lg-product">Sales Tracker</div>

        <h1 className="lg-title">Welcome Back</h1>
        <p className="lg-subtitle">Sign in to continue to your sales dashboard</p>

        <div className="lg-field">
          <label className="lg-sr" htmlFor="lg-username">Username</label>
          <div className={`lg-input${fieldErrors.username ? ' has-error' : ''}`}>
            <span className="lg-icon"><MailIcon /></span>
            <input
              id="lg-username"
              type="text"
              placeholder="Username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={username}
              onChange={onUsernameChange}
              aria-invalid={Boolean(fieldErrors.username)}
              aria-describedby={fieldErrors.username ? 'lg-username-error' : undefined}
            />
          </div>
          {fieldErrors.username && (
            <p className="lg-error" id="lg-username-error">{fieldErrors.username}</p>
          )}
        </div>

        <div className="lg-field">
          <label className="lg-sr" htmlFor="lg-password">Password</label>
          <div className={`lg-input${fieldErrors.password ? ' has-error' : ''}`}>
            <span className="lg-icon"><LockIcon /></span>
            <input
              id="lg-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={onPasswordChange}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'lg-password-error' : undefined}
            />
            <button
              type="button"
              className="lg-eye"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              <EyeIcon off={!showPassword} />
            </button>
          </div>
          {fieldErrors.password && (
            <p className="lg-error" id="lg-password-error">{fieldErrors.password}</p>
          )}
        </div>

        <button type="submit" className="lg-submit" disabled={busy}>
          {busy ? 'Signing in…' : (<>Sign In <ArrowIcon /></>)}
        </button>

        {authError && <p className="lg-auth-error" role="alert">{authError}</p>}

        <hr className="lg-divider" />
        <p className="lg-footer">© 2026 MyMiniatureWorld | Sales Tracker</p>
      </form>
    </div>
  )
}
