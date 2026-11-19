import { useEffect, useState } from 'react'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { useDoc } from '../lib/hooks'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../firebase'
import { ROSTER, emailFor, firstName } from '../config'
import { daysUntil } from '../lib/time'
import { useConfirm, DateField, Select } from '../components/Dialogs'

export default function Admin({ me }) {
  if (!me.isAdmin) return <p className="muted">Coach only.</p>
  return (
    <div className="stack">
      <PinReset me={me} />
      <PlanEditor me={me} />
      <Settings me={me} />
      <section className="panel">
        <h2>Coach tools</h2>
        <ul className="bullets">
          <li>Delete any team message, log entry, run, or attachment from the tab it lives in.</li>
          <li>Read and answer private messages in Chat, under “Private inbox.”</li>
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
        <label className="field"><span>Date</span><DateField value={date} onChange={setDate} label="Qualifier date" /></label>
      </div>
      <p className="muted small">{days === null ? 'No date set yet.' : `${days} days from today.`}</p>
      <div className="row gap">
        <button className="btn btn-primary">Save</button>
        {saved && <span className="good">{saved}</span>}
      </div>
    </form>
  )
}

function PlanEditor({ me }) {
  const confirm = useConfirm()
  const plan = useDoc('settings/plan')
  const [scope, setScope] = useState('day')
  const [label, setLabel] = useState('')
  const [text, setText] = useState('')
  const [saved, setSaved] = useState('')

  useEffect(() => {
    if (plan) {
      setScope(plan.scope ?? 'day')
      setLabel(plan.label ?? '')
      setText((plan.items ?? []).join('\n'))
    }
  }, [plan])

  async function write(items) {
    await setDoc(doc(db, 'settings', 'plan'), {
      scope,
      label: label.trim() || (scope === 'week' ? 'This week' : 'Today'),
      items,
      updatedBy: me.name,
      updatedAt: serverTimestamp(),
    })
  }

  async function save(e) {
    e.preventDefault()
    const items = text.split('\n').map((x) => x.trim()).filter(Boolean)
    await write(items)
    setSaved(items.length ? 'Posted to HQ' : 'Cleared')
    setTimeout(() => setSaved(''), 1800)
  }

  async function clear() {
    if (!(await confirm({ title: 'Clear the plan?', message: 'HQ will stop showing it.', danger: true, confirmLabel: 'Clear' }))) return
    setText('')
    await write([])
  }

  return (
    <form className="panel" onSubmit={save}>
      <h2>Plan for the team</h2>
      <p className="muted small">Write what we’re doing, one item per line. It shows at the top of HQ.</p>
      <div className="seg wide">
        <button type="button" className={scope === 'day' ? 'on' : ''} onClick={() => setScope('day')}>Today</button>
        <button type="button" className={scope === 'week' ? 'on' : ''} onClick={() => setScope('week')}>This week</button>
      </div>
      <label className="field">
        <span>Heading (optional)</span>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={scope === 'week' ? 'Week of Nov 18' : 'Thursday practice'} />
      </label>
      <label className="field">
        <span>Plan</span>
        <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Tune M08 launch\nRun the full 2:30 five times\nJudging practice at 5'} />
      </label>
      <div className="row gap wrap">
        <button className="btn btn-primary">Post to HQ</button>
        <button type="button" className="linkish danger" onClick={clear}>Clear</button>
        {saved && <span className="good">{saved}</span>}
      </div>
    </form>
  )
}

function PinReset() {
  const confirm = useConfirm()
  const people = ROSTER.filter((r) => !r.admin)
  const [who, setWho] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null)

  async function clear(e) {
    e.preventDefault()
    setStatus(null)
    if (!who) return setStatus({ ok: false, text: 'Pick a person.' })

    const yes = await confirm({
      title: `Clear ${firstName(who)}’s PIN?`,
      message: 'Their current PIN stops working. The next time they sign in, they pick a new one.',
      confirmLabel: 'Clear PIN',
      danger: true,
    })
    if (!yes) return

    setBusy(true)
    try {
      await httpsCallable(functions, 'requestPinReset')({ email: emailFor(who) })
      setStatus({ ok: true, text: `${firstName(who)}’s PIN is cleared. They’ll set a new one when they sign in.` })
      setWho('')
    } catch (err) {
      setStatus({ ok: false, text: err.message || 'Something went wrong. Try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="panel" onSubmit={clear}>
      <h2>Clear a PIN</h2>
      <p className="muted small">
        Forgot a PIN? Clear it here. The person picks a new PIN themselves when they sign in. You never see or set their PIN.
      </p>
      <div className="field">
        <span>Person</span>
        <Select value={who} onChange={setWho} label="Person" placeholder="Choose…" options={people.map((p) => ({ v: p.name, label: p.name }))} />
      </div>
      {status && <p className={status.ok ? 'good' : 'error'} role="status">{status.text}</p>}
      <div className="row">
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Clearing…' : 'Clear PIN'}</button>
      </div>
    </form>
  )
}
