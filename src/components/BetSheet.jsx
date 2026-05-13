import { useState, useEffect } from 'react'
import { useGuest } from '../hooks/useGuest'
import { supabase } from '../lib/supabase'
import BetTypeIcon from './BetTypeIcon'
import MultipleChoice from './question-types/MultipleChoice'
import FillBlank from './question-types/FillBlank'
import OverUnder from './question-types/OverUnder'
import Moneyline from './question-types/Moneyline'
import PropBet from './question-types/PropBet'

export default function BetSheet({ question, settings, guestBets, existingBet, onClose, onSuccess }) {
  const { guest } = useGuest()
  const [answer, setAnswer] = useState(existingBet?.answer || '')
  const [chipsWagered, setChipsWagered] = useState(existingBet?.chips_wagered || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isVegas = settings?.scoring_mode === 'vegas'
  const isLocked = settings?.event_locked === true

  const startingChips = settings?.starting_chips || 1000
  const spent = (guestBets || [])
    .filter((b) => b.question_id !== question.id)
    .reduce((sum, b) => sum + (b.chips_wagered || 0), 0)
  const remaining = startingChips - spent

  // Lock body scroll while sheet is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!answer) {
      setError('Please select or enter an answer.')
      return
    }
    if (isVegas) {
      const w = parseInt(chipsWagered, 10)
      if (!w || w <= 0) {
        setError('Please enter a valid chip amount.')
        return
      }
      if (w > remaining) {
        setError(`You only have ${remaining.toLocaleString()} chips remaining.`)
        return
      }
    }

    setSubmitting(true)
    setError('')

    const payload = {
      guest_id: guest.id,
      question_id: question.id,
      answer,
      chips_wagered: isVegas ? parseInt(chipsWagered, 10) : null,
    }

    const { data, error: err } = existingBet
      ? await supabase.from('bets').update(payload).eq('id', existingBet.id).select().single()
      : await supabase.from('bets').insert(payload).select().single()

    if (err) {
      setError('Failed to place bet: ' + err.message)
      setSubmitting(false)
      return
    }

    onSuccess(data)
  }

  const enrichedQ = { ...question, _isVegas: isVegas }

  function handleAnswer(val) {
    setAnswer(val)
  }

  function renderInput() {
    const props = { question: enrichedQ, value: answer, onChange: handleAnswer, disabled: isLocked }
    switch (question.type) {
      case 'multiple_choice': return <MultipleChoice {...props} />
      case 'fill_blank':      return <FillBlank {...props} />
      case 'over_under':      return <OverUnder {...props} />
      case 'moneyline':       return <Moneyline {...props} />
      case 'prop_bet':        return <PropBet {...props} />
      default:                return <FillBlank {...props} />
    }
  }

  return (
    <div className="sheet-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet">
        <div className="sheet-handle" />

        <div className="sheet-header">
          <BetTypeIcon type={question.type} />
          <button className="sheet-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="sheet-body">
          <p className="sheet-prompt">{question.prompt}</p>

          {isVegas ? (
            <p className="sheet-meta">{remaining.toLocaleString()} chips remaining</p>
          ) : (
            <p className="sheet-meta">{question.points} points</p>
          )}

          <form onSubmit={handleSubmit}>
            {renderInput()}

            {isVegas && !isLocked && (
              <div className="chips-wager" style={{ marginTop: '1rem' }}>
                <label>Chips to Wager</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max={remaining}
                  value={chipsWagered}
                  onChange={(e) => setChipsWagered(e.target.value)}
                  placeholder={`Max ${remaining.toLocaleString()}`}
                />
              </div>
            )}

            {error && <p className="form-error" style={{ marginTop: '0.75rem' }}>{error}</p>}

            {!isLocked && (
              <button
                type="submit"
                className="btn btn-primary btn-full"
                style={{ marginTop: '1.25rem' }}
                disabled={submitting || !answer}
              >
                {submitting ? 'Placing...' : existingBet ? 'Update Bet' : 'Place Bet'}
              </button>
            )}

            {isLocked && (
              <p style={{ textAlign: 'center', color: 'var(--cream-dim)', marginTop: '1rem', fontSize: '0.85rem' }}>
                Betting is closed
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
