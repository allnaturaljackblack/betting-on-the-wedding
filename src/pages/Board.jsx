import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGuest } from '../hooks/useGuest'
import { useQuestions } from '../hooks/useQuestions'
import { supabase } from '../lib/supabase'
import BetTypeIcon from '../components/BetTypeIcon'
import BetSheet from '../components/BetSheet'
import Header from '../components/Header'
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

  const showAnswers = settings?.show_answers === true

  function handleBetSuccess(newBet) {
    setBets((prev) => {
      const without = prev.filter((b) => b.question_id !== newBet.question_id)
      return [...without, newBet]
    })
    setActiveQuestion(null)
  }

  const prevShowAnswers = useRef(false)
  useEffect(() => {
    if (showAnswers && !prevShowAnswers.current && bets.length > 0) {
      // Results just revealed — play sound based on first result
      const firstBet = bets[0]
      const q = questions.find((q) => q.id === firstBet?.question_id)
      if (q) {
        const correct = checkCorrect(q, firstBet)
        if (correct) { playSuccess(); haptic('success') }
        else { playWrong(); haptic('error') }
      }
    }
    prevShowAnswers.current = showAnswers
  }, [showAnswers])

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
    if (!q.correct_answer) return null
    return normalized === String(q.correct_answer).trim().toLowerCase()
  }

  function renderAnswerMedia(url) {
    if (!url) return null
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
    if (youtubeMatch) {
      return (
        <div className="answer-media answer-media-video">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Answer media"
          />
        </div>
      )
    }
    return (
      <div className="answer-media">
        <img src={url} alt="Answer media" onError={(e) => { e.currentTarget.style.display = 'none' }} />
      </div>
    )
  }

  function displayCorrectAnswer(q) {
    if (q.type === 'fill_blank' && Array.isArray(q.accepted_answers) && q.accepted_answers.length) {
      return q.accepted_answers.join(' / ')
    }
    return q.correct_answer
  }

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
            const isCorrect = showAnswers ? checkCorrect(q, myBet) : null
            const hasResult = showAnswers && (q.correct_answer || (Array.isArray(q.accepted_answers) && q.accepted_answers.length))

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
                    {q.answer_context && (
                      <p className="answer-context">{q.answer_context}</p>
                    )}
                    {renderAnswerMedia(q.answer_media_url)}
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
