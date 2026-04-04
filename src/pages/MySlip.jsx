import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGuest } from '../hooks/useGuest'
import { supabase } from '../lib/supabase'
import BetTypeIcon from '../components/BetTypeIcon'
import Header from '../components/Header'

export default function MySlip() {
  const { guest } = useGuest()
  const navigate = useNavigate()

  const [bets, setBets] = useState([])
  const [questions, setQuestions] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!guest) {
      navigate('/enter')
      return
    }
    fetchData()
  }, [guest])

  async function fetchData() {
    setLoading(true)
    const [betsRes, qRes, settingsRes] = await Promise.all([
      supabase.from('bets').select('*').eq('guest_id', guest.id),
      supabase.from('questions').select('*'),
      supabase.from('settings').select('*').eq('id', 1).single(),
    ])
    setBets(betsRes.data || [])
    setQuestions(qRes.data || [])
    setSettings(settingsRes.data)
    setLoading(false)
  }

  if (!guest) return null

  const isVegas = settings?.scoring_mode === 'vegas'
  const showAnswers = settings?.show_answers === true

  const questionMap = {}
  for (const q of questions) questionMap[q.id] = q

  const totalPoints = bets.reduce((sum, b) => {
    const q = questionMap[b.question_id]
    if (!q) return sum
    if (showAnswers && q.correct_answer) {
      const isCorrect = String(b.answer).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()
      if (isVegas) {
        return sum // chip calculation would be complex here
      }
      return sum + (isCorrect ? (q.points || 0) : 0)
    }
    return sum + (q.points || 0)
  }, 0)

  const totalChips = bets.reduce((sum, b) => sum + (b.chips_wagered || 0), 0)

  return (
    <>
      <Header />
      <div className="page">
        <div className="page-wide" style={{ width: '100%', paddingTop: '1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', color: 'var(--gold-dim)', marginBottom: '0.5rem' }}>♠ ♥ ♦ ♣</div>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--gold)', fontStyle: 'italic' }}>My Betting Slip</h1>
            <p style={{ color: 'var(--cream-dim)', fontSize: '0.85rem' }}>{guest.name}</p>
          </div>

          {loading && (
            <div className="loading-state">
              <span className="spinner" />
              Loading your slip...
            </div>
          )}

          {!loading && bets.length === 0 && (
            <div className="empty-state">
              <p>No bets placed yet.</p>
              <Link to="/board" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                Go to the Board
              </Link>
            </div>
          )}

          {!loading && bets.length > 0 && (
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <table className="slip-table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Type</th>
                    <th>Your Answer</th>
                    {isVegas && <th>Chips</th>}
                    {!isVegas && <th>Points</th>}
                    {showAnswers && <th>Correct Answer</th>}
                    {showAnswers && <th>Result</th>}
                  </tr>
                </thead>
                <tbody>
                  {bets.map((bet) => {
                    const q = questionMap[bet.question_id]
                    if (!q) return null

                    const normalized = String(bet.answer).trim().toLowerCase()
                    const isCorrect = showAnswers && (() => {
                      if (q.type === 'fill_blank' && Array.isArray(q.accepted_answers) && q.accepted_answers.length) {
                        return q.accepted_answers.some((a) => String(a).trim().toLowerCase() === normalized)
                      }
                      return q.correct_answer && normalized === String(q.correct_answer).trim().toLowerCase()
                    })()

                    const correctAnswerDisplay = q.type === 'fill_blank' && Array.isArray(q.accepted_answers) && q.accepted_answers.length
                      ? q.accepted_answers.join(' / ')
                      : (q.correct_answer || '—')

                    return (
                      <tr key={bet.id}>
                        <td style={{ maxWidth: '200px' }}>
                          <Link to={`/bet/${q.id}`} style={{ color: 'var(--cream)', fontSize: '0.88rem' }}>
                            {q.prompt.length > 60 ? q.prompt.slice(0, 60) + '…' : q.prompt}
                          </Link>
                        </td>
                        <td><BetTypeIcon type={q.type} /></td>
                        <td style={{ color: 'var(--cream-dim)' }}>{bet.answer}</td>
                        {isVegas && <td style={{ color: 'var(--gold)' }}>{bet.chips_wagered || '—'}</td>}
                        {!isVegas && <td style={{ color: 'var(--gold)' }}>{q.points}</td>}
                        {showAnswers && (
                          <td style={{ color: 'var(--gold-light)', fontSize: '0.85rem' }}>
                            {correctAnswerDisplay}
                          </td>
                        )}
                        {showAnswers && (
                          <td>
                            <span style={{ color: isCorrect ? '#6ddc96' : '#ff8080', fontSize: '0.85rem', fontWeight: 'bold' }}>
                              {isCorrect ? '✓' : '✗'}
                            </span>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="slip-summary">
                <span className="total-label">{isVegas ? 'Chips wagered' : showAnswers ? 'Score' : 'Max Points'}</span>
                <span className="total-value">
                  {isVegas ? totalChips.toLocaleString() : totalPoints.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <Link to="/board" className="btn btn-secondary btn-sm">Back to Board</Link>
            <Link to="/leaderboard" className="btn btn-secondary btn-sm">Leaderboard</Link>
          </div>
        </div>
      </div>
    </>
  )
}
