import { version } from '../../package.json'

export default function Credit() {
  return (
    <div className="credit">
      <span className="credit-dot" aria-hidden="true" />
      Created by Asher Mosseri · v{version}
    </div>
  )
}
