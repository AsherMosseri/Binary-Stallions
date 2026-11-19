import { useState } from 'react'
import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useCollection, useDoc } from '../lib/hooks'
import { useConfirm, Select } from '../components/Dialogs'
import { ROSTER, firstName } from '../config'
import { fmtDay } from '../lib/time'
import { THEMES, BRAINSTORM_PROMPTS, STAGES, ROLES } from '../data/innovation'

export default function Innovation({ me, go }) {
  const settings = useDoc('settings/innovation')
  const chosen = !!settings?.chosenId
  return (
    <div className="stack">
      <section className="panel">
        <div className="row between wrap">
          <span className="tape">Innovation project</span>
          <span className="muted small">Theme: rainforest and the living world</span>
        </div>
        {!chosen && <h2>Find our problem</h2>}
        <p className="muted">
          {chosen
            ? `Picked by coach · ${firstName(settings.approvedBy || 'Declan')}`
            : 'Brainstorm together. The coach picks one idea, then the team works through the stages.'}
        </p>
      </section>

      {!chosen ? (
        <Brainstorm me={me} />
      ) : (
        <Project me={me} go={go} settings={settings} />
      )}
    </div>
  )
}

/* ---------- Brainstorm ---------- */

function Brainstorm({ me }) {
  const confirm = useConfirm()
  const { rows } = useCollection('ideas', { order: 'createdAt', dir: 'desc', n: 200 })
  const [title, setTitle] = useState('')
  const [problem, setProblem] = useState('')
  const [who, setWho] = useState('')
  const [theme, setTheme] = useState('')
  const [promptIdx, setPromptIdx] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const sorted = rows ? [...rows].sort((a, b) => (b.votes?.length ?? 0) - (a.votes?.length ?? 0)) : null

  async function submit(e) {
    e.preventDefault()
    if (!title.trim()) return setError('Give the idea a short name.')
    setError('')
    setBusy(true)
    try {
      await addDoc(collection(db, 'ideas'), {
        title: title.trim(),
        problem: problem.trim(),
        who: who.trim(),
        theme,
        votes: [],
        status: 'idea',
        by: me.name,
        uid: me.uid,
        createdAt: serverTimestamp(),
      })
      setTitle('')
      setProblem('')
      setWho('')
      setTheme('')
    } catch (err) {
      setError(`Couldn’t post (${err.code || err.message}).`)
    } finally {
      setBusy(false)
    }
  }

  async function vote(idea) {
    const voted = (idea.votes ?? []).includes(me.uid)
    await updateDoc(doc(db, 'ideas', idea.id), { votes: voted ? arrayRemove(me.uid) : arrayUnion(me.uid) })
  }

  async function pick(idea) {
    const yes = await confirm({
      title: `Pick “${idea.title}”?`,
      message: 'This becomes our project. Everyone moves on to the stages.',
      confirmLabel: 'Pick it',
    })
    if (!yes) return
    await setDoc(
      doc(db, 'settings', 'innovation'),
      {
        chosenId: idea.id,
        chosenTitle: idea.title,
        chosenProblem: idea.problem || '',
        chosenBy: idea.by,
        approvedBy: me.name,
        approvedAt: serverTimestamp(),
      },
      { merge: true }
    )
    await updateDoc(doc(db, 'ideas', idea.id), { status: 'chosen' })
  }

  async function remove(idea) {
    const yes = await confirm({ title: `Delete “${idea.title}”?`, danger: true, confirmLabel: 'Delete' })
    if (yes) await deleteDoc(doc(db, 'ideas', idea.id))
  }

  const prompt = BRAINSTORM_PROMPTS[promptIdx]

  return (
    <>
      <section className="panel">
        <h2>Start with a question</h2>
        <p className="tip">{prompt}</p>
        <div className="row gap wrap">
          <button className="btn" onClick={() => setPromptIdx((i) => (i + 1) % BRAINSTORM_PROMPTS.length)}>Another prompt</button>
          <span className="muted small">Ideas can be small. The best ones usually start as “that’s annoying.”</span>
        </div>
      </section>

      <form className="panel" onSubmit={submit}>
        <h2>Add an idea</h2>
        <label className="field">
          <span>Idea in a few words</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="Drain filter from bottles" />
        </label>
        <label className="field">
          <span>What problem does it solve?</span>
          <textarea rows={2} value={problem} onChange={(e) => setProblem(e.target.value)} maxLength={400} placeholder="Trash clogs the drains and dirty water runs into the lake" />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>Who does it help?</span>
            <input value={who} onChange={(e) => setWho(e.target.value)} maxLength={100} placeholder="Park visitors, fish, the city" />
          </label>
          <div className="field">
            <span>Connects to</span>
            <Select value={theme} onChange={setTheme} label="Connects to" placeholder="Pick a theme" options={THEMES.map((t) => ({ v: t, label: t }))} />
          </div>
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Posting…' : 'Post idea'}</button>
      </form>

      <section className="stack">
        <h2 className="pad">Ideas ({rows?.length ?? 0})</h2>
        {!sorted && <p className="muted">Loading…</p>}
        {sorted?.length === 0 && <p className="muted">No ideas yet. Post the first one.</p>}
        {sorted?.map((idea) => {
          const voted = (idea.votes ?? []).includes(me.uid)
          return (
            <article key={idea.id} className="idea">
              <button className={voted ? 'vote on' : 'vote'} onClick={() => vote(idea)} aria-pressed={voted} aria-label={voted ? 'Remove your vote' : 'Vote for this idea'}>
                <span>▲</span>
                <b>{idea.votes?.length ?? 0}</b>
              </button>
              <div className="idea-body">
                <div className="tags">
                  {idea.theme && <span className="tag mission">{idea.theme}</span>}
                  {idea.status === 'chosen' && <span className="tag good">Picked</span>}
                </div>
                <h3>{idea.title}</h3>
                {idea.problem && <p className="muted">{idea.problem}</p>}
                {idea.who && <p className="small"><b>Helps:</b> {idea.who}</p>}
                <p className="muted small">{idea.by} · {fmtDay(idea.createdAt)}</p>
                <div className="row wrap gap">
                  {me.isAdmin && <button className="btn btn-small" onClick={() => pick(idea)}>Pick this one</button>}
                  {(me.isAdmin || idea.uid === me.uid) && <button className="linkish danger" onClick={() => remove(idea)}>Delete</button>}
                </div>
              </div>
            </article>
          )
        })}
      </section>

      <section className="panel">
        <h2>Pick a few to talk about</h2>
        <p className="muted small">Judges like teams who compare options. Before the coach picks, try asking:</p>
        <ul className="bullets">
          <li>Does this solve a problem we can actually test?</li>
          <li>Can every team member have a real job in it?</li>
          <li>Can we find three different sources about it?</li>
          <li>Could we build a prototype in a few weeks?</li>
        </ul>
      </section>
    </>
  )
}

