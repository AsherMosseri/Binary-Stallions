import { useState } from 'react'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useCollection, useDoc } from '../lib/hooks'
import { MISSIONS } from '../data/season'
import { youtubeId } from '../lib/time'

export default function Missions({ me }) {
  const missions = useCollection('missions', { n: 50 })
  const full = useDoc('missions/FULL')
  const byId = Object.fromEntries((missions.rows ?? []).map((m) => [m.id, m]))

  const solid = MISSIONS.filter((m) => byId[m.id]?.done).length
  const potential = MISSIONS.filter((m) => byId[m.id]?.done).reduce((s, m) => s + m.max, 0)
  const allMax = MISSIONS.reduce((s, m) => s + m.max, 0)

  return (
    <div className="stack">
      <section className="panel">
        <div className="row between wrap">
          <div>
            <h2>Missions we can do</h2>
            <p className="muted">Tap “Solid” when a mission scores most of the time, not just once.</p>
          </div>
          <div className="stamp">
            <strong>{solid}/{MISSIONS.length}</strong>
            <span>{potential} of {allMax} pts solid</span>
          </div>
        </div>
        <span className="bar big"><span style={{ width: `${(solid / MISSIONS.length) * 100}%` }} /></span>

        <VideoField
          label="Full run video (the whole 2:30)"
          value={full?.videoUrl}
          onSave={(url) => save('FULL', { videoUrl: url }, me)}
        />
      </section>

      <section className="mission-grid">
        {MISSIONS.map((m) => {
          const row = byId[m.id] || {}
          const done = !!row.done
          return (
            <article key={m.id} className={`mcard ${done ? 'is-solid' : ''}`}>
              <header>
                <span className="mnum">{m.id}</span>
                <div className="mtitle">
                  <h3>{m.name}</h3>
                  <span className="muted small">Bags {m.bags} · up to {m.max} pts</span>
                </div>
                {m.noEquip && <span className="noequip" title="No equipment constraint">No equipment</span>}
              </header>
              <p className="blurb">{m.blurb}</p>
              {m.note && <p className="note">{m.note}</p>}

              <div className="row between">
                <button
                  className={done ? 'toggle on' : 'toggle'}
                  onClick={() => save(m.id, { done: !done }, me)}
                  aria-pressed={done}
                >
                  <span className="light" aria-hidden="true" /> {done ? 'Solid' : 'Not yet'}
                </button>
                <span className="muted small">{row.updatedBy ? `last: ${row.updatedBy.split(' ')[0]}` : ''}</span>
              </div>

              <VideoField
                label="Mission video"
                value={row.videoUrl}
                onSave={(url) => save(m.id, { videoUrl: url }, me)}
              />
            </article>
          )
        })}
      </section>
    </div>
  )
}

function VideoField({ label, value = '', onSave }) {
  const [draft, setDraft] = useState(null) // null = not editing
  const id = youtubeId(value)
  const shown = draft ?? value ?? ''

  return (
    <div className="video">
      {id && (
        <a className="thumb" href={value} target="_blank" rel="noreferrer">
          <img src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />
          <span>▶ Watch</span>
        </a>
      )}
      <label className="field compact">
        <span>{label}</span>
        <input
          value={shown}
          placeholder="Paste a YouTube link"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft !== null && draft.trim() !== (value || '').trim()) onSave(draft.trim())
            setDraft(null)
          }}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          inputMode="url"
        />
      </label>
    </div>
  )
}

function save(id, fields, me) {
  return setDoc(
    doc(db, 'missions', id),
    { ...fields, updatedBy: me.name, updatedAt: serverTimestamp() },
    { merge: true }
  )
}
