import { MISSIONS } from '../data/season'

const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0)

// Compares the average of the last 3 runs with the first 3. Needs 6+ runs. Pass runs oldest first.
export function trendOf(robotsOldestFirst) {
  if (robotsOldestFirst.length < 6) return null
  return Math.round(avg(robotsOldestFirst.slice(-3)) - avg(robotsOldestFirst.slice(0, 3)))
}

export function missionStats(runs) {
  return MISSIONS.map((m) => {
    const pts = runs.map((r) => r.byMission?.[m.id] ?? 0)
    const a = avg(pts)
    return {
      id: m.id,
      name: m.name,
      max: m.max,
      avg: a,
      pct: m.max ? a / m.max : 0,
      scored: pts.length ? pts.filter((p) => p > 0).length / pts.length : 0,
      n: pts.length,
    }
  })
}
