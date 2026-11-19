import { useEffect, useMemo, useRef, useState } from 'react'
import { MISSIONS } from '../data/season'
import { MAX_ROBOT } from '../lib/scoring'

const DURATION = 150000 // 2:30, the robot game match length

export default function Match() {
  return (
    <div className="stack">
      <Timer />
      <Planner />
    </div>
  )
}

function Timer() {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [splits, setSplits] = useState([])
  const startRef = useRef(0)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const e = Date.now() - startRef.current
      if (e >= DURATION) {
        setElapsed(DURATION)
        setRunning(false)
        if (navigator.vibrate) navigator.vibrate([200, 100, 200])
        return
      }
      setElapsed(e)
    }, 50)
    return () => clearInterval(id)
  }, [running])

  const left = Math.max(DURATION - elapsed, 0)
  const done = elapsed >= DURATION
  const tone = done ? 'done' : left <= 10000 ? 'red' : left <= 30000 ? 'amber' : ''

  const start = () => {
    startRef.current = Date.now() - elapsed
    setRunning(true)
  }
  const reset = () => {
    setRunning(false)
    setElapsed(0)
    setSplits([])
  }

  return (
    <section className={`timer ${tone}`}>
      <div className="tape">Match clock</div>
      <div className="clock" aria-live="off">{fmt(left)}</div>
      <div className="bar big"><span style={{ width: `${(elapsed / DURATION) * 100}%` }} /></div>
      <div className="timer-buttons">
        {!running ? (
          <button className="btn btn-primary" onClick={start} disabled={done}>
            {elapsed > 0 ? 'Resume' : 'Start match'}
          </button>
        ) : (
          <button className="btn" onClick={() => setRunning(false)}>Pause</button>
        )}
        <button className="btn" onClick={() => setSplits((s) => [...s, elapsed])} disabled={!running && elapsed === 0}>
          Mark split
        </button>
        <button className="btn ghost" onClick={reset}>Reset</button>
      </div>
      {done && <p className="timer-msg">Time. Technicians stop the robot and touch nothing.</p>}
      {splits.length > 0 && (
        <ol className="splits">
          {splits.map((s, i) => (
            <li key={i}>
              <span>Split {i + 1}</span>
              <b>{fmt(s)} in</b>
            </li>
          ))}
        </ol>
      )}
      <p className="fine">Rules: 2.5 minutes. Robot must be launched from home and run on its own. Only your best of three official matches counts.</p>
    </section>
  )
}

function Planner() {
  const [plan, setPlan] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bs-plan')) ?? []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('bs-plan', JSON.stringify(plan))
    } catch {
      /* no storage: the plan just won't persist */
    }
  }, [plan])

  const total = useMemo(() => plan.reduce((s, id) => s + MISSIONS.find((m) => m.id === id).max, 0), [plan])
  const toggle = (id) => setPlan((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const move = (i, d) =>
    setPlan((p) => {
      const next = [...p]
      const j = i + d
      if (j < 0 || j >= next.length) return p
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  return (
    <section className="panel">
      <h2>Run planner</h2>
      <p className="muted small">
        Tap missions in the order you plan to run them. Only plan what you can finish in 2:30, and be honest about which ones are solid.
      </p>

      <div className="plan-pick">
        {MISSIONS.map((m) => {
          const idx = plan.indexOf(m.id)
          return (
            <button key={m.id} className={idx >= 0 ? 'pick on' : 'pick'} onClick={() => toggle(m.id)}>
              <b>{m.id}</b>
              <span>{m.name}</span>
              <small>{m.max}</small>
              {idx >= 0 && <em>{idx + 1}</em>}
            </button>
          )
        })}
      </div>

      <div className="row between wrap plan-head">
        <strong>{plan.length} missions · up to {total} pts</strong>
        <span className="muted small">Robot max is {MAX_ROBOT}</span>
      </div>

      {plan.length > 0 ? (
        <ol className="plan-list">
          {plan.map((id, i) => {
            const m = MISSIONS.find((x) => x.id === id)
            return (
              <li key={id}>
                <span className="mnum">{i + 1}</span>
                <span className="mtitle"><b>{m.id}</b> {m.name} <small className="muted">· {m.max}</small></span>
                <span className="plan-actions">
                  <button onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                  <button onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                  <button onClick={() => toggle(id)} aria-label="Remove">×</button>
                </span>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="muted">Nothing planned yet.</p>
      )}
      {plan.length > 0 && (
        <button className="linkish" onClick={() => setPlan([])}>Clear plan</button>
      )}
    </section>
  )
}

function fmt(ms) {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = String(total % 60).padStart(2, '0')
  return `${m}:${s}`
}
