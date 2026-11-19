import { useState } from 'react'
import { addDoc, collection, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useCollection } from '../lib/hooks'
import { MISSIONS } from '../data/season'
import { todayIso, fmtDay, fmtTime } from '../lib/time'

const EXTRAS = ['Innovation Project', 'Robot Design', 'Attachments', 'Code', 'Practice run', 'Judging prep', 'Build', 'Outreach']

export default function DailyLog({ me }) {
  const logs = useCollection('logs', { order: 'createdAt', n: 100 })
  const [date, setDate] = useState(todayIso())
  const [missions, setMissions] = useState([])
  const [extras, setExtras] = useState([])
  const [what, setWhat] = useState('')
  const [next, setNext] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const toggle = (list, setList, v) => setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  async function submit(e) {
    e.preventDefault()
    if (!what.trim() && missions.length === 0 && extras.length === 0) {
      return setError('Pick what you worked on, or write a line.')
    }
    setError('')
    setSaving(true)
    try {
      await addDoc(collection(db, 'logs'), {
        date,
        missions: [...missions].sort(),
        extras,
        what: what.trim(),
        next: next.trim(),
        by: me.name,
        uid: me.uid,
        createdAt: serverTimestamp(),
      })
      setMissions([])
      setExtras([])
      setWhat('')
      setNext('')
    } catch (err) {
      setError(`Couldn’t post (${err.code || err.message}).`)
    } finally {
      setSaving(false)
    }
  }

  async function remove(l) {
    if (!window.confirm('Delete this entry?')) return
    await deleteDoc(doc(db, 'logs', l.id))
  }

  return (
    <div className="stack">
      <form className="panel" onSubmit={submit}>
        <h2>What did we do today?</h2>
        <label className="field">
          <span>Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        <p className="field-label">Missions we worked on</p>
        <div className="chips">
          {MISSIONS.map((m) => (
            <button
              type="button"
              key={m.id}
              className={missions.includes(m.id) ? 'chip on' : 'chip'}
              onClick={() => toggle(missions, setMissions, m.id)}
            >
              {m.id}
            </button>
          ))}
        </div>

        <p className="field-label">Other work</p>
        <div className="chips">
          {EXTRAS.map((x) => (
            <button
              type="button"
              key={x}
              className={extras.includes(x) ? 'chip on' : 'chip'}
              onClick={() => toggle(extras, setExtras, x)}
            >
              {x}
            </button>
          ))}
        </div>

        <label className="field">
          <span>What happened (tell the whole team)</span>
          <textarea rows={3} value={what} onChange={(e) => setWhat(e.target.value)} placeholder="M01 went 3 for 4 today. The LiDAR flip needs a longer arm." />
        </label>
        <label className="field">
          <span>What’s next</span>
          <textarea rows={2} value={next} onChange={(e) => setNext(e.target.value)} placeholder="Tune the drone launch, then run it 10 times." />
        </label>

        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" disabled={saving}>{saving ? 'Posting…' : 'Post to the team'}</button>
      </form>

      <section className="stack">
        <h2 className="pad">Team log</h2>
        {!logs.rows && <p className="muted">Loading…</p>}
        {logs.rows?.length === 0 && <p className="muted">Nothing yet.</p>}
        {logs.rows?.map((l) => (
          <article key={l.id} className="log-card">
            <div className="meta">
              <strong>{l.by}</strong>
              <span>{l.date || fmtDay(l.createdAt)}</span>
              {l.createdAt && <span>{fmtTime(l.createdAt)}</span>}
            </div>
            {(l.missions?.length > 0 || l.extras?.length > 0) && (
              <div className="tags">
                {l.missions?.map((m) => <span key={m} className="tag mission">{m}</span>)}
                {l.extras?.map((x) => <span key={x} className="tag">{x}</span>)}
              </div>
            )}
            {l.what && <p>{l.what}</p>}
            {l.next && <p className="next"><b>Next:</b> {l.next}</p>}
            {(me.isAdmin || l.uid === me.uid) && (
              <button className="linkish danger" onClick={() => remove(l)}>Delete</button>
            )}
          </article>
        ))}
      </section>
    </div>
  )
}
