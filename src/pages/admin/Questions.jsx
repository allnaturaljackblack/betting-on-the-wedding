import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import BetTypeIcon from '../../components/BetTypeIcon'

export default function Questions() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    fetchQuestions()
  }, [])

  async function fetchQuestions() {
    setLoading(true)
    const { data } = await supabase
      .from('questions')
      .select('*')
      .order('order_index', { ascending: true })
    setQuestions(data || [])
    setLoading(false)
  }

  async function toggleActive(q) {
    await supabase.from('questions').update({ active: !q.active }).eq('id', q.id)
    fetchQuestions()
  }

  async function deleteQuestion(q) {
    if (!window.confirm(`Delete "${q.prompt.slice(0, 60)}…"? This cannot be undone.`)) return
    setDeleting(q.id)
    await supabase.from('questions').delete().eq('id', q.id)
    await fetchQuestions()
    setDeleting(null)
  }

  async function moveUp(i) {
    if (i === 0) return
    const a = questions[i]
    const b = questions[i - 1]
    await Promise.all([
      supabase.from('questions').update({ order_index: b.order_index }).eq('id', a.id),
      supabase.from('questions').update({ order_index: a.order_index }).eq('id', b.id),
    ])
    fetchQuestions()
  }

  async function moveDown(i) {
    if (i === questions.length - 1) return
    const a = questions[i]
    const b = questions[i + 1]
    await Promise.all([
      supabase.from('questions').update({ order_index: b.order_index }).eq('id', a.id),
      supabase.from('questions').update({ order_index: a.order_index }).eq('id', b.id),
    ])
    fetchQuestions()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Questions</h1>
        <Link to="/admin/questions/new" className="btn btn-primary btn-sm">
          + Add Question
        </Link>
      </div>

      {loading && (
        <div className="loading-state">
          <span className="spinner" />
          Loading questions...
        </div>
      )}

      {!loading && questions.length === 0 && (
        <div className="empty-state">
          No questions yet.{' '}
          <Link to="/admin/questions/new">Add one</Link>
        </div>
      )}

      {!loading && questions.length > 0 && (
        <div style={{ background: 'var(--green-mid)', border: '1px solid var(--gold-dim)', borderRadius: '6px', overflow: 'hidden' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Prompt</th>
                <th>Type</th>
                <th>Pts</th>
                <th>Active</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={q.id}>
                  <td style={{ color: 'var(--cream-dim)', fontSize: '0.8rem' }}>{i + 1}</td>
                  <td style={{ maxWidth: '260px' }}>
                    <span style={{ fontSize: '0.88rem' }}>
                      {q.prompt.length > 70 ? q.prompt.slice(0, 70) + '…' : q.prompt}
                    </span>
                  </td>
                  <td><BetTypeIcon type={q.type} /></td>
                  <td style={{ color: 'var(--gold)' }}>{q.points}</td>
                  <td>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={q.active}
                        onChange={() => toggleActive(q)}
                      />
                      <span className="slider" />
                    </label>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => moveUp(i)}
                        disabled={i === 0}
                        title="Move up"
                        style={{ padding: '0.2rem 0.5rem' }}
                      >
                        ↑
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => moveDown(i)}
                        disabled={i === questions.length - 1}
                        title="Move down"
                        style={{ padding: '0.2rem 0.5rem' }}
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link
                        to={`/admin/questions/${q.id}/edit`}
                        className="btn btn-secondary btn-sm"
                      >
                        Edit
                      </Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteQuestion(q)}
                        disabled={deleting === q.id}
                      >
                        {deleting === q.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