/* ---------- Project ---------- */

function Project({ me, go, settings }) {
  const confirm = useConfirm()
  const project = useDoc('innovation/project')
  const checks = project?.checks ?? {}
  const [view, setView] = useState(null)

  const stageDone = (s) => s.items.every((_, i) => checks[`${s.id}-${i}`])
  const activeIndex = STAGES.findIndex((s) => !stageDone(s))
  const current = activeIndex === -1 ? STAGES.length - 1 : activeIndex
  const shownIndex = view ?? current
  const stage = STAGES[shownIndex]

  async function toggle(key) {
    await setDoc(
      doc(db, 'innovation', 'project'),
      { checks: { [key]: !checks[key] }, updatedBy: me.name, updatedAt: serverTimestamp() },
      { merge: true }
    )
  }

  async function unpick() {
    const yes = await confirm({
      title: 'Change the project?',
      message: 'This clears the current pick so the team can brainstorm a new one. Checklists stay saved.',
      danger: true,
      confirmLabel: 'Clear pick',
    })
    if (!yes) return
    await setDoc(doc(db, 'settings', 'innovation'), { chosenId: null, chosenTitle: '', chosenProblem: '' }, { merge: true })
    if (settings.chosenId) await updateDoc(doc(db, 'ideas', settings.chosenId), { status: 'idea' }).catch(() => {})
  }

  return (
    <>
      <section className="panel">
        <div className="row between wrap">
          <h2>{settings.chosenTitle}</h2>
          {me.isAdmin && <button className="linkish danger" onClick={unpick}>Change pick</button>}
        </div>
        {settings.chosenProblem && <p className="muted">{settings.chosenProblem}</p>}

        <ol className="stepper" aria-label="Project stages">
          {STAGES.map((s, i) => {
            const done = stageDone(s)
            const cls = i === shownIndex ? 'step on' : done ? 'step done' : 'step'
            return (
              <li key={s.id}>
                <button className={cls} onClick={() => setView(i)} aria-current={i === shownIndex ? 'step' : undefined}>
                  <span className="step-n">{done ? '✓' : i + 1}</span>
                  <span>{s.title}</span>
                </button>
              </li>
            )
          })}
        </ol>
        {activeIndex === -1 && <p className="good">Every stage is checked off. Practice the presentation and you’re ready.</p>}
      </section>

      <section className="panel stage">
        <div className="row between wrap">
          <h2>{stage.title}</h2>
          <span className="muted small">{stage.items.filter((_, i) => checks[`${stage.id}-${i}`]).length}/{stage.items.length} done</span>
        </div>
        <p><b>Goal:</b> {stage.goal}</p>
        <p className="example"><b>What good looks like:</b> {stage.example}</p>

        <ul className="checklist">
          {stage.items.map((item, i) => {
            const key = `${stage.id}-${i}`
            return (
              <li key={key}>
                <label>
                  <input type="checkbox" checked={!!checks[key]} onChange={() => toggle(key)} />
                  <span>{item}</span>
                </label>
              </li>
            )
          })}
        </ul>

        {stage.id === 'identify' && <Research me={me} />}
        {stage.id === 'design' && <Roles project={project} me={me} />}
        {stage.id === 'iterate' && <Feedback me={me} />}
        {stage.id === 'communicate' && <Presentation project={project} me={me} go={go} />}
        {stage.id === 'create' && <Notes project={project} me={me} stageId="create" label="Build notes" placeholder="What you built, what broke, what you fixed" />}
      </section>
    </>
  )
}

