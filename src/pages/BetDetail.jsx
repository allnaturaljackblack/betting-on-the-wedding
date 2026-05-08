import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useGuest } from '../hooks/useGuest'
import { supabase } from '../lib/supabase'
import BetTypeIcon from '../components/BetTypeIcon'
import AnswerMedia from '../components/AnswerMedia'
import MultipleChoice from '../components/question-types/MultipleChoice'
import FillBlank from '../components/question-types/FillBlank'
import OverUnder from '../components/question-types/OverUnder'
import Moneyline from '../components/question-types/Moneyline'
import PropBet from '../components/question-types/PropBet'
import Header from '../components/Header'

export default function BetDetail() {
  const { id } = useParams()
  const { guest } = useGuest()
  const navigate = useNavigate()

  const [question, setQuestion] = useState(null)
  const [existingBet, setExistingBet] = useState(null)
  const [settings, setSettings] = useState(null)
  const [guestBets, setGuestBets] = useState([])
  const [answer, setAnswer] = useState('')
  const [chipsWagered, setChipsWagered] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!guest) {
      navigate('/enter')
      return
    }
    fetchData()
  }, [guest, id])

  async function fetchData() {
    setLoading(true)
    const [qRes, betRes, settingsRes, allBetsRes] = await Promise.all([
      supabase.from('questions').select('*').eq('id', id).single(),
      supabase.from('bets').select('*').eq('guest_id', guest.id).eq('question_id', id).single(),
      supabase.from('settings').select('*').eq('id', 1).single(),
      supabase.from('bets').select('*').eq('guest_id', guest.id),
    ])

    if (qRes.data) setQuestion(qRes.data)
    if (betRes.data) {
      setExistingBet(betRes.data)
      setAnswer(betRes.data.answer)
      setChipsWagered(betRes.data.chips_wagered || '')
    }
    if (settingsRes.data) setSettings(settingsRes.data)
    if (allBetsRes.data) setGuestBets(allBetsRes.data)
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!answer) {
      setError('Please select or enter an answer.')
      return
    }

    const isVegas = settings?.scoring_mode === 'vegas'
    if (isVegas) {
      const w = parseInt(chipsWagered, 10)
      if (!w || w <= 0) {
        setError('Please enter a valid chip amount to wager.')
        return
      }
      const startingChips = settings?.starting_chips || 1000
      const spent = guestBets
        .filter((b) => b.question_id !== id)
        .reduce((sum, b) => sum + (b.chips_wagered || 0), 0)
      if (w > startingChips - spent) {
        setError(`You only have ${startingChips - spent} chips remaining.`)
        return
      }
    }

    setSubmitting(true)
    setError('')

    const payload = {
      guest_id: guest.id,
      question_id: id,
      answer,
      chips_wagered: isVegas ? parseInt(chipsWagered, 10) : null,
    }

    const { error: err } = existingBet
      ? await supabase.from('bets').update(payload).eq('id', existingBet.id)
      : await supabase.from('bets').insert(payload)

    if (err) {
      setError('Failed to place bet: ' + err.message)
      setSubmitting(false)
      return
    }

    navigate('/board')
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="loading-state" style={{ paddingTop: '4rem' }}>
          <span className="spinner" />
          Loading...
        </div>
      </>
    )
  }

  if (!question) {
    return (
      <>
        <Header />
        <div className="error-state" style={{ paddingTop: '4rem' }}>Question not found.</div>
      </>
    )
  }

  const isVegas = settings?.scoring_mode === 'vegas'
  const showAnswers = settings?.show_answers === true
  const isLocked = settings?.event_locked === true
  const readOnly = isLocked || (existingBet && !isLocked ? false : false)

  const isCorrect =
    showAnswers &&
    existingBet &&
    question.correct_answer &&
    String(existingBet.answer).trim().toLowerCase() === String(question.correct_answer).trim().toLowerCase()

  const enrichedQ = { ...question, _isVegas: isVegas }

  const startingChips = settings?.starting_chips || 1000
  const spent = guestBets
    .filter((b) => b.question_id !== id)
    .reduce((sum, b) => sum + (b.chips_wagered || 0), 0)
  const remaining = startingChips - spent

  function renderQuestionComponent() {
    const props = {
      question: enrichedQ,
      value: answer,
      onChange: setAnswer,
      disabled: isLocked,
    }
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
    <>
      <Header />
      <div className="page">
        <div className="page-narrow" style={{ width: '100%', paddingTop: '1.5rem' }}>
          <Link to="/board" style={{ fontSize: '0.85rem', color: 'var(--cream-dim)' }}>
            ← Back to Board
          </Link>

          <div style={{ marginTop: '1rem' }}>
            <BetTypeIcon type={question.type} />
          </div>

          <h2 className="bet-detail-prompt">{question.prompt}</h2>

          {isVegas ? (
            <span className="points-info">Wager your chips — {remaining.toLocaleString()} remaining</span>
          ) : (
            <span className="points-info">{question.points} points</span>
          )}

          {isLocked && (
            <div className="locked-banner" style={{ marginBottom: '1rem' }}>
              Betting is closed — read only
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {renderQuestionComponent()}

            {isVegas && (
              <div className="chips-wager">
                <label>Chips to Wager</label>
                <input
                  type="number"
                  min="1"
                  max={remaining}
                  value={chipsWagered}
                  onChange={(e) => setChipsWagered(e.target.value)}
                  placeholder="e.g. 100"
                  disabled={isLocked}
                />
                <p className="chips-balance">{remaining.toLocaleString()} chips available</p>
              </div>
            )}

            {error && <p className="form-error" style={{ marginTop: '1rem' }}>{error}</p>}

            {!isLocked && (
              <button
                type="submit"
                className="btn btn-primary btn-full"
                style={{ marginTop: '1.5rem' }}
                disabled={submitting || !answer}
              >
                {submitting ? 'Placing bet...' : existingBet ? 'Update Bet' : 'Place Bet'}
              </button>
            )}
          </form>

          {/* Result */}
          {showAnswers && existingBet && (
            <div className="result-reveal" style={{ marginTop: '1.5rem' }}>
              <div className="result-reveal-row">
                <span className="result-answer-label">Your Answer:</span>
                <span style={{ color: 'var(--cream-dim)', fontSize: '0.85rem' }}>{existingBet.answer}</span>
                <span className={`result-badge ${isCorrect ? 'result-badge-correct' : 'result-badge-incorrect'}`}>
                  {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </span>
              </div>
              {question.correct_answer && (
                <div className="result-reveal-row">
                  <span className="result-answer-label">Correct Answer:</span>
                  <span className="result-answer-value">{question.correct_answer}</span>
                </div>
              )}
              {question.answer_context && (
                <p className="answer-context">{question.answer_context}</p>
              )}
              <AnswerMedia question={question} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
