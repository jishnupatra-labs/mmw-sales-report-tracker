import { useEffect, useRef } from 'react'
import Icon from '../dashboard/Icon'
import './ui.css'

// Centered dialog over a dimmed backdrop. variant: 'light' (white card) | 'dark'.
// onClose is called for the X button and Esc (omit it to make the dialog non-dismissable).
export default function Modal({ variant = 'light', title, onClose, children, labelledBy = 'ui-modal-title' }) {
  const ref = useRef(null)

  useEffect(() => {
    const prev = document.activeElement
    ref.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape' && onClose) onClose() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.() }
  }, [onClose])

  return (
    <div className="ui-backdrop">
      <div ref={ref} tabIndex={-1} className={`ui-modal ${variant}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {onClose && (
          <button type="button" className="ui-modal-x" aria-label="Close" onClick={onClose}><Icon name="x" size={22} /></button>
        )}
        <h2 id={labelledBy} className="ui-modal-title">{title}</h2>
        {children}
      </div>
    </div>
  )
}