function Research({ me }) {
  const confirm = useConfirm()
  const { rows } = useCollection('research', { order: 'createdAt', dir: 'asc', n: 100 })
  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')
  const [takeaway, setTakeaway] = useState('')

  async function add(e) {
    e.preventDefault()
    if (!title.trim()) return
    await addDoc(collection(db, 'research'), {
      title: title.trim(), link: link.trim(), takeaway: takeaway.trim(),
      by: me.name, uid: me.uid, createdAt: serverTimestamp(),
    })
    setTitle(''); setLink(''); setTakeaway('')
  }

  return (
    <div className="sub-card">
      <h3>Sources ({rows?.length ?? 0} of 3 minimum)</h3>
      <form className="form-grid" onSubmit={add}>
        <label className="field"><span>Source</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="City water report 2025" /></label>
        <label className="field"><span>Link (optional)</span><input value={link} onChange={(e) => setLink(e.target.value)} inputMode="url" /></label>
        <label className="field wide"><span>What it taught us</span><input value={takeaway} onChange={(e) => setTakeaway(e.target.value)} placeholder="Turbidity spikes after rain on 6 of 8 days" /></label>
        <button className="btn wide">Add source</button>
      </form>
      <ul className="cards">
        {rows?.map((r) => (
          <li key={r.id} className="mini-card">
            <strong>{r.title}</strong>
            {r.takeaway && <p className="muted small">{r.takeaway}</p>}
            <div className="row between small">
              {r.link ? <a href={r.link} target="_blank" rel="noreferrer">Open ↗</a> : <span />}
              {(me.isAdmin || r.uid === me.uid) && (
                <button className="linkish danger" onClick={async () => { if (await confirm({ title: 'Delete this source?', danger: true, confirmLabel: 'Delete' })) deleteDoc(doc(db, 'research', r.id)) }}>Delete</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Roles({ project, me }) {
  const roles = project?.roles ?? {}
  const people = ROSTER.map((r) => ({ v: r.name, label: r.name }))
  async function setRole(role, name) {
    await setDoc(
      doc(db, 'innovation', 'project'),
      { roles: { [role]: name }, updatedBy: me.name, updatedAt: serverTimestamp() },
      { merge: true }
    )
  }
  return (
    <div className="sub-card">
      <h3>Who does what</h3>
      <p className="muted small">Judges check that everyone contributed. Give every person a real job.</p>
      <div className="form-grid">
        {ROLES.map((role) => (
          <div className="field" key={role}>
            <span>{role}</span>
            <Select value={roles[role] || ''} onChange={(v) => setRole(role, v)} label={role} placeholder="Nobody yet" options={people} />
          </div>
        ))}
      </div>
    </div>
  )
}

function Feedback({ me }) {
  const confirm = useConfirm()
  const { rows } = useCollection('feedback', { order: 'createdAt', dir: 'asc', n: 100 })
  const [who, setWho] = useState('')
  const [feedback, setFeedback] = useState('')
  const [change, setChange] = useState('')

  async function add(e) {
    e.preventDefault()
    if (!feedback.trim()) return
    await addDoc(collection(db, 'feedback'), {
      who: who.trim(), feedback: feedback.trim(), change: change.trim(),
      by: me.name, uid: me.uid, createdAt: serverTimestamp(),
    })
    setWho(''); setFeedback(''); setChange('')
  }

  return (
    <div className="sub-card">
      <h3>Feedback log</h3>
      <p className="muted small">Who you showed it to, what they said, and what you changed because of it.</p>
      <form className="form-grid" onSubmit={add}>
        <label className="field"><span>Shared with</span><input value={who} onChange={(e) => setWho(e.target.value)} placeholder="Park ranger, 6th grade class" /></label>
        <label className="field"><span>What they said</span><input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Needs a bigger opening" /></label>
        <label className="field wide"><span>What we changed</span><input value={change} onChange={(e) => setChange(e.target.value)} placeholder="Doubled the opening, retested" /></label>
        <button className="btn wide">Add feedback</button>
      </form>
      <ul className="cards">
        {rows?.map((f) => (
          <li key={f.id} className="mini-card">
            <strong>{f.who || 'Someone'}</strong>
            <p className="small">“{f.feedback}”</p>
            {f.change && <p className="small good">→ {f.change}</p>}
            <div className="row between small">
              <span className="muted">{f.by?.split(' ')[0]}</span>
              {(me.isAdmin || f.uid === me.uid) && (
                <button className="linkish danger" onClick={async () => { if (await confirm({ title: 'Delete this feedback?', danger: true, confirmLabel: 'Delete' })) deleteDoc(doc(db, 'feedback', f.id)) }}>Delete</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Presentation({ project, me, go }) {
  return (
    <div className="sub-card">
      <h3>Presentation</h3>
      <p className="muted small">Judges give you a short time. Open with the problem, show the research, demo, then the change you made.</p>
      <Notes project={project} me={me} stageId="presentation" label="Script and cues" placeholder="1. The problem (30s)&#10;2. Research (60s)&#10;3. Demo (90s)&#10;4. The change we made (60s)" />
      <div className="row wrap gap">
        <button className="btn" onClick={() => go('match')}>Open the 2:30 timer</button>
        <button className="btn" onClick={() => go('judging')}>Practice judge questions</button>
      </div>
    </div>
  )
}

function Notes({ project, me, stageId, label, placeholder }) {
  const saved = project?.notes?.[stageId] ?? ''
  const [draft, setDraft] = useState(null)
  const value = draft ?? saved

  async function save() {
    if (draft === null || draft === saved) return setDraft(null)
    await setDoc(
      doc(db, 'innovation', 'project'),
      { notes: { [stageId]: draft }, updatedBy: me.name, updatedAt: serverTimestamp() },
      { merge: true }
    )
    setDraft(null)
  }

  return (
    <label className="field">
      <span>{label}</span>
      <textarea rows={4} value={value} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} onBlur={save} />
    </label>
  )
}
