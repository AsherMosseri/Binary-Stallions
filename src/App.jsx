import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase'
import { ROSTER, emailFor, ADMIN_EMAIL } from './config'
import Loader from './components/Loader'
import Login from './pages/Login'
import Shell from './components/Shell'

const MIN_BOOT_MS = 2600

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = still checking
  const [bootDone, setBootDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setBootDone(true), MIN_BOOT_MS)
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null))
    return () => {
      clearTimeout(t)
      unsub()
    }
  }, [])

  if (user === undefined || !bootDone) return <Loader />
  if (!user) return <Login />

  const rosterEntry = ROSTER.find((r) => emailFor(r.name) === user.email)
  if (!rosterEntry) {
    return (
      <div className="login">
        <div className="login-card">
          <h1>Not on the roster</h1>
          <p className="muted">This account isn’t on the Binary Stallions roster. Ask Declan to check it.</p>
          <button className="btn btn-block" onClick={() => signOut(auth)}>Sign out</button>
        </div>
      </div>
    )
  }

  const me = {
    name: rosterEntry.name,
    uid: user.uid,
    email: user.email,
    isAdmin: user.email === ADMIN_EMAIL,
  }
  return <Shell me={me} />
}
