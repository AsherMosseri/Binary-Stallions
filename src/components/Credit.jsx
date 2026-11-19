import { useState } from 'react'
import { version } from '../../package.json'
import WhatsNew from './WhatsNew'

export default function Credit() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="credit" onClick={() => setOpen(true)} aria-label={`Created by Asher Mosseri, version ${version}. Open update log`}>
        <span className="credit-dot" aria-hidden="true" />
        Created by Asher Mosseri · v{version}
      </button>
      {open && <WhatsNew onClose={() => setOpen(false)} />}
    </>
  )
}
