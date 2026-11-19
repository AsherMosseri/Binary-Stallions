import { useState } from 'react'

const FLOW = [
  { min: 2, title: 'Team welcome', note: 'Quick hello while you set up anything you brought.' },
  { min: 5, title: 'Innovation Project: presentation', note: 'Walk through the problem, research, solution, and what changed.' },
  { min: 5, title: 'Innovation Project: questions', note: 'Judges ask. Answer what you know, and say so when you don’t.' },
  { min: 5, title: 'Robot Design: explanation', note: 'Show the robot, the attachments, and how the code runs the missions.' },
  { min: 5, title: 'Robot Design: questions', note: 'Show the code and the testing. Judges love seeing the change log.' },
  { min: 8, title: 'Final share & feedback', note: 'Optional final thoughts. Then listen to the feedback.' },
]

const CORE = ['Teamwork', 'Discovery', 'Inclusion', 'Innovation', 'Impact', 'Fun']

const RUBRIC = {
  'Innovation Project': [
    ['Identify', 'Clear problem, real research from a few sources.'],
    ['Design', 'A plan on paper and proof that everyone helped.'],
    ['Create', 'An original idea or a real twist on one, with a model or drawing.'],
    ['Iterate', 'Shared it with more than one group, then changed it based on feedback.'],
    ['Communicate', 'Explained the solution clearly and showed you’re proud of it.'],
  ],
  'Robot Design': [
    ['Identify', 'A clear mission strategy and used building and coding resources.'],
    ['Design', 'Everyone contributed ideas and built real building and coding skills.'],
    ['Create', 'Explained attachments and code with a clear purpose, the more innovative the better.'],
    ['Iterate', 'Repeated testing with changes after each test.'],
    ['Communicate', 'Explained what you learned and showed pride in the work.'],
  ],
}

const QUESTIONS = [
  ['How did you figure out the problem was real?', 'Name two or three sources. Mention one that surprised you.'],
  ['Who on the team did what in the design?', 'Name real jobs, not “we all did everything.”'],
  ['What did you try that didn’t work?', 'Judges reward a change you made because of a test or feedback.'],
  ['Who outside the team gave you feedback, and what did you change?', 'Name the person or group and the exact change.'],
  ['Which missions do you trust most, and why?', 'Point to your scores. “M08 is 9 out of 10 at practice.”'],
  ['Walk us through one piece of code.', 'Explain the sensor logic in plain words, then the mission it runs.'],
  ['How do you test the robot before a match?', 'Show your test routine and the last time it caught a problem.'],
  ['Why is the attachment built that way?', 'Trade-offs are great: strength vs. weight, speed vs. accuracy.'],
  ['How does your solution help people beyond this season?', 'Connect it to the real world, not just the table.'],
  ['What would you do with another month?', 'Pick one thing that would matter most. Be specific.'],
  ['How did you show gracious professionalism at a match?', 'Helping another team, calling out your own mistake, cleaning up the table.'],
  ['What is one thing you’d tell a team starting this season?', 'Short, honest, and something you learned the hard way.'],
]

export default function Judging() {
  const [i, setI] = useState(0)
  const [showTip, setShowTip] = useState(false)
  const [order] = useState(() => shuffle(QUESTIONS.map((_, n) => n)))
  const [dom, setDom] = useState('Innovation Project')

  const [q, tip] = QUESTIONS[order[i]]
  const total = FLOW.reduce((s, f) => s + f.min, 0)

  return (
    <div className="stack">
      <section className="panel">
        <h2>Judging session</h2>
        <p className="muted small">
          About {total} minutes with judges, then they talk it over for 10 minutes while you wait outside. Core Values count for 25% of the Champion’s score.
        </p>
        <ol className="flow">
          {FLOW.map((f) => (
            <li key={f.title}>
              <span className="flow-min">{f.min}′</span>
              <div>
                <strong>{f.title}</strong>
                <p className="muted small">{f.note}</p>
              </div>
            </li>
          ))}
          <li className="leave">
            <span className="flow-min">10′</span>
            <div>
              <strong>Team leaves · judges score the rubrics</strong>
            </div>
          </li>
        </ol>
      </section>

      <section className="panel">
        <h2>Core Values we show in everything</h2>
        <div className="chips static">
          {CORE.map((c) => <span key={c} className="chip">{c}</span>)}
        </div>
        <p className="muted small">
          Gracious Professionalism at the table scores 2, 3, or 4 for Core Values. It doesn’t change robot points.
        </p>
      </section>

      <section className="panel">
        <div className="seg wide">
          {Object.keys(RUBRIC).map((k) => (
            <button key={k} className={dom === k ? 'on' : ''} onClick={() => setDom(k)}>{k}</button>
          ))}
        </div>
        <ul className="rubric">
          {RUBRIC[dom].map(([name, goal]) => (
            <li key={name}>
              <strong>{name}</strong>
              <span className="muted small">{goal}</span>
            </li>
          ))}
        </ul>
        <p className="muted small">Scores run 1 (Beginning) to 4 (Exceeds). Exceeds needs a short comment on the sheet.</p>
      </section>

      <section className="panel practice">
        <div className="row between wrap">
          <h2>Judge questions</h2>
          <span className="muted small">{i + 1} / {QUESTIONS.length}</span>
        </div>
        <p className="q">{q}</p>
        {showTip ? <p className="tip"><b>Tip:</b> {tip}</p> : <button className="linkish" onClick={() => setShowTip(true)}>Show a tip</button>}
        <div className="row gap">
          <button
            className="btn"
            onClick={() => {
              setShowTip(false)
              setI((n) => (n + 1) % QUESTIONS.length)
            }}
          >
            Next question
          </button>
          <button className="btn ghost" onClick={() => setI(0)}>Start over</button>
        </div>
      </section>

      <section className="panel">
        <h2>Awards we can win</h2>
        <ul className="awards">
          <li><b>Champion’s</b> · the best all-round team (robot, design, project, Core Values)</li>
          <li><b>Robot Performance</b> · highest robot-game score</li>
          <li><b>Robot Design</b> · sound, efficient robot and programming</li>
          <li><b>Innovation Project</b> · research, solution, and communication</li>
          <li><b>Core Values</b> · enthusiasm, respect, teamwork</li>
          <li><b>Engineering Excellence, Breakthrough, Rising All-Star, Motivate, Peer</b> · optional</li>
        </ul>
      </section>
    </div>
  )
}

function shuffle(a) {
  const out = [...a]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
