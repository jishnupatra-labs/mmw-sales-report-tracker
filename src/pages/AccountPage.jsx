import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthContext'
import Icon from '../dashboard/Icon'
import Modal from '../ui/Modal'
import '../dashboard/Dashboard.css'
import '../ui/ui.css'
import './AccountPage.css'

const SVG = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

function LockIcon({ size = 22 }) {
  return (
    <svg {...SVG} width={size} height={size}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <circle cx="12" cy="15.2" r="1" />
    </svg>
  )
}

function EyeIcon({ off, size = 22 }) {
  return (
    <svg {...SVG} width={size} height={size}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="m4 4 16 16" />}
    </svg>
  )
}

function OkMark() {
  return (
    <svg viewBox="0 0 140 110" width="140" height="110" aria-hidden="true" className="ac-mark">
      <g style={{ filter: 'drop-shadow(0 0 8px rgba(31,209,138,0.55))' }}>
        <circle cx="70" cy="55" r="36" fill="none" stroke="#1fd18a" strokeWidth="4.5" />
        <path d="m52 56 13 13 24-27" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <circle cx="14" cy="30" r="3.5" fill="#1fd18a" /><circle cx="22" cy="62" r="2.4" fill="#1fd18a" />
      <circle cx="124" cy="44" r="2.8" fill="#1fd18a" /><circle cx="119" cy="68" r="4" fill="#1fd18a" />
    </svg>
  )
}

function BadMark() {
  return (
    <svg viewBox="0 0 140 110" width="140" height="110" aria-hidden="true" className="ac-mark">
      <g style={{ filter: 'drop-shadow(0 0 9px rgba(255,59,82,0.6))' }}>
        <circle cx="70" cy="55" r="36" fill="rgba(120,10,30,0.35)" stroke="#ff3b52" strokeWidth="4.5" />
        <path d="M70 38v22" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
        <circle cx="70" cy="72" r="4.2" fill="#ffffff" />
      </g>
    </svg>
  )
}

function initialsOf(name) {
  const words = (name || '').split(/[\s._-]+/).filter(Boolean)
  const letters = words.length > 1 ? words[0][0] + words[1][0] : (words[0] || '?')[0]
  return letters.toUpperCase()
}

// Password input with a lock icon and a show/hide eye (masked by default).
function PasswordField({ id, label, placeholder, autoComplete, value, onChange, error }) {
  const [show, setShow] = useState(false)
  return (
    <div className="ui-field">
      <label className="ui-label" htmlFor={id}>{label}</label>
      <div className="ac-pw">
        <span className="ac-pw-icon"><LockIcon /></span>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className={`ui-control${error ? ' invalid' : ''}`}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
        />
        <button type="button" className="ac-pw-eye" aria-label={`${show ? 'Hide' : 'Show'} ${label.toLowerCase()}`} aria-pressed={show} onClick={() => setShow((s) => !s)}>
          <EyeIcon off={!show} />
        </button>
      </div>
      {error && <p className="ui-error" id={`${id}-err`}>{error}</p>}
    </div>
  )
}

const BLANK = { current: '', next: '', confirm: '' }

