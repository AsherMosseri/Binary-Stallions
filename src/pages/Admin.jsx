import { useEffect, useState } from 'react'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useDoc } from '../lib/hooks'
import { daysUntil } from '../lib/time'

export default function Admin({ me }) {
  if (!me.isAdmin) return <p className="muted">Coach only.</p>
  return (
    <div className="stack">
      <Settings me={me} />
      <section className="panel">
        <h2>Coach tools</h2>
        <ul className="bullets">
          <li>Delete any team message, log entry, run, or attachment from the tab it lives in.</li>
          <li>Read and answer private messages in Chat, under “Private inbox.”</li>
          <li>Reset someone’s PIN: remove their account in Firebase → Authentication → Users. They can sign in again and pick a new PIN.</li>
        </ul>
      </section>
    </div>
  )
}

function Settings({ me }) {
  const s = useDoc('settings/team')
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [saved, setSaved] = useState('')

  useEffect(() => {
    if (s) {
      setName(s.qualifierName ?? '')
      setDate(s.qualifierDate ?? '')
    }
  }, [s])

  async function save(e) {
    e.preventDefault()
    await setDoc(
      doc(db, 'settings', 'team'),
      { qualifierName: name.trim(), qualifierDate: date, updatedBy: me.name, updatedAt: serverTimestamp() },
      { merge: true }
    )
    setSaved('Saved')
    setTimeout(() => setSaved(''), 1800)
  }

  const days = daysUntil(date)

  return (
    <form className="panel" onSubmit={save}>
      <h2>Qualifier</h2>
      <div className="form-grid">
        <label className="field"><span>Event name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="North Broward Qualifier" /></label>
        <label className="field"><span>Date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      </div>
      <p className="muted small">{days === null ? 'No date set yet.' : `${days} days from today.`}</p>
      <div className="row gap">
        <button className="btn btn-primary">Save</button>
        {saved && <span className="good">{saved}</span>}
      </div>
    </form>
  )
}
