import { formatOdds } from '../../utils/scoring'

export default function OverUnder({ question, value, onChange, disabled }) {
  const line = question.over_under_line
  const isVegas = question._isVegas
  const odds = question.odds || {}

  return (
    <div>
      <div className="ou-line">
        <div className="line-label">The Line</div>
        <div className="line-value">{line != null ? line : '—'}</div>
      </div>
      <div className="ou-buttons">
        <button
          className={`ou-btn${value === 'over' ? ' selected' : ''}`}
          onClick={() => !disabled && onChange('over')}
          disabled={disabled}
          type="button"
        >
          Over ↑
          {isVegas && odds['over'] && (
            <span className="ou-odds">{formatOdds(odds['over'])}</span>
          )}
        </button>
        <button
          className={`ou-btn${value === 'under' ? ' selected' : ''}`}
          onClick={() => !disabled && onChange('under')}
          disabled={disabled}
          type="button"
        >
          Under ↓
          {isVegas && odds['under'] && (
            <span className="ou-odds">{formatOdds(odds['under'])}</span>
          )}
        </button>
      </div>
    </div>
  )
}
