import { useEffect, useRef, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useCollection } from '../lib/hooks'
import { fmtTime } from '../lib/time'

export default function Chat({ me }) {
  const [view, setView] = useState('team')
  return (
    <div className="stack">
      <div className="seg wide">
        <button className={view === 'team' ? 'on' : ''} onClick={() => setView('team')}>Team channel</button>
        <button className={view === 'dm' ? 'on' : ''} onClick={() => setView('dm')}>
          {me.isAdmin ? 'Private inbox' : 'Private to Declan'}
        </button>
      </div>
      {view === 'team' && <TeamChannel me={me} />}
      {view === 'dm' && (me.isAdmin ? <AdminInbox me={me} /> : <PrivateThread me={me} />)}
    </div>
  )
}

function TeamChannel({ me }) {
  const { rows } = useCollection('messages', { order: 'createdAt', dir: 'desc', n: 150 })
  const list = rows ? [...rows].reverse() : null
  return (
    <section className="chat">
      <Messages list={list} me={me} path="messages" canDelete={(m) => me.isAdmin || m.uid === me.uid} />
      <Composer
        placeholder="Message the team"
        onSend={(text) =>
          addDoc(collection(db, 'messages'), { text, by: me.name, uid: me.uid, createdAt: serverTimestamp() })
        }
      />
    </section>
  )
}

function PrivateThread({ me }) {
  const path = `dms/${me.uid}/messages`
  const { rows } = useCollection(path, { order: 'createdAt', dir: 'asc', n: 200 })
  return (
    <section className="chat">
      <p className="notice">
        Only you and Declan can read this. Use it for questions, help with a mission, or anything you don’t want in the team channel.
      </p>
      <Messages list={rows} me={me} path={path} canDelete={() => false} />
      <Composer
        placeholder="Ask Declan something"
        onSend={async (text) => {
          await addDoc(collection(db, path), { text, uid: me.uid, by: me.name, createdAt: serverTimestamp() })
          await setDoc(
            doc(db, 'dms', me.uid),
            { name: me.name, uid: me.uid, lastText: text.slice(0, 80), updatedAt: serverTimestamp() },
            { merge: true }
          )
        }}
      />
    </section>
  )
}

function AdminInbox({ me }) {
  const threads = useCollection('dms', { order: 'updatedAt', n: 60 })
  const [open, setOpen] = useState(null)
  const path = open ? `dms/${open.uid}/messages` : null
  const { rows } = useCollection(path ?? 'dms/none/messages', { order: 'createdAt', dir: 'asc', n: 200 })

  return (
    <div className="inbox">
      <aside className="threads">
        {threads.rows?.length === 0 && <p className="muted small">No private messages yet.</p>}
        {threads.rows?.map((t) => (
          <button key={t.uid} className={open?.uid === t.uid ? 'thread on' : 'thread'} onClick={() => setOpen(t)}>
            <strong>{t.name}</strong>
            <span className="muted small">{t.lastText}</span>
          </button>
        ))}
      </aside>
      <section className="chat">
        {!open ? (
          <p className="muted">Pick a thread.</p>
        ) : (
          <>
            <h3 className="pad">{open.name}</h3>
            <Messages list={rows} me={me} path={path} canDelete={() => true} />
            <Composer
              placeholder={`Reply to ${open.name.split(' ')[0]}`}
              onSend={async (text) => {
                await addDoc(collection(db, path), { text, uid: me.uid, by: me.name, createdAt: serverTimestamp() })
                await setDoc(
                  doc(db, 'dms', open.uid),
                  { lastText: `Declan: ${text.slice(0, 70)}`, updatedAt: serverTimestamp() },
                  { merge: true }
                )
              }}
            />
          </>
        )}
      </section>
    </div>
  )
}

function Messages({ list, me, path, canDelete }) {
  const endRef = useRef(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [list?.length])

  if (!list) return <p className="muted pad">Loading…</p>
  if (list.length === 0) return <p className="muted pad">Quiet in here. Say something.</p>

  return (
    <ol className="msgs">
      {list.map((m) => {
        const mine = m.uid === me.uid
        return (
          <li key={m.id} className={mine ? 'msg mine' : 'msg'}>
            {!mine && <span className="who">{m.by}</span>}
            <p>{m.text}</p>
            <span className="when">
              {m.createdAt ? fmtTime(m.createdAt) : 'sending…'}
              {canDelete(m) && (
                <button
                  className="linkish danger"
                  onClick={() => window.confirm('Delete this message?') && deleteDoc(doc(db, path, m.id))}
                >
                  delete
                </button>
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function Composer({ placeholder, onSend }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function send(e) {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    setBusy(true)
    setError('')
    try {
      await onSend(t)
      setText('')
    } catch (err) {
      setError(`Didn’t send (${err.code || err.message}).`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="composer" onSubmit={send}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        maxLength={1000}
        aria-label={placeholder}
      />
      <button className="btn btn-primary" disabled={busy || !text.trim()}>Send</button>
      {error && <p className="error">{error}</p>}
    </form>
  )
}
