import { useCollection, useDoc } from '../lib/hooks'
import { daysUntil, fmtDay, fmtTime } from '../lib/time'
import { MISSIONS } from '../data/season'
import { MAX_ROBOT } from '../lib/scoring'
import { trendOf } from '../lib/stats'
import { firstName } from '../config'
import UpdateCard from '../components/UpdateCard'

export default function Home({ me, go }) {
  const settings = useDoc('settings/team')
  const missions = useCollection('missions', { n: 50 })
  const runs = useCollection('runs', { order: 'createdAt', dir: 'asc', n: 300 })
  const logs = useCollection('logs', { order: 'createdAt', n: 1 })

  const days = daysUntil(settings?.qualifierDate)
  const solid = (missions.rows ?? []).filter((m) => m.done && MISSIONS.some((x) => x.id === m.id)).length
  const robots = (runs.rows ?? []).map((r) => r.robot ?? r.total ?? 0)
  const best = robots.length ? Math.max(...robots) : null
  const last = robots.length ? robots[robots.length - 1] : null
  const trend = trendOf(robots)
  const latestLog = logs.rows?.[0]

  return (
    <div className="stack">
      <UpdateCard />
      <section className="hero panel">
        <div className="tape">{settings?.qualifierName || 'Next qualifier'}</div>
        {days === null ? (
          <>
            <h1 className="hero-big">No date yet</h1>
            <p className="muted">
              {me.isAdmin ? 'Set the qualifier date in Admin.' : 'Declan will add the date soon.'}
            </p>
          </>
        ) : (
          <>
            <div className="hero-count">
              <span className="num">{Math.max(days, 0)}</span>
              <span className="unit">{days === 1 ? 'day' : 'days'}</span>
            </div>
            <p className="muted">
              {days > 0 ? 'until we step on the mat' : days === 0 ? 'It’s qualifier day. Lock in.' : 'Qualifier day has passed.'}
            </p>
          </>
        )}
      </section>

      <p className="hello">
        Hey {firstName(me.name)}. <span className="muted">Here’s where we’re at.</span>
      </p>

      <section className="tiles">
        <button className="tile" onClick={() => go('missions')}>
          <span className="label">Missions solid</span>
          <span className="value">
            {solid}
            <small>/{MISSIONS.length}</small>
          </span>
          <span className="bar"><span style={{ width: `${(solid / MISSIONS.length) * 100}%` }} /></span>
        </button>
        <button className="tile" onClick={() => go('scores')}>
          <span className="label">Best robot score</span>
          <span className="value">
            {best ?? '—'}
            <small>/{MAX_ROBOT}</small>
          </span>
          <span className="sub">{robots.length} runs logged</span>
        </button>
        <button className="tile" onClick={() => go('scores')}>
          <span className="label">Last run</span>
          <span className="value">{last ?? '—'}</span>
          <span className="sub">
            {trend === null
              ? 'Log 6 runs to see if we’re improving'
              : trend > 0
                ? `Up ${trend} pts vs. our first runs`
                : trend < 0
                  ? `Down ${Math.abs(trend)} pts. Let’s look at why`
                  : 'Flat so far'}
          </span>
        </button>
      </section>

      <section className="panel">
        <div className="row between">
          <h2>Latest from the team</h2>
          <button className="linkish" onClick={() => go('log')}>All entries →</button>
        </div>
        {latestLog ? (
          <article className="log-card compact">
            <div className="meta">
              <strong>{latestLog.by}</strong>
              <span>{latestLog.date || fmtDay(latestLog.createdAt)}</span>
              {latestLog.createdAt && <span>{fmtTime(latestLog.createdAt)}</span>}
            </div>
            <p>{latestLog.what || <em className="muted">No summary yet.</em>}</p>
          </article>
        ) : (
          <p className="muted">Nothing logged yet. Start the first one.</p>
        )}
      </section>

      <section className="quick">
        <button className="btn" onClick={() => go('scores')}>Log a run</button>
        <button className="btn" onClick={() => go('log')}>Log today</button>
        <button className="btn" onClick={() => go('chat')}>{me.isAdmin ? 'Check messages' : 'Message Declan'}</button>
        <button className="btn" onClick={() => go('match')}>Start a 2:30 timer</button>
      </section>
    </div>
  )
}
