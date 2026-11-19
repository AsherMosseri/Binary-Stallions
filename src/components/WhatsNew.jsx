import { useEffect } from 'react'
import { RELEASES, CURRENT_VERSION } from '../data/changelog'

export default function WhatsNew({ onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section className="sheet-panel" role="dialog" aria-modal="true" aria-label="Update log" onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <h2>Update log</h2>
          <button className="linkish" onClick={onClose}>Close</button>
        </div>
        <p className="muted small">You’re on v{CURRENT_VERSION}.</p>
        {RELEASES.map((r) => (
          <article key={r.version} className="release">
            <div className="row between wrap">
              <strong>v{r.version} · {r.title}</strong>
              <span className="tag">{r.date}</span>
            </div>
            <ul>
              {r.items.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </article>
        ))}
      </section>
    </div>
  )
}
