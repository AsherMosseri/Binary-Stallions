import { useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { TEAM_NAME, SEASON, firstName } from '../config'
import logo from '../assets/stallion.png'
import Home from '../pages/Home'
import Missions from '../pages/Missions'
import Scores from '../pages/Scores'
import Match from '../pages/Match'
import DailyLog from '../pages/DailyLog'
import Chat from '../pages/Chat'
import Judging from '../pages/Judging'
import Gear from '../pages/Gear'
import Admin from '../pages/Admin'

const TABS = [
  { id: 'home', label: 'HQ', component: Home },
  { id: 'missions', label: 'Missions', component: Missions },
  { id: 'scores', label: 'Scores', component: Scores },
  { id: 'match', label: 'Match', component: Match },
  { id: 'log', label: 'Daily log', component: DailyLog },
  { id: 'chat', label: 'Chat', component: Chat },
  { id: 'judging', label: 'Judging', component: Judging },
  { id: 'gear', label: 'Gear', component: Gear },
  { id: 'admin', label: 'Admin', component: Admin, adminOnly: true },
]

export default function Shell({ me }) {
  const visible = TABS.filter((t) => !t.adminOnly || me.isAdmin)
  const [tab, setTab] = useState(() => {
    const saved = localStorage.getItem('bs-tab')
    return visible.some((t) => t.id === saved) ? saved : 'home'
  })

  useEffect(() => {
    try {
      localStorage.setItem('bs-tab', tab)
    } catch {
      /* private mode: fine */
    }
    window.scrollTo(0, 0)
  }, [tab])

  const current = visible.find((t) => t.id === tab) ?? visible[0]
  const Page = current.component

  return (
    <div className="shell">
      <aside className="rail">
        <div className="brand">
          <img src={logo} alt="" />
          <div>
            <strong>{TEAM_NAME}</strong>
            <span>{SEASON}</span>
          </div>
        </div>
        <nav aria-label="Main">
          {visible.map((t, i) => (
            <button
              key={t.id}
              className={t.id === current.id ? 'nav active' : 'nav'}
              onClick={() => setTab(t.id)}
            >
              <span className="idx">{String(i + 1).padStart(2, '0')}</span>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="me">
          <span className="dot" aria-hidden="true" />
          <div>
            <strong>{firstName(me.name)}</strong>
            <span>{me.isAdmin ? 'coach · admin' : 'team'}</span>
          </div>
          <button className="linkish" onClick={() => signOut(auth)}>Sign out</button>
        </div>
      </aside>

      <header className="topbar">
        <img src={logo} alt="" />
        <strong>{current.label}</strong>
        <button className="linkish" onClick={() => signOut(auth)}>Sign out</button>
      </header>

      <main className="page" key={current.id}>
        <Page me={me} go={setTab} />
      </main>

      <nav className="tabbar" aria-label="Main mobile">
        {visible.map((t) => (
          <button key={t.id} className={t.id === current.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
