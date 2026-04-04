import { formatOdds } from '../../utils/scoring'

export default function PropBet({ question, value, onChange, disabled }) {
  const isVegas = question._isVegas
  const odds = question.odds || {}

  return (
    <div className="prop-buttons">
      <button
        className={`prop-btn${value === 'Yes' ? ' selected' : ''}`}
        onClick={() => !disabled && onChange('Yes')}
        disabled={disabled}
        type="button"
      >
        Yes
        {isVegas && odds['Yes'] && (
          <span className="prop-odds">{formatOdds(odds['Yes'])}</span>
        )}
      </button>
      <button
        className={`prop-btn${value === 'No' ? ' selected' : ''}`}
        onClick={() => !disabled && onChange('No')}
        disabled={disabled}
        type="button"
      >
        No
        {isVegas && odds['No'] && (
          <span className="prop-odds">{formatOdds(odds['No'])}</span>
        )}
      </button>
    </div>
  )
}
