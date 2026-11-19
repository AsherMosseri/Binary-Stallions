import { useMemo, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useCollection } from '../lib/hooks'
import { MISSIONS, PRECISION_POINTS, EQUIPMENT_POINTS, GP_LEVELS } from '../data/season'
import { defaultValues, scoreRun, MAX_ROBOT } from '../lib/scoring'
import { missionStats, trendOf } from '../lib/stats'
import { todayIso, fmtDay } from '../lib/time'

export default function Scores({ me }) {
  const [view, setView] = useState('log')
  return (
    <div className="stack">
      <div className="seg wide" role="tablist">
        <button className={view === 'log' ? 'on' : ''} onClick={() => setView('log')}>Log a run</button>
        <button className={view === 'history' ? 'on' : ''} onClick={() => setView('history')}>History & trend</button>
      </div>
      {view === 'log' ? <Scoresheet me={me} onSaved={() => setView('history')} /> : <History me={me} />}
    </div>
  )
}

function Scoresheet({ me, onSaved }) {
  const [type, setType] = useState('practice')
  const [label, setLabel] = useState('')
  const [date, setDate] = useState(todayIso())
  const [values, setValues] = useState(defaultValues)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const result = useMemo(() => scoreRun(values), [values])

  const setField = (missionId, key, value) =>
    setValues((prev) => ({ ...prev, [missionId]: { ...prev[missionId], [key]: value } }))

  async function save() {
    setError('')
    setSaving(true)
    try {
      await addDoc(collection(db, 'runs'), {
        date,
        type,
        label: label.trim() || (type === 'practice' ? 'Practice run' : 'Competition run'),
        values,
        byMission: result.byMission,
        missions: result.missions,
        equipment: result.equipment,
        tokens: result.tokens,
        robot: result.robot,
        total: result.robot,
        gp: result.gp,
        by: me.name,
        uid: me.uid,
        createdAt: serverTimestamp(),
      })
      setValues(defaultValues())
      setLabel('')
      onSaved()
    } catch (e) {
      setError(`Couldn’t save (${e.code || e.message}).`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <section className="panel">
        <div className="form-grid">
          <div className="seg">
            <button className={type === 'practice' ? 'on' : ''} onClick={() => setType('practice')}>Practice</button>
            <button className={type === 'competition' ? 'on' : ''} onClick={() => setType('competition')}>Competition</button>
          </div>
          <label className="field">
            <span>{type === 'practice' ? 'Scrimmage or practice' : 'Event name'}</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={type === 'practice' ? 'Scrimmage #3' : 'North Broward'} />
          </label>
          <label className="field">
            <span>Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>
      </section>

      <section className="panel">
        <h2>Before the match</h2>
        <div className="field-row">
          <div className="field-label">Robot and all equipment fit one launch area under 12 in. (305 mm)</div>
          <YesNo value={values.EI} onChange={(v) => setValues((p) => ({ ...p, EI: v }))} />
          <span className="pts">+{EQUIPMENT_POINTS}</span>
        </div>
        <div className="field-row">
          <div className="field-label">Precision tokens left (start with 6)</div>
          <div className="chips">
            {PRECISION_POINTS.map((pts, n) => (
              <button
                key={n}
                className={values.PT === n ? 'chip on' : 'chip'}
                onClick={() => setValues((p) => ({ ...p, PT: n }))}
              >
                {n} <small>{pts}</small>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="sheet">
        {MISSIONS.map((m) => {
          const pts = result.byMission[m.id]
          return (
            <article key={m.id} className={`mcard sheet-card ${pts > 0 ? 'has-pts' : ''}`}>
              <header>
                <span className="mnum">{m.id}</span>
                <div className="mtitle">
                  <h3>{m.name}</h3>
                  <span className="muted small">{m.max} pts possible</span>
                </div>
                <span className="pts big">{pts}</span>
              </header>
              {m.fields.map((f) => (
                <div key={f.key} className={`field-row ${f.bonus ? 'bonus' : ''}`}>
                  <div className="field-label">
                    {f.bonus && <span className="bonus-tag">Bonus</span>}
                    {f.label.replace(/^Bonus: /, '')}
                  </div>
                  <FieldInput
                    field={f}
                    value={values[m.id][f.key]}
                    onChange={(v) => setField(m.id, f.key, v)}
                  />
                </div>
              ))}
              {m.note && <p className="note">{m.note}</p>}
            </article>
          )
        })}
      </section>

      <section className="panel">
        <div className="field-row">
          <div className="field-label">Gracious Professionalism at the table (Core Values, not robot score)</div>
          <div className="chips">
            {GP_LEVELS.map((g) => (
              <button key={g.v} className={values.GP === g.v ? 'chip on' : 'chip'} onClick={() => setValues((p) => ({ ...p, GP: g.v }))}>
                {g.label} <small>{g.v}</small>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="totalbar">
        <div>
          <span className="label">Robot game</span>
          <strong className="big-num">{result.robot}</strong>
          <span className="muted small"> / {MAX_ROBOT}</span>
        </div>
        <div className="muted small">Missions {result.missions} · Equip {result.equipment} · Tokens {result.tokens}</div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save run'}
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    </>
  )
}

function FieldInput({ field, value, onChange }) {
  if (field.kind === 'yes') {
    return <YesNo value={!!value} onChange={onChange} />
  }
  if (field.kind === 'count') {
    const current = value ?? 0
    return (
      <div className="chips">
        {Array.from({ length: field.max + 1 }, (_, n) => (
          <button key={n} className={current === n ? 'chip on' : 'chip'} onClick={() => onChange(n)}>
            {n}
          </button>
        ))}
      </div>
    )
  }
  // choice
  return (
    <div className="chips">
      {field.options.map((o) => (
        <button key={o.v} className={value === o.v ? 'chip on' : 'chip'} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function YesNo({ value, onChange }) {
  return (
    <div className="seg yn">
      <button className={!value ? 'on no' : 'no'} onClick={() => onChange(false)}>No</button>
      <button className={value ? 'on yes' : 'yes'} onClick={() => onChange(true)}>Yes</button>
    </div>
  )
}

function History({ me }) {
  const runs = useCollection('runs', { order: 'createdAt', dir: 'asc', n: 300 })
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(null)

  const all = runs.rows ?? []
  const shown = filter === 'all' ? all : all.filter((r) => r.type === filter)
  const robots = shown.map((r) => r.robot ?? r.total ?? 0)
  const best = robots.length ? Math.max(...robots) : null
  const average = robots.length ? Math.round(robots.reduce((a, b) => a + b, 0) / robots.length) : null
  const trend = trendOf(robots)
  const stats = missionStats(shown)

  async function remove(r) {
    if (!window.confirm(`Delete “${r.label}” (${r.robot} pts)?`)) return
    await deleteDoc(doc(db, 'runs', r.id))
  }

  return (
    <>
      <section className="panel">
        <div className="seg">
          {['all', 'practice', 'competition'].map((f) => (
            <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="tiles three">
          <div className="tile static"><span className="label">Best</span><span className="value">{best ?? '—'}</span></div>
          <div className="tile static"><span className="label">Average</span><span className="value">{average ?? '—'}</span></div>
          <div className="tile static">
            <span className="label">Improving?</span>
            <span className={`value ${trend > 0 ? 'good' : trend < 0 ? 'bad' : ''}`}>
              {trend === null ? '—' : `${trend > 0 ? '+' : ''}${trend}`}
            </span>
            <span className="sub">{trend === null ? 'needs 6 runs' : 'last 3 vs first 3'}</span>
          </div>
        </div>
        <Chart robots={robots} labels={shown.map((r) => r.label || fmtDay(r.createdAt))} />
      </section>

      <section className="panel">
        <h2>Mission report</h2>
        <p className="muted small">Average points and how often each mission scored at least once.</p>
        <ul className="mreport">
          {stats.map((s) => (
            <li key={s.id}>
              <span className="mname"><b>{s.id}</b> {s.name}</span>
              <span className="mbar"><span style={{ width: `${Math.round(s.pct * 100)}%` }} /></span>
              <span className="mnums">
                {s.n ? `${Math.round(s.avg)} avg · ${Math.round(s.scored * 100)}% scored` : '—'}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="stack">
        <h2 className="pad">Runs</h2>
        {!runs.rows && <p className="muted">Loading runs…</p>}
        {runs.rows && shown.length === 0 && <p className="muted">No runs yet. Log one from the sheet.</p>}
        {[...shown].reverse().map((r) => {
          const isOpen = open === r.id
          const canDelete = me.isAdmin || r.uid === me.uid
          return (
            <article key={r.id} className="run">
              <button className="run-head" onClick={() => setOpen(isOpen ? null : r.id)} aria-expanded={isOpen}>
                <span className="run-score">{r.robot ?? r.total}</span>
                <span className="run-meta">
                  <strong>{r.label}</strong>
                  <span className="muted small">
                    {r.type} · {r.date} · {r.by?.split(' ')[0]}
                  </span>
                </span>
                <span className="chev">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className="run-body">
                  <div className="mini-grid">
                    {MISSIONS.map((m) => (
                      <span key={m.id} className={r.byMission?.[m.id] > 0 ? 'hit' : 'miss'}>
                        {m.id} <b>{r.byMission?.[m.id] ?? 0}</b>
                      </span>
                    ))}
                    <span>Equip <b>{r.equipment ?? 0}</b></span>
                    <span>Tokens <b>{r.tokens ?? 0}</b></span>
                    <span>GP <b>{r.gp ?? '—'}</b> <em className="muted">(Core Values)</em></span>
                  </div>
                  {canDelete && (
                    <button className="linkish danger" onClick={() => remove(r)}>Delete run</button>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </section>
    </>
  )
}

function Chart({ robots, labels }) {
  if (robots.length < 2) {
    return <p className="muted small chart-empty">The chart shows up after two runs.</p>
  }
  const W = 640
  const H = 220
  const pad = { l: 40, r: 16, t: 16, b: 28 }
  const max = Math.max(MAX_ROBOT, ...robots)
  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / (robots.length - 1)
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b)
  const pts = robots.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const gridVals = [0, 100, 200, 300, 400, 500].filter((g) => g <= max)

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Robot score over time">
      {gridVals.map((g) => (
        <g key={g}>
          <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} className="grid" />
          <text x={pad.l - 8} y={y(g) + 4} textAnchor="end" className="axis">{g}</text>
        </g>
      ))}
      <polyline points={pts} className="line" />
      {robots.map((v, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(v)} r={4.5} className="dot" />
          {i === robots.length - 1 && (
            <text x={x(i)} y={y(v) - 10} textAnchor="end" className="last">{v}</text>
          )}
        </g>
      ))}
      <text x={pad.l} y={H - 6} className="axis">{labels[0]}</text>
      <text x={W - pad.r} y={H - 6} textAnchor="end" className="axis">{labels[labels.length - 1]}</text>
    </svg>
  )
}
