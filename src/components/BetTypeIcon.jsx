const TYPE_LABELS = {
  multiple_choice: 'Multiple Choice',
  fill_blank: 'Fill in the Blank',
  over_under: 'Over / Under',
  moneyline: 'Moneyline',
  prop_bet: 'Prop Bet',
}

export default function BetTypeIcon({ type }) {
  const label = TYPE_LABELS[type] || type
  return (
    <span className={`badge badge-${type}`}>{label}</span>
  )
}
