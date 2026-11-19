import { useState } from 'react'
import { addDoc, collection, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useCollection, useDoc } from '../lib/hooks'
import { MISSIONS } from '../data/season'

const PRECHECK = [
  'Robot and all equipment fit one launch area under 12 in. (305 mm)',
  'Controller charged, or six AA batteries in the pack',
  'Each motor and sensor tested on the table',
  'Attachments in labeled bags, matching the bag list',
  'Mission models checked against the building instructions',
  'Dual Lock fresh and clicking on the docks',
  'Mine, City, and Farm docks set up for missions 13 to 15',
  'Six precision tokens packed',
  'One sheet of notebook paper for program notes',
  'Program loaded and tested on the table',
  'Spare parts and tools in the bin',
  'Technician plan: who stands on which side',
]

const LIMITS = [
  ['Controller', 'One, maximum.'],
  ['Motors', 'Four, maximum, any mix.'],
  ['Sensors', 'Touch/force, color, distance/ultrasonic, and gyro. Any mix and number.'],
  ['Power', 'Controller battery pack or six AA batteries, plus one microSD card.'],
  ['Other', 'Any non-electric LEGO pieces. Wires and pneumatic tubes, cut to length if needed.'],
  ['Notes', 'One sheet of notebook paper for program notes. Extra or duplicate mission models are not allowed.'],
  ['Remote', 'No remote controllers of any kind. The robot runs on its own.'],
]

export default function Gear({ me }) {
  return (
    <div className="stack">
      <section className="panel">
        <h2>Equipment limits</h2>
        <dl className="limits">
          {LIMITS.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>
      <PreMatch me={me} />
      <Attachments me={me} />
      <CodeLog me={me} />
    </div>
  )
}

function PreMatch({ me }) {
  const pc = useDoc('precheck/current')
  const checks = pc?.checks ?? {}
  const done = PRECHECK.filter((_, i) => checks[i]).length

  async function toggle(i) {
    await setDoc(
      doc(db, 'precheck', 'current'),
      { checks: { ...checks, [i]: !checks[i] }, updatedBy: me.name, updatedAt: serverTimestamp() },
      { merge: true }
    )
  }
  async function reset() {
    if (!window.confirm('Clear the pre-match checklist?')) return
    await setDoc(doc(db, 'precheck', 'current'), { checks: {}, updatedBy: me.name, updatedAt: serverTimestamp() }, { merge: true })
  }

  return (
    <section className="panel">
      <div className="row between wrap">
        <h2>Pre-match checklist</h2>
        <span className="stamp"><strong>{done}/{PRECHECK.length}</strong></span>
      </div>
      <ul className="checklist">
        {PRECHECK.map((item, i) => (
          <li key={item}>
            <label>
              <input type="checkbox" checked={!!checks[i]} onChange={() => toggle(i)} />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>
      <button className="linkish" onClick={reset}>Clear checklist</button>
    </section>
  )
}

function Attachments({ me }) {
  const { rows } = useCollection('attachments', { order: 'createdAt', dir: 'asc', n: 200 })
  const [name, setName] = useState('')
  const [bag, setBag] = useState('')
  const [notes, setNotes] = useState('')
  const [link, setLink] = useState('')
  const [error, setError] = useState('')

  async function add(e) {
    e.preventDefault()
    if (!name.trim()) return setError('Give it a name.')
    setError('')
    await addDoc(collection(db, 'attachments'), {
      name: name.trim(),
      bag: bag.trim(),
      notes: notes.trim(),
      link: link.trim(),
      by: me.name,
      uid: me.uid,
      createdAt: serverTimestamp(),
    })
    setName('')
    setBag('')
    setNotes('')
    setLink('')
  }

  return (
    <section className="panel">
      <h2>Attachments</h2>
      <p className="muted small">What we built, what bag it lives in, and what it does. Paste a photo link if you have one.</p>
      <form className="form-grid" onSubmit={add}>
        <label className="field"><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Drone launcher" /></label>
        <label className="field"><span>Bag #</span><input value={bag} onChange={(e) => setBag(e.target.value)} placeholder="1" /></label>
        <label className="field wide"><span>What it does</span><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Pushes the drone off the pad" /></label>
        <label className="field wide"><span>Photo link (optional)</span><input value={link} onChange={(e) => setLink(e.target.value)} inputMode="url" /></label>
        {error && <p className="error wide">{error}</p>}
        <button className="btn wide">Add attachment</button>
      </form>
      <ul className="cards">
        {rows?.map((a) => (
          <li key={a.id} className="mini-card">
            <div className="row between">
              <strong>{a.name}</strong>
              {a.bag && <span className="tag">Bag {a.bag}</span>}
            </div>
            {a.notes && <p className="muted small">{a.notes}</p>}
            <div className="row between small">
              {a.link ? <a href={a.link} target="_blank" rel="noreferrer">Photo ↗</a> : <span />}
              {(me.isAdmin || a.uid === me.uid) && (
                <button className="linkish danger" onClick={() => window.confirm('Delete?') && deleteDoc(doc(db, 'attachments', a.id))}>Delete</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function CodeLog({ me }) {
  const { rows } = useCollection('codeVersions', { order: 'createdAt', dir: 'desc', n: 100 })
  const [program, setProgram] = useState('')
  const [version, setVersion] = useState('')
  const [missions, setMissions] = useState([])
  const [status, setStatus] = useState('testing')
  const [notes, setNotes] = useState('')

  const toggle = (id) => setMissions((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]))

  async function add(e) {
    e.preventDefault()
    if (!program.trim()) return
    await addDoc(collection(db, 'codeVersions'), {
      program: program.trim(),
      version: version.trim(),
      missions: [...missions].sort(),
      status,
      notes: notes.trim(),
      by: me.name,
      uid: me.uid,
      createdAt: serverTimestamp(),
    })
    setProgram('')
    setVersion('')
    setMissions([])
    setNotes('')
  }

  return (
    <section className="panel">
      <h2>Code log</h2>
      <p className="muted small">Log every program version so you know which one ran which missions.</p>
      <form className="form-grid" onSubmit={add}>
        <label className="field"><span>Program</span><input value={program} onChange={(e) => setProgram(e.target.value)} placeholder="Main run" /></label>
        <label className="field"><span>Version</span><input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="v4" /></label>
        <div className="field wide">
          <span>Missions it runs</span>
          <div className="chips">
            {MISSIONS.map((m) => (
              <button type="button" key={m.id} className={missions.includes(m.id) ? 'chip on' : 'chip'} onClick={() => toggle(m.id)}>{m.id}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <span>Status</span>
          <div className="seg">
            {['testing', 'works', 'retired'].map((s) => (
              <button type="button" key={s} className={status === s ? 'on' : ''} onClick={() => setStatus(s)}>{s}</button>
            ))}
          </div>
        </div>
        <label className="field wide"><span>What changed</span><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Faster drone launch, lower speed on the way back" /></label>
        <button className="btn wide">Log version</button>
      </form>
      <ul className="cards">
        {rows?.map((c) => (
          <li key={c.id} className="mini-card">
            <div className="row between">
              <strong>{c.program} {c.version}</strong>
              <span className={`tag ${c.status === 'works' ? 'good' : c.status === 'retired' ? 'muted-tag' : ''}`}>{c.status}</span>
            </div>
            {c.missions?.length > 0 && (
              <div className="tags">{c.missions.map((m) => <span key={m} className="tag mission">{m}</span>)}</div>
            )}
            {c.notes && <p className="muted small">{c.notes}</p>}
            <p className="muted small">{c.by?.split(' ')[0]}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
