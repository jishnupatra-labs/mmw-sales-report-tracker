import { useEffect, useId, useRef, useState } from 'react'
import Icon from './Icon'
import { MONTH_SHORT, currentMonthKey, monthKey, monthLabel } from './dateUtils'

// Month + year picker. Every month in [minYear, maxYear] is selectable.
export default function MonthPicker({ value, minYear, maxYear, onChange }) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => Number(value.slice(0, 4)))
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const dialogId = useId()

  const selectedYear = Number(value.slice(0, 4))
  const selectedMonth = Number(value.slice(5, 7)) - 1
  const today = currentMonthKey()

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => {
      if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus() }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function toggle() {
    if (!open) setViewYear(selectedYear)
    setOpen((o) => !o)
  }

  function pick(monthIndex) {
    onChange(monthKey(viewYear, monthIndex))
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div className="db-month" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="db-month-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        aria-label={`Select month, currently ${monthLabel(value)}`}
        onClick={toggle}
      >
        <span className="db-month-icon"><Icon name="calendar" size={22} /></span>
        <span className="db-month-text">{monthLabel(value)}</span>
        <span className={`db-month-chevron${open ? ' is-open' : ''}`}><Icon name="chevron" size={18} /></span>
      </button>

      {open && (
        <div className="db-month-pop" id={dialogId} role="dialog" aria-label="Select month and year">
          <div className="db-month-years">
            <button type="button" className="db-yr-btn" aria-label="Previous year"
                    disabled={viewYear <= minYear} onClick={() => setViewYear((y) => y - 1)}>‹</button>
            <span className="db-yr-label" aria-live="polite">{viewYear}</span>
            <button type="button" className="db-yr-btn" aria-label="Next year"
                    disabled={viewYear >= maxYear} onClick={() => setViewYear((y) => y + 1)}>›</button>
          </div>
          <div className="db-month-grid">
            {MONTH_SHORT.map((name, i) => {
              const key = monthKey(viewYear, i)
              const selected = viewYear === selectedYear && i === selectedMonth
              return (
                <button
                  key={name}
                  type="button"
                  className={`db-mo${selected ? ' is-selected' : ''}${key === today ? ' is-today' : ''}`}
                  aria-label={monthLabel(key)}
                  aria-pressed={selected}
                  onClick={() => pick(i)}
                >
                  {name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
