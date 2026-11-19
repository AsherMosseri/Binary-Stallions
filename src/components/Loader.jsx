import { useEffect, useState } from 'react'
import BinaryRain from './BinaryRain'
import logo from '../assets/stallion.png'

const BOOT = [
  'BOOTING STALLION OS 2.6',
  'LOADING MISSION MODELS 01–15',
  'CALIBRATING LIDAR',
  'OPENING TEAM CHANNEL',
  'CHECKING PRECISION TOKENS 6/6',
  'THE HERD IS READY',
]

export default function Loader() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step >= BOOT.length) return
    const t = setTimeout(() => setStep((s) => s + 1), 380)
    return () => clearTimeout(t)
  }, [step])

  const pct = Math.round((step / BOOT.length) * 100)

  return (
    <div className="loader" role="status" aria-live="polite">
      <BinaryRain opacity={0.5} />
      <div className="loader-inner">
        <div className="loader-logo-wrap">
          <img className="loader-logo" src={logo} alt="Binary Stallions logo" />
          <span className="loader-scan" aria-hidden="true" />
        </div>
        <h1 className="loader-title">Binary Stallions</h1>
        <p className="loader-sub">BIOGLOW · Founders Edition</p>

        <ul className="boot-log">
          {BOOT.slice(0, step).map((line, i) => (
            <li key={line} style={{ animationDelay: `${i * 0.02}s` }}>
              <span className="ok">{i === BOOT.length - 1 ? '▶' : '✓'}</span> {line}
            </li>
          ))}
          {step < BOOT.length && (
            <li className="cursor">
              <span className="ok">…</span> {BOOT[step]}
            </li>
          )}
        </ul>

        <div className="loader-bar" aria-label={`Loading ${pct}%`}>
          <span style={{ width: `${pct}%` }} />
        </div>
        <div className="loader-ticks" aria-hidden="true">
          {Array.from({ length: 15 }, (_, i) => (
            <i key={i} className={i < Math.round((pct / 100) * 15) ? 'on' : ''} />
          ))}
        </div>
      </div>
    </div>
  )
}