export default function AccountPage() {
  const { user, signIn, signOut } = useAuth()
  const email = user?.email || ''
  // Full name comes from the account's profile data; if none is set, the part of the email before "@" is shown.
  const fullName = user?.user_metadata?.full_name || email.split('@')[0] || 'Account'

  const [values, setValues] = useState(BLANK)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [resetKey, setResetKey] = useState(0) // remounting the fields also resets their show/hide state
  const [popup, setPopup] = useState(null) // { kind: 'success' } | { kind: 'failure', message }

  const set = (k) => (v) => { setValues((x) => ({ ...x, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })) }

  function cancel() {
    setValues(BLANK)
    setErrors({})
    setResetKey((k) => k + 1)
  }

  async function submit(e) {
    e.preventDefault()
    if (busy) return

    const next = {}
    if (!values.current) next.current = 'Current password is required'
    if (!values.next) next.next = 'New password is required'
    if (!values.confirm) next.confirm = 'Please confirm your new password'
    else if (values.next && values.next !== values.confirm) next.confirm = 'New password and confirm password do not match'
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    // 1) the current password must be correct
    const check = await signIn(email, values.current)
    if (check.error) {
      setBusy(false)
      setPopup({ kind: 'failure', message: 'The current password you entered is incorrect.\nPlease try again.' })
      return
    }
    // 2) change it (any password the authentication system accepts is valid)
    const { error } = await supabase.auth.updateUser({ password: values.next })
    setBusy(false)
    if (error) {
      setPopup({ kind: 'failure', message: `Your password could not be updated.\n${error.message}` })
      return
    }
    cancel()
    setPopup({ kind: 'success' })
  }

  const closePopup = () => setPopup(null)

  return (
    <div className="db ac-root">
      <header className="ac-header">
        <h2 className="ac-title">Account</h2>
        <p className="ac-subtitle">Manage your account information and security settings.</p>
      </header>

      <div className="ac-layout">
        <div className="ac-left">
          <section className="db-card ac-card">
            <div className="ac-card-head">
              <span className="ac-head-icon blue"><Icon name="user" size={34} /></span>
              <div>
                <h3 className="ac-card-title">Account Information</h3>
                <p className="ac-card-sub">Your profile details and account information.</p>
              </div>
            </div>
            <div className="ac-profile">
              <span className="ac-avatar" aria-hidden="true">{initialsOf(fullName)}</span>
              <div className="ac-profile-text">
                <p className="ac-name">{fullName}</p>
                <p className="ac-email">{email}</p>
                <span className="ac-active"><Icon name="check" size={18} />Active Account</span>
              </div>
            </div>
          </section>

          <section className="db-card ac-card">
            <div className="ac-card-head">
              <span className="ac-head-icon red"><Icon name="logout" size={32} /></span>
              <div>
                <h3 className="ac-card-title">Logout</h3>
                <p className="ac-card-sub">Sign out from your account.</p>
              </div>
            </div>
            {/* no confirmation popup: signing out takes the user straight back to the Login page */}
            <button type="button" className="ui-btn outline-red ac-logout" onClick={() => signOut()}>
              <Icon name="logout" size={26} />Logout
            </button>
          </section>
        </div>

        <section className="db-card ac-card ac-right">
          <div className="ac-card-head">
            <span className="ac-head-icon blue"><LockIcon size={34} /></span>
            <div>
              <h3 className="ac-card-title">Change Password</h3>
              <p className="ac-card-sub">Update your password to keep your account secure.</p>
            </div>
          </div>
          <form className="ac-form" onSubmit={submit} noValidate>
            <PasswordField key={`c${resetKey}`} id="ac-current" label="Current Password" placeholder="Enter your current password" autoComplete="current-password" value={values.current} onChange={set('current')} error={errors.current} />
            <PasswordField key={`n${resetKey}`} id="ac-new" label="New Password" placeholder="Enter new password" autoComplete="new-password" value={values.next} onChange={set('next')} error={errors.next} />
            <PasswordField key={`f${resetKey}`} id="ac-confirm" label="Confirm New Password" placeholder="Confirm new password" autoComplete="new-password" value={values.confirm} onChange={set('confirm')} error={errors.confirm} />
            <div className="ac-form-actions">
              <button type="button" className="ui-btn outline" onClick={cancel} disabled={busy}>Cancel</button>
              <button type="submit" className="ui-btn blue" disabled={busy}>{busy ? 'Updating…' : 'Update Password'}</button>
            </div>
          </form>
        </section>
      </div>

      {popup?.kind === 'success' && (
        <Modal variant="dark" title="Password Updated" onClose={closePopup}>
          <OkMark />
          <p className="ui-modal-text">Your password has been changed successfully.</p>
          <div className="ui-modal-actions"><button type="button" className="ui-btn blue ac-okbtn" onClick={closePopup}>OK</button></div>
        </Modal>
      )}
      {popup?.kind === 'failure' && (
        <Modal variant="dark" title="Failed to Update Password" onClose={closePopup}>
          <BadMark />
          <p className="ui-modal-text">{popup.message}</p>
          <div className="ui-modal-actions"><button type="button" className="ui-btn blue ac-okbtn" onClick={closePopup}>OK</button></div>
        </Modal>
      )}
    </div>
  )
}
