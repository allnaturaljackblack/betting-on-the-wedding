import { formatOdds } from '../../utils/scoring'

export default function Moneyline({ question, value, onChange, disabled }) {
  const options = question.options || []
  const isVegas = question._isVegas
  const odds = question.odds || {}

  const [optA, optB] = options

  return (
    <div className="matchup-card">
      {optA && (
        <button
          className={`matchup-side${value === optA ? ' selected' : ''}`}
          onClick={() => !disabled && onChange(optA)}
          disabled={disabled}
          type="button"
        >
          <span className="team-name">{optA}</span>
          {isVegas && odds[optA] && (
            <span className="team-odds">{formatOdds(odds[optA])}</span>
          )}
        </button>
      )}
      <div className="matchup-vs">vs</div>
      {optB && (
        <button
          className={`matchup-side${value === optB ? ' selected' : ''}`}
          onClick={() => !disabled && onChange(optB)}
          disabled={disabled}
          type="button"
        >
          <span className="team-name">{optB}</span>
          {isVegas && odds[optB] && (
            <span className="team-odds">{formatOdds(odds[optB])}</span>
          )}
        </button>
      )}
    </div>
  )
}
