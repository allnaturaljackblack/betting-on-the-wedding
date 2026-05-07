import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import BetTypeIcon from '../../components/BetTypeIcon'

export default function Questions() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [dragIndex, setDragIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [saveError, setSaveError] = useState('')

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

  function handleDragStart(e, i) {
    setDragIndex(i)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e, i) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (i !== dragOverIndex) setDragOverIndex(i)
  }

  function handleDrop(e, i) {
    e.preventDefault()
    if (dragIndex === null || dragIndex === i) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    const reordered = [...questions]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(i, 0, moved)
    setQuestions(reordered)
    setDragIndex(null)
    setDragOverIndex(null)
    saveOrder(reordered)
  }

  function handleDragEnd() {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  async function saveOrder(ordered) {
    setSaveError('')
    const { error } = await Promise.all(
      ordered.map((q, i) =>
        supabase.from('questions').update({ order_index: i }).eq('id', q.id)
      )
    ).then((results) => results.find((r) => r.error) || { error: null })
    if (error) setSaveError('Failed to save order: ' + error.message)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Questions</h1>
        <Link to="/admin/questions/new" className="btn btn-primary btn-sm">
          + Add Question
        </Link>
      </div>

      {saveError && <p className="form-error" style={{ marginBottom: '1rem' }}>{saveError}</p>}

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
                <th style={{ width: '32px' }} />
                <th style={{ width: '32px' }}>#</th>
                <th>Prompt</th>
                <th>Type</th>
                <th>Pts</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr
                  key={q.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDrop={(e) => handleDrop(e, i)}
                  onDragEnd={handleDragEnd}
                  style={{
                    opacity: dragIndex === i ? 0.4 : 1,
                    background: dragOverIndex === i && dragIndex !== i
                      ? 'rgba(212, 175, 55, 0.08)'
                      : undefined,
                    borderTop: dragOverIndex === i && dragIndex !== i
                      ? '2px solid var(--gold-dim)'
                      : undefined,
                    transition: 'background 0.1s',
                  }}
                >
                  <td style={{ cursor: 'grab', textAlign: 'center', color: 'var(--cream-dim)', fontSize: '1rem', userSelect: 'none' }}>
                    ⠿
                  </td>
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
