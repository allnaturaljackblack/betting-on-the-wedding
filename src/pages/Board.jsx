import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGuest } from '../hooks/useGuest'
import { useQuestions } from '../hooks/useQuestions'
import { supabase } from '../lib/supabase'
import BetTypeIcon from '../components/BetTypeIcon'
import BetSheet from '../components/BetSheet'
import Header from '../components/Header'
import AnswerMedia from '../components/AnswerMedia'
import { chipsSpent } from '../utils/scoring'
import { playSuccess, playWrong, haptic } from '../utils/sounds'

export default function Board() {
  const { guest } = useGuest()
  const navigate = useNavigate()
  const { questions, loading, error } = useQuestions()
  const [bets, setBets] = useState([])
  const [settings, setSettings] = useState(null)
  const [activeQuestion, setActiveQuestion] = useState(null)

  useEffect(() => {
    if (!guest) {
      navigate('/enter')
      return
    }
    fetchBets()
    fetchSettings()
  }, [guest])

  async function fetchBets() {
    if (!guest) return
    const { data } = await supabase
      .from('bets')
      .select('*')
      .eq('guest_id', guest.id)
    setBets(data || [])
  }

  async function fetchSettings() {
    const { data } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single()
    setSettings(data)
  }

  if (!guest) return null

  const isVegas = settings?.scoring_mode === 'vegas'
  const isLocked = settings?.event_locked === true
  const startingChips = settings?.starting_chips || 1000
  const spent = chipsSpent(bets)
  const remaining = startingChips - spent

  const betMap = {}
  for (const b of bets) {
    betMap[b.question_id] = b
  }

  function checkCorrect(q, bet) {
    if (!bet) return null
    const normalized = String(bet.answer).trim().toLowerCase()

    if (q.type === 'fill_blank' && Array.isArray(q.accepted_answers) && q.accepted_answers.length) {
      return q.accepted_answers.some((a) => String(a).trim().toLowerCase() === normalized)
    }

    if (q.type === 'over_under' && q.correct_answer && q.over_under_line != null) {
      const result = parseFloat(q.correct_answer)
      if (!isNaN(result)) {
        if (result === q.over_under_line) return null // push — no winner
        const correctSide = result > q.over_under_line ? 'over' : 'under'
        return normalized === correctSide
      }
    }

    if (!q.correct_answer) return null
    return normalized === String(q.correct_answer).trim().toLowerCase()
  }

  function displayCorrectAnswer(q) {
    if (q.type === 'over_under' && q.correct_answer && q.over_under_line != null) {
      const result = parseFloat(q.correct_answer)
      if (!isNaN(result)) {
        if (result === q.over_under_line) return `Push (${result})`
        const side = result > q.over_under_line ? 'Over' : 'Under'
        return `${side} (${result})`
      }
    }
    return q.correct_answer || null
  }

  function handleBetSuccess(newBet) {
    setBets((prev) => {
      const without = prev.filter((b) => b.question_id !== newBet.question_id)
      return [...without, newBet]
    })
    setActiveQuestion(null)
  }

  // Play sound when a new answer is revealed
  const prevRevealedIds = useRef(new Set())
  useEffect(() => {
    const currentIds = new Set(questions.filter((q) => q.answer_revealed).map((q) => q.id))
    const newIds = [...currentIds].filter((id) => !prevRevealedIds.current.has(id))
    if (newIds.length > 0) {
      const q = questions.find((q) => q.id === newIds[newIds.length - 1])
      const bet = betMap[q?.id]
      if (q && bet) {
        const correct = checkCorrect(q, bet)
        if (correct) { playSuccess(); haptic('success') }
        else { playWrong(); haptic('error') }
      }
    }
    prevRevealedIds.current = currentIds
  }, [questions])

  // Live score — only counts revealed questions
  const revealedQuestions = questions.filter((q) => q.answer_revealed)
  const liveCorrect = revealedQuestions.filter((q) => checkCorrect(q, betMap[q.id]) === true)
  const liveIncorrect = revealedQuestions.filter((q) => {
    const c = checkCorrect(q, betMap[q.id])
    return c === false
  })
  const liveScore = isVegas
    ? liveCorrect.reduce((sum, q) => {
        const bet = betMap[q.id]
        return sum + (bet?.chips_wagered || 0)
      }, 0)
    : liveCorrect.reduce((sum, q) => sum + (q.points || 0), 0)

  return (
    <>
      <Header />
      <div className="page">
        <div className="page-narrow" style={{ width: '100%', paddingTop: '1.5rem' }}>
          {/* Greeting */}
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <p style={{ color: 'var(--cream-dim)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Good evening,
            </p>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--gold)', fontStyle: 'italic' }}>
              {guest.name}
            </h1>
            <p style={{ color: 'var(--cream-dim)', fontSize: '0.85rem' }}>The Betting Board — May 16th, 2026</p>
          </div>

          {/* Locked banner */}
          {isLocked && (
            <div className="locked-banner">
              &#9888; Betting is now closed
            </div>
          )}

          {/* Chip balance */}
          {isVegas && (
            <div className="chip-balance">
              &#9672; {remaining.toLocaleString()} chips remaining
            </div>
          )}

          {/* Live score banner */}
          {revealedQuestions.length > 0 && (
            <div className="live-score-banner">
              <div className="live-score-main">
                <span className="live-score-label">Your Score</span>
                <span className="live-score-value">
                  {isVegas ? `${liveScore.toLocaleString()} chips` : `${liveScore.toLocaleString()} pts`}
                </span>
              </div>
              <div className="live-score-breakdown">
                <span className="live-score-correct">✓ {liveCorrect.length} correct</span>
                {liveIncorrect.length > 0 && (
                  <span className="live-score-incorrect">✗ {liveIncorrect.length} incorrect</span>
                )}
                <span className="live-score-remaining">{revealedQuestions.length} of {questions.length} revealed</span>
              </div>
            </div>
          )}

          {/* Questions */}
          {loading && (
            <div className="loading-state">
              <span className="spinner" />
              Loading the board...
            </div>
          )}
          {error && <div className="error-state">Failed to load questions: {error}</div>}

          {!loading && questions.length === 0 && (
            <div className="empty-state">No questions on the board yet. Check back soon!</div>
          )}

          {questions.map((q) => {
            const myBet = betMap[q.id]
            const isCorrect = q.answer_revealed ? checkCorrect(q, myBet) : null
            const hasResult = q.answer_revealed && Boolean(q.correct_answer)

            return (
              <div key={q.id} className={`question-card${myBet ? ' answered' : ''}${isCorrect === true ? ' result-correct' : isCorrect === false ? ' result-incorrect' : ''}`}>
                <BetTypeIcon type={q.type} />
                <p className="question-prompt">{q.prompt}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {myBet ? (
                    <span className="answered-badge">
                      &#10003; {myBet.answer}
                      {isVegas && myBet.chips_wagered && ` — ${myBet.chips_wagered} chips`}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--cream-dim)' }}>
                      {isVegas ? 'Wager your chips' : `${q.points} pts`}
                    </span>
                  )}
                  {!isLocked && !myBet && (
                    <button className="btn btn-primary btn-sm" onClick={() => setActiveQuestion(q)}>
                      Place Bet →
                    </button>
                  )}
                  {myBet && !hasResult && (
                    <button
                      onClick={() => setActiveQuestion(q)}
                      style={{ fontSize: '0.8rem', color: 'var(--cream-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Edit
                    </button>
                  )}
                </div>

                {hasResult && (
                  <div className="result-reveal">
                    {myBet && (
                      <div className="result-reveal-row">
                        <span className="result-answer-label">Your Answer:</span>
                        <span style={{ color: 'var(--cream-dim)', fontSize: '0.85rem' }}>{myBet.answer}</span>
                        <span className={`result-badge ${isCorrect ? 'result-badge-correct' : 'result-badge-incorrect'}`}>
                          {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      </div>
                    )}
                    <div className="result-reveal-row">
                      <span className="result-answer-label">Correct Answer:</span>
                      <span className="result-answer-value">{displayCorrectAnswer(q)}</span>
                      {!myBet && (
                        <span className="result-badge result-badge-skipped">— No bet placed</span>
                      )}
                    </div>
                    <AnswerMedia question={q} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Sticky footer */}
      <div className="sticky-footer">
        <Link to="/slip" className="btn btn-secondary btn-sm">My Slip</Link>
        <Link to="/leaderboard" className="btn btn-secondary btn-sm">Leaderboard</Link>
      </div>

      {activeQuestion && (
        <BetSheet
          question={activeQuestion}
          settings={settings}
          guestBets={bets}
          existingBet={betMap[activeQuestion.id] || null}
          onClose={() => setActiveQuestion(null)}
          onSuccess={handleBetSuccess}
        />
      )}
    </>
  )
}
