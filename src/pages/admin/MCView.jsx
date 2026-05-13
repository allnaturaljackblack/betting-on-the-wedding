import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AnswerMedia from '../../components/AnswerMedia'
import { useLeaderboard } from '../../hooks/useLeaderboard'

export default function MCView() {
  const [tab, setTab] = useState('reveal') // 'reveal' | 'leaderboard'
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [revealing, setRevealing] = useState(null)

  const { leaderboard, settings, loading: lbLoading } = useLeaderboard()
  const isVegas = settings?.scoring_mode === 'vegas'

  useEffect(() => {
    fetchQuestions()
    const channel = supabase
      .channel('mc-questions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, fetchQuestions)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchQuestions() {
    const { data } = await supabase
      .from('questions')
      .select('*')
      .order('order_index', { ascending: true })
    setQuestions(data || [])
    setLoading(false)
  }

  async function revealAnswer(q) {
    setRevealing(q.id)
    await supabase.from('questions').update({ answer_revealed: true }).eq('id', q.id)
    setQuestions((qs) => qs.map((x) => x.id === q.id ? { ...x, answer_revealed: true } : x))
    setRevealing(null)
  }

  function correctAnswerDisplay(q) {
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

  const revealed = questions.filter((q) => q.answer_revealed)
  const pending = questions.filter((q) => !q.answer_revealed)

  function QuestionCard({ q }) {
    const answer = correctAnswerDisplay(q)
    const isRevealing = revealing === q.id
    return (
      <div className={`mc-card${q.answer_revealed ? ' mc-card-revealed' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <div className="mc-card-number">Q{questions.indexOf(q) + 1}</div>
          {q.answer_revealed
            ? <span className="mc-revealed-badge">✓ Revealed</span>
            : answer
              ? <button className="mc-reveal-btn" onClick={() => revealAnswer(q)} disabled={isRevealing}>
                  {isRevealing ? 'Revealing…' : '▶ Reveal to Group'}
                </button>
              : <span className="mc-no-answer-badge">No answer set</span>
          }
        </div>
        <p className="mc-card-prompt">{q.prompt}</p>
        {answer && (
          <div className="mc-answer-block">
            <span className="mc-answer-label">Answer</span>
            <span className="mc-answer-value">{answer}</span>
          </div>
        )}
        {q.answer_context && (
          <div className="mc-talking-points">
            <span className="mc-talking-label">🎙 Talking Points</span>
            <p className="mc-talking-text">{q.answer_context}</p>
          </div>
        )}
        <AnswerMedia question={q} />
      </div>
    )
  }

  function RankBadge({ rank }) {
    if (rank === 1) return <span className="mc-lb-rank gold">♛ 1st</span>
    if (rank === 2) return <span className="mc-lb-rank silver">2nd</span>
    if (rank === 3) return <span className="mc-lb-rank bronze">3rd</span>
    return <span className="mc-lb-rank">{rank}th</span>
  }

  if (loading) {
    return <div className="loading-state"><span className="spinner" />Loading…</div>
  }

  return (
    <div className="mc-view">
      <div className="mc-header">
        <h1>MC View</h1>
        <p className="mc-subtitle">{revealed.length} of {questions.length} revealed</p>
      </div>

      {/* Tabs */}
      <div className="mc-tabs">
        <button
          className={`mc-tab${tab === 'reveal' ? ' mc-tab-active' : ''}`}
          onClick={() => setTab('reveal')}
        >
          🎤 Reveal
        </button>
        <button
          className={`mc-tab${tab === 'leaderboard' ? ' mc-tab-active' : ''}`}
          onClick={() => setTab('leaderboard')}
        >
          🏆 Leaderboard
        </button>
      </div>

      {/* Reveal tab */}
      {tab === 'reveal' && (
        <>
          {questions.length === 0 && <div className="empty-state">No questions yet.</div>}
          {pending.map((q) => <QuestionCard key={q.id} q={q} />)}
          {revealed.length > 0 && (
            <>
              <div className="mc-section-divider">Already revealed</div>
              {revealed.map((q) => <QuestionCard key={q.id} q={q} />)}
            </>
          )}
        </>
      )}

      {/* Leaderboard tab */}
      {tab === 'leaderboard' && (
        <div>
          {lbLoading && <div className="loading-state"><span className="spinner" />Tallying…</div>}

          {!lbLoading && leaderboard.length === 0 && (
            <div className="empty-state">No guests yet.</div>
          )}

          {!lbLoading && leaderboard.length > 0 && (
            <div className="mc-lb">
              {leaderboard.map((entry) => (
                <div key={entry.id} className={`mc-lb-row${entry.rank === 1 ? ' mc-lb-first' : ''}`}>
                  <RankBadge rank={entry.rank} />
                  <span className="mc-lb-name">{entry.name}</span>
                  <span className="mc-lb-score">
                    {isVegas
                      ? `${entry.score.toLocaleString()} chips`
                      : `${entry.score.toLocaleString()} pts`}
                  </span>
                </div>
              ))}
              <p className="mc-lb-note">
                {revealed.length} of {questions.length} answers revealed
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
