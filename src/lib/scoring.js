import { MISSIONS, PRECISION_POINTS, EQUIPMENT_POINTS } from '../data/season'

// Robot Game points only. Gracious Professionalism is scored separately
// (it feeds Core Values, not the robot game rank).
export const MAX_ROBOT = MISSIONS.reduce((sum, m) => sum + m.max, 0) + EQUIPMENT_POINTS + PRECISION_POINTS[6]

export function defaultValues() {
  const v = { EI: false, PT: 6, GP: 3 }
  for (const m of MISSIONS) v[m.id] = {}
  return v
}

export function scoreRun(values) {
  const byMission = {}
  let missions = 0
  for (const m of MISSIONS) {
    const pts = m.score(values[m.id] || {})
    byMission[m.id] = pts
    missions += pts
  }
  const equipment = values.EI ? EQUIPMENT_POINTS : 0
  const tokens = PRECISION_POINTS[values.PT ?? 0] ?? 0
  const robot = missions + equipment + tokens
  return { byMission, equipment, tokens, missions, robot, gp: values.GP ?? 0 }
}
