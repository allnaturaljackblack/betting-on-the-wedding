import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AnswerMedia from '../../components/AnswerMedia'

export default function MCView() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [revealing, setRevealing] = useState(null)

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
    return q.correct_answer || null
  }

  if (loading) {
    return (
      <div className="loading-state">
        <span className="spinner" />
        Loading…
      </div>
    )
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
              ? <button
                  className="mc-reveal-btn"
                  onClick={() => revealAnswer(q)}
                  disabled={isRevealing}
                >
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

  return (
    <div className="mc-view">
      <div className="mc-header">
        <h1>MC View</h1>
        <p className="mc-subtitle">
          {revealed.length} of {questions.length} revealed
        </p>
      </div>

      {questions.length === 0 && (
        <div className="empty-state">No questions yet.</div>
      )}

      {/* Unrevealed — shown first so MC can work top to bottom */}
      {pending.map((q) => <QuestionCard key={q.id} q={q} />)}

      {/* Already revealed */}
      {revealed.length > 0 && (
        <>
          <div className="mc-section-divider">Already revealed</div>
          {revealed.map((q) => <QuestionCard key={q.id} q={q} />)}
        </>
      )}
    </div>
  )
}
