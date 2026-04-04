import { formatOdds } from '../../utils/scoring'

const SUITS = ['♠', '♥', '♦', '♣']

export default function MultipleChoice({ question, value, onChange, disabled }) {
  const options = question.options || []
  const isVegas = question._isVegas
  const odds = question.odds || {}

  return (
    <div>
      {options.map((option, i) => (
        <button
          key={option}
          className={`option-card${value === option ? ' selected' : ''}`}
          onClick={() => !disabled && onChange(option)}
          disabled={disabled}
          type="button"
        >
          <span className="suit-icon">{SUITS[i % 4]}</span>
          <span style={{ flex: 1 }}>{option}</span>
          {isVegas && odds[option] && (
            <span className="option-odds">{formatOdds(odds[option])}</span>
          )}
        </button>
      ))}
    </div>
  )
}
