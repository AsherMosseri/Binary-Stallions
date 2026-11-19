import { useState } from 'react'
import { RELEASES, CURRENT_VERSION } from '../data/changelog'
import { getSeenVersion, markSeen } from '../lib/seen'

// Shows the newest release once per device, until the person taps "Got it".
export default function UpdateCard() {
  const [seen, setSeen] = useState(() => getSeenVersion() === CURRENT_VERSION)
  if (seen) return null
  const latest = RELEASES[0]

  return (
    <section className="panel update-card">
      <div className="row between wrap">
        <span className="tape">New update · v{latest.version}</span>
        <span className="muted small">{latest.date}</span>
      </div>
      <h2>{latest.title}</h2>
      <ul>
        {latest.items.map((i) => <li key={i}>{i}</li>)}
      </ul>
      <p className="muted small">Full history: tap the version at the bottom of the app.</p>
      <button
        className="btn btn-primary"
        onClick={() => {
          markSeen(CURRENT_VERSION)
          setSeen(true)
        }}
      >
        Got it
      </button>
    </section>
  )
}
