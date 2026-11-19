import { useDoc } from '../lib/hooks'

// The coach's plan for today or this week, written in the Admin tab.
export default function PlanCard() {
  const plan = useDoc('settings/plan')
  if (!plan?.items?.length) return null
  const scope = plan.scope === 'week' ? 'This week' : 'Today'

  return (
    <section className="panel plan-card">
      <div className="row between wrap">
        <span className="tape">{plan.label || scope}</span>
        <span className="muted small">
          {scope} · from {plan.updatedBy?.split(' ')[0] || 'Declan'}
        </span>
      </div>
      <ol className="plan-items">
        {plan.items.map((item, i) => (
          <li key={i}>
            <span className="plan-n">{i + 1}</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
