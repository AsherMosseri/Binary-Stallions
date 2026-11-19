import { createContext, useCallback, useContext, useEffect, useState } from 'react'

/* ---------- Shared sheet shell ---------- */
function Sheet({ onClose, label, children, size = 'sm' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <div
        className={`sheet-panel sheet-${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

/* ---------- Confirm (replaces window.confirm) ---------- */
const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [req, setReq] = useState(null)

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        setReq({ ...opts, resolve })
      }),
    []
  )

  const answer = (ok) => {
    req?.resolve(ok)
    setReq(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {req && (
        <Sheet onClose={() => answer(false)} label={req.title} size="sm">
          <h2 className="sheet-title">{req.title}</h2>
          {req.message && <p className="muted">{req.message}</p>}
          <div className="sheet-actions">
            <button className="btn ghost" onClick={() => answer(false)}>
              {req.cancelLabel || 'Cancel'}
            </button>
            <button className={req.danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={() => answer(true)} autoFocus>
              {req.confirmLabel || 'OK'}
            </button>
          </div>
        </Sheet>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  return useContext(ConfirmContext)
}

/* ---------- Select (replaces native <select>) ---------- */
export function Select({ value, onChange, options, placeholder = 'Choose…', label, id }) {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.v === value)

  return (
    <>
      <button
        type="button"
        id={id}
        className="select-trigger"
        onClick={() => setOpen(true)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
      >
        <span className={current ? '' : 'muted'}>{current ? current.label : placeholder}</span>
        <span className="chevron" aria-hidden="true">⌄</span>
      </button>
      {open && (
        <Sheet onClose={() => setOpen(false)} label={label || 'Choose one'} size="md">
          <h2 className="sheet-title">{label || 'Choose one'}</h2>
          <ul className="option-list" role="listbox">
            {options.map((o) => (
              <li key={o.v}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.v === value}
                  className={o.v === value ? 'option on' : 'option'}
                  onClick={() => {
                    onChange(o.v)
                    setOpen(false)
                  }}
                >
                  <span>{o.label}</span>
                  {o.v === value && <span aria-hidden="true">✓</span>}
                </button>
              </li>
            ))}
          </ul>
        </Sheet>
      )}
    </>
  )
}

/* ---------- DateField (replaces native date input) ---------- */
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function parseIso(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function toIso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function DateField({ value, onChange, label = 'Date' }) {
  const [open, setOpen] = useState(false)
  const selected = parseIso(value)
  const shown = selected
    ? selected.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'Pick a date'

  return (
    <>
      <button type="button" className="select-trigger" onClick={() => setOpen(true)} aria-label={label}>
        <span className={selected ? '' : 'muted'}>{shown}</span>
        <span className="chevron" aria-hidden="true">▾</span>
      </button>
      {open && (
        <Sheet onClose={() => setOpen(false)} label={label} size="md">
          <Calendar
            value={selected}
            onPick={(d) => {
              onChange(toIso(d))
              setOpen(false)
            }}
          />
        </Sheet>
      )}
    </>
  )
}

function Calendar({ value, onPick }) {
  const today = new Date()
  const [view, setView] = useState(() => {
    const base = value ?? today
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const first = view.getDay()
  const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  const monthName = view.toLocaleDateString([], { month: 'long', year: 'numeric' })
  const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  return (
    <div className="calendar">
      <div className="cal-head">
        <button type="button" className="cal-nav" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} aria-label="Previous month">‹</button>
        <strong>{monthName}</strong>
        <button type="button" className="cal-nav" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} aria-label="Next month">›</button>
      </div>
      <div className="cal-grid">
        {WEEKDAYS.map((w) => <span key={w} className="cal-wd">{w}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />
          const date = new Date(view.getFullYear(), view.getMonth(), d)
          return (
            <button
              type="button"
              key={d}
              className={`cal-day ${sameDay(date, value) ? 'on' : ''} ${sameDay(date, today) ? 'today' : ''}`}
              onClick={() => onPick(date)}
            >
              {d}
            </button>
          )
        })}
      </div>
      <div className="cal-foot">
        <button type="button" className="linkish" onClick={() => onPick(today)}>Today</button>
      </div>
    </div>
  )
}

