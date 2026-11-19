import { useState } from 'react'
import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useCollection } from '../lib/hooks'
import { fmtDay } from '../lib/time'
import { useConfirm, Select } from '../components/Dialogs'

const TYPES = [
  { v: 'feature', label: 'Feature' },
  { v: 'bug', label: 'Bug' },
  { v: 'idea', label: 'Idea' },
]

const STATUSES = [
  { v: 'open', label: 'Open' },
  { v: 'planned', label: 'Planned' },
  { v: 'working', label: 'Working on it' },
  { v: 'done', label: 'Done' },
  { v: 'wont', label: 'Won’t do' },
]

export default function Requests({ me }) {
  const { rows } = useCollection('requests', { order: 'createdAt', n: 200 })
  const [type, setType] = useState('feature')
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!title.trim()) return setError('Give it a short title.')
    setError('')
    setBusy(true)
    try {
      await addDoc(collection(db, 'requests'), {
        type,
        title: title.trim(),
        details: details.trim(),
        status: 'open',
        votes: [],
        by: me.name,
        uid: me.uid,
        createdAt: serverTimestamp(),
      })
      setTitle('')
      setDetails('')
    } catch (err) {
      setError(`Couldn’t send (${err.code || err.message}).`)
    } finally {
      setBusy(false)
    }
  }

  const sorted = rows
    ? [...rows].sort((a, b) => (b.votes?.length ?? 0) - (a.votes?.length ?? 0))
    : null

  return (
    <div className="stack">
      <form className="panel" onSubmit={submit}>
        <h2>Request something</h2>
        <p className="muted small">Feature you want, something that’s broken, or an idea. Coach reads everything.</p>
        <div className="seg wide">
          {TYPES.map((t) => (
            <button type="button" key={t.v} className={type === t.v ? 'on' : ''} onClick={() => setType(t.v)}>{t.label}</button>
          ))}
        </div>
        <label className="field">
          <span>Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder={type === 'bug' ? 'Timer skips a second at 0:30' : 'Dark mode for the match page'} />
        </label>
        <label className="field">
          <span>Details (optional)</span>
          <textarea rows={3} value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} placeholder={type === 'bug' ? 'What you did, what happened, what should have happened' : 'What would it do?'} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send request'}</button>
      </form>

      <section className="stack">
        <h2 className="pad">Board</h2>
        {!sorted && <p className="muted">Loading…</p>}
        {sorted?.length === 0 && <p className="muted">Nothing yet. Be the first.</p>}
        {sorted?.map((r) => (
          <RequestCard key={r.id} r={r} me={me} />
        ))}
      </section>
    </div>
  )
}

function RequestCard({ r, me }) {
  const voted = (r.votes ?? []).includes(me.uid)
  const count = r.votes?.length ?? 0
  const status = STATUSES.find((s) => s.v === (r.status ?? 'open')) ?? STATUSES[0]
  const closed = status.v === 'done' || status.v === 'wont'
  const canDelete = me.isAdmin || r.uid === me.uid
  const confirm = useConfirm()

  async function vote() {
    await updateDoc(doc(db, 'requests', r.id), { votes: voted ? arrayRemove(me.uid) : arrayUnion(me.uid) })
  }
  async function setStatus(v) {
    await updateDoc(doc(db, 'requests', r.id), { status: v, statusBy: me.name })
  }
  async function remove() {
    if (await confirm({ title: `Delete “${r.title}”?`, danger: true, confirmLabel: 'Delete' })) await deleteDoc(doc(db, 'requests', r.id))
  }

  return (
    <article className={`request ${closed ? 'closed' : ''}`}>
      <button className={voted ? 'vote on' : 'vote'} onClick={vote} aria-pressed={voted} aria-label={voted ? 'Remove your vote' : 'Vote for this'}>
        <span>▲</span>
        <b>{count}</b>
      </button>
      <div className="request-body">
        <div className="tags">
          <span className={`tag ${r.type === 'bug' ? 'bug' : ''}`}>{r.type || 'feature'}</span>
          <span className={`tag ${status.v === 'done' ? 'good' : ''}`}>{status.label}</span>
        </div>
        <h3>{r.title}</h3>
        {r.details && <p className="muted">{r.details}</p>}
        <p className="muted small">{r.by} · {fmtDay(r.createdAt)}</p>
        {me.isAdmin ? (
          <div className="row wrap gap">
            <Select value={status.v} onChange={setStatus} options={STATUSES} label="Status" />
            <button className="linkish danger" onClick={remove}>Delete</button>
          </div>
        ) : (
          canDelete && <button className="linkish danger" onClick={remove}>Delete</button>
        )}
      </div>
    </article>
  )
}
