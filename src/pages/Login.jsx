import { useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { ROSTER, emailFor } from '../config'
import BinaryRain from '../components/BinaryRain'
import Credit from '../components/Credit'
import { Select } from '../components/Dialogs'
import logo from '../assets/stallion.png'

// Firebase verifies the password, so a wrong team code or PIN can't sign in.
// The first sign-in for a name creates that account. Declan should sign up first.
export default function Login() {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!name) return setError('Pick your name first.')
    if (code.trim().length < 3) return setError('Enter the team code.')
    if (!/^\d{4}$/.test(pin)) return setError('Your PIN is 4 digits.')

    const email = emailFor(name)
    const password = `${code.trim()}:${pin}`
    setBusy(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      const retryable = ['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password']
      if (!retryable.includes(err.code)) {
        setBusy(false)
        return setError(friendly(err))
      }
      try {
        await createUserWithEmailAndPassword(auth, email, password)
      } catch (err2) {
        setBusy(false)
        if (err2.code === 'auth/email-already-in-use') {
          return setError(`Wrong team code or PIN for ${name.split(' ')[0]}.`)
        }
        return setError(friendly(err2))
      }
    }
    setBusy(false)
  }

  return (
    <div className="login">
      <BinaryRain opacity={0.25} />
      <form className="login-card" onSubmit={submit}>
        <img className="login-logo" src={logo} alt="" />
        <div className="tape">Team check-in</div>
        <h1>Who’s at the table?</h1>
        <p className="muted">
          First time here? Pick your name, type the team code, and make up a 4-digit PIN. Next time, use the same three things.
        </p>

        <label className="field">
          <span>Name</span>
          <Select
            value={name}
            onChange={setName}
            label="Name"
            placeholder="Choose your name"
            options={ROSTER.map((r) => ({ v: r.name, label: r.admin ? `${r.name} (coach)` : r.name }))}
          />
        </label>

        <label className="field">
          <span>Team code</span>
          <input
            type="password"
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="from Declan"
          />
        </label>

        <label className="field">
          <span>PIN</span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="4 digits"
          />
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Checking…' : 'Enter the lab'}
        </button>
        <p className="fine">Forgot your PIN? Ask Declan to remove your account in the Firebase console, then sign in again.</p>
      </form>
      <Credit />
    </div>
  )
}

function friendly(err) {
  switch (err.code) {
    case 'auth/network-request-failed':
      return 'No connection. Check your internet and try again.'
    case 'auth/too-many-requests':
      return 'Too many tries. Wait a few minutes and try again.'
    case 'auth/weak-password':
      return 'That code and PIN are too short.'
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is off in Firebase. Turn it on under Authentication.'
    default:
      return `Something went wrong (${err.code || err.message}).`
  }
}
