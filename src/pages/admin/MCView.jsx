import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AnswerMedia from '../../components/AnswerMedia'

export default function MCView() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('questions')
      .select('*')
      .order('order_index', { ascending: true })
      .then(({ data }) => {
        setQuestions(data || [])
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="loading-state">
        <span className="spinner" />
        Loading…
      </div>
    )
  }

  const withAnswers = questions.filter(
    (q) => q.correct_answer || (Array.isArray(q.accepted_answers) && q.accepted_answers.length)
  )
  const pending = questions.filter(
    (q) => !q.correct_answer && !(Array.isArray(q.accepted_answers) && q.accepted_answers.length)
  )

  function correctAnswerDisplay(q) {
    if (q.type === 'fill_blank' && Array.isArray(q.accepted_answers) && q.accepted_answers.length) {
      return q.accepted_answers.join(' / ')
    }
    return q.correct_answer
  }

  function QuestionCard({ q, index }) {
    const answer = correctAnswerDisplay(q)
    return (
      <div className="mc-card">
        <div className="mc-card-number">Q{index + 1}</div>
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
        <p className="mc-subtitle">Talking points &amp; answers — not visible to guests</p>
      </div>

      {withAnswers.length === 0 && pending.length === 0 && (
        <div className="empty-state">No questions yet.</div>
      )}

      {withAnswers.map((q, i) => (
        <QuestionCard key={q.id} q={q} index={questions.indexOf(q)} />
      ))}

      {pending.length > 0 && (
        <>
          <div className="mc-section-divider">Answers not set yet</div>
          {pending.map((q) => (
            <QuestionCard key={q.id} q={q} index={questions.indexOf(q)} />
          ))}
        </>
      )}
    </div>
  )
}
