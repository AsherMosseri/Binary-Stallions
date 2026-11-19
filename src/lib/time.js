export const tsToDate = (ts) => (ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null)

export function fmtTime(ts) {
  const d = tsToDate(ts)
  return d ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'just now'
}

export function fmtDay(ts) {
  const d = tsToDate(ts)
  return d ? d.toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''
}

export function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Whole days from today to an 'YYYY-MM-DD' date. Negative means it already happened.
export function daysUntil(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target - today) / 86400000)
}

export function youtubeId(url = '') {
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([A-Za-z0-9_-]{6,})/)
  return m ? m[1] : null
}
