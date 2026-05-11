import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
  { value: 'over_under', label: 'Over / Under' },
  { value: 'moneyline', label: 'Moneyline' },
  { value: 'prop_bet', label: 'Prop Bet' },
]

const DEFAULT_FORM = {
  type: 'multiple_choice',
  prompt: '',
  points: 100,
  correct_answer: '',
  accepted_answers: [''],
  active: true,
  order_index: 0,
  options: ['', ''],
  over_under_line: '',
  odds: {},
  answer_context: '',
  answer_media_urls: [],
  answer_media_url: '',
}

export default function QuestionForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(DEFAULT_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadingCount, setUploadingCount] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isEdit) {
      supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data, error: err }) => {
          if (err || !data) {
            setError('Failed to load question.')
            setLoading(false)
            return
          }
          setForm({
            type: data.type,
            prompt: data.prompt,
            points: data.points,
            correct_answer: data.correct_answer || '',
            accepted_answers: data.accepted_answers?.length ? data.accepted_answers : [''],
            active: data.active,
            order_index: data.order_index,
            options: data.options || ['', ''],
            over_under_line: data.over_under_line != null ? String(data.over_under_line) : '',
            odds: data.odds || {},
            answer_context: data.answer_context || '',
            answer_media_urls: Array.isArray(data.answer_media_urls) ? data.answer_media_urls : [],
            answer_media_url: data.answer_media_url || '',
          })
          setLoading(false)
        })
    }
  }, [id])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function updateOption(i, value) {
    const opts = [...form.options]
    opts[i] = value
    setForm((f) => ({ ...f, options: opts }))
  }

  function addOption() {
    setForm((f) => ({ ...f, options: [...f.options, ''] }))
  }

  function removeOption(i) {
    const opts = form.options.filter((_, idx) => idx !== i)
    setForm((f) => ({ ...f, options: opts }))
  }

  function updateAcceptedAnswer(i, value) {
    const answers = [...form.accepted_answers]
    answers[i] = value
    setForm((f) => ({ ...f, accepted_answers: answers }))
  }

  function addAcceptedAnswer() {
    setForm((f) => ({ ...f, accepted_answers: [...f.accepted_answers, ''] }))
  }

  function removeAcceptedAnswer(i) {
    const answers = form.accepted_answers.filter((_, idx) => idx !== i)
    setForm((f) => ({ ...f, accepted_answers: answers.length ? answers : [''] }))
  }

  function updateOdds(key, value) {
    setForm((f) => ({ ...f, odds: { ...f.odds, [key]: value } }))
  }

  function removeImage(i) {
    setForm((f) => ({ ...f, answer_media_urls: f.answer_media_urls.filter((_, idx) => idx !== i) }))
  }

  function isVideo(url) {
    return /\.(mp4|mov|webm|m4v|avi|mkv)(\?|$)/i.test(url)
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const invalid = files.find((f) => !f.type.startsWith('image/') && !f.type.startsWith('video/'))
    if (invalid) {
      setUploadError('Only image or video files are supported.')
      return
    }
    setUploadingCount(files.length)
    setUploadError('')
    if (fileInputRef.current) fileInputRef.current.value = ''

    const uploaded = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error: upErr } = await supabase.storage
        .from('answer-media')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (upErr) {
        setUploadError('Upload failed: ' + upErr.message)
        setUploadingCount(0)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('answer-media').getPublicUrl(data.path)
      uploaded.push(publicUrl)
      setUploadingCount((n) => n - 1)
    }

    setForm((f) => ({ ...f, answer_media_urls: [...f.answer_media_urls, ...uploaded] }))
  }

  const showOptions = form.type === 'multiple_choice' || form.type === 'moneyline'
  const showOULine = form.type === 'over_under'
  const showOdds = ['multiple_choice', 'moneyline', 'over_under', 'prop_bet'].includes(form.type)

  function getOddsKeys() {
    if (form.type === 'prop_bet') return ['Yes', 'No']
    if (form.type === 'over_under') return ['over', 'under']
    if (showOptions) return form.options.filter(Boolean)
    return []
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.prompt.trim()) {
      setError('Prompt is required.')
      return
    }

    setSaving(true)
    setError('')

    const isFillBlank = form.type === 'fill_blank'
    const validAcceptedAnswers = form.accepted_answers.filter(Boolean)

    const payload = {
      type: form.type,
      prompt: form.prompt.trim(),
      points: parseInt(form.points, 10) || 100,
      correct_answer: isFillBlank
        ? (validAcceptedAnswers[0] || null)
        : (form.correct_answer || null),
      accepted_answers: isFillBlank ? validAcceptedAnswers : null,
      active: form.active,
      order_index: parseInt(form.order_index, 10) || 0,
      options: showOptions ? form.options.filter(Boolean) : null,
      over_under_line: showOULine && form.over_under_line ? parseFloat(form.over_under_line) : null,
      odds: showOdds ? form.odds : null,
      answer_context: form.answer_context.trim() || null,
      answer_media_urls: form.answer_media_urls.length ? form.answer_media_urls : null,
      answer_media_url: form.answer_media_url.trim() || null,
    }

    const { error: err } = isEdit
      ? await supabase.from('questions').update(payload).eq('id', id)
      : await supabase.from('questions').insert(payload)

    if (err) {
      setError('Save failed: ' + err.message)
      setSaving(false)
      return
    }

    navigate('/admin/questions')
  }

  if (loading) {
    return (
      <div className="loading-state">
        <span className="spinner" />
        Loading...
      </div>
    )
  }

  return (
    <div>
      <h1>{isEdit ? 'Edit Question' : 'New Question'}</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: '640px' }}>
        {/* Type */}
        <div className="form-group">
          <label>Question Type</label>
          <select value={form.type} onChange={(e) => update('type', e.target.value)}>
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Active */}
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ margin: 0 }}>Active</label>
          <label className="switch">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => update('active', e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>

        {/* Prompt */}
        <div className="form-group">
          <label>Prompt</label>
          <textarea
            rows={3}
            value={form.prompt}
            onChange={(e) => update('prompt', e.target.value)}
            placeholder="e.g. How many times will Jack cry during the vows?"
          />
        </div>

        {/* Points */}
        <div className="form-group">
          <label>Points</label>
          <input
            type="number"
            min="0"
            value={form.points}
            onChange={(e) => update('points', e.target.value)}
          />
        </div>

        {/* Correct Answer */}
        {form.type === 'fill_blank' ? (
          <div className="form-group">
            <label>Accepted Answers <span style={{ color: 'var(--cream-dim)', fontWeight: 'normal', fontSize: '0.8rem' }}>(case-insensitive)</span></label>
            {form.accepted_answers.map((ans, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  value={ans}
                  onChange={(e) => updateAcceptedAnswer(i, e.target.value)}
                  placeholder={i === 0 ? 'e.g. Chicago' : 'e.g. Chi-town'}
                />
                {form.accepted_answers.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeAcceptedAnswer(i)}
                    style={{ flexShrink: 0 }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={addAcceptedAnswer}>
              + Add Accepted Answer
            </button>
          </div>
        ) : (
          <div className="form-group">
            <label>Correct Answer</label>
            <input
              type="text"
              value={form.correct_answer}
              onChange={(e) => update('correct_answer', e.target.value)}
              placeholder="Leave blank until you know the answer"
            />
          </div>
        )}

        {/* Options */}
        {showOptions && (
          <div className="form-group">
            <label>Options</label>
            {form.options.map((opt, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                />
                {form.options.length > 2 && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeOption(i)}
                    style={{ flexShrink: 0 }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={addOption}>
              + Add Option
            </button>
          </div>
        )}

        {/* Over/Under line */}
        {showOULine && (
          <div className="form-group">
            <label>Over/Under Line</label>
            <input
              type="number"
              step="0.5"
              value={form.over_under_line}
              onChange={(e) => update('over_under_line', e.target.value)}
              placeholder="e.g. 2.5"
            />
          </div>
        )}

        {/* Odds */}
        {showOdds && (
          <div className="form-group">
            <label>Odds (Vegas format, optional)</label>
            {getOddsKeys().map((key) => (
              <div key={key} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--cream-dim)', minWidth: '100px', fontSize: '0.85rem' }}>{key}</span>
                <input
                  type="text"
                  value={form.odds[key] || ''}
                  onChange={(e) => updateOdds(key, e.target.value)}
                  placeholder="+150 or -180"
                  style={{ maxWidth: '160px' }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Answer Reveal section */}
        <div style={{ borderTop: '1px solid var(--gold-dim)', margin: '1.5rem 0 1rem', paddingTop: '1.25rem' }}>
          <p style={{ color: 'var(--gold)', fontFamily: 'Playfair Display, Georgia, serif', fontStyle: 'italic', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
            Answer Reveal
          </p>

          <div className="form-group">
            <label>
              Context / Explanation{' '}
              <span style={{ color: 'var(--cream-dim)', fontWeight: 'normal', fontSize: '0.8rem' }}>
                (shown to guests when answers are revealed)
              </span>
            </label>
            <textarea
              rows={3}
              value={form.answer_context}
              onChange={(e) => update('answer_context', e.target.value)}
              placeholder="e.g. Jack cried exactly 3 times — once during the vows, once during the first dance..."
            />
          </div>

          {/* Multi-image upload */}
          <div className="form-group">
            <label>
              Photos &amp; Videos{' '}
              <span style={{ color: 'var(--cream-dim)', fontWeight: 'normal', fontSize: '0.8rem' }}>
                (optional — select multiple at once)
              </span>
            </label>

            {form.answer_media_urls.length > 0 && (
              <div className="media-upload-grid">
                {form.answer_media_urls.map((url, i) => (
                  <div key={url + i} className="media-thumb">
                    {isVideo(url) ? (
                      <video src={url} preload="metadata" muted playsInline />
                    ) : (
                      <img src={url} alt={`Photo ${i + 1}`} />
                    )}
                    <button type="button" onClick={() => removeImage(i)} aria-label="Remove">✕</button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploadingCount > 0}
              style={{ display: 'none' }}
              id="media-upload"
            />
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label
                htmlFor="media-upload"
                className="btn btn-secondary btn-sm"
                style={{ cursor: uploadingCount > 0 ? 'not-allowed' : 'pointer', opacity: uploadingCount > 0 ? 0.6 : 1 }}
              >
                {uploadingCount > 0 ? `Uploading ${uploadingCount}…` : '+ Add Photos / Videos'}
              </label>
              {uploadError && <span style={{ color: '#ff8080', fontSize: '0.8rem' }}>{uploadError}</span>}
            </div>
          </div>

          {/* YouTube URL */}
          <div className="form-group">
            <label>
              YouTube URL{' '}
              <span style={{ color: 'var(--cream-dim)', fontWeight: 'normal', fontSize: '0.8rem' }}>
                (optional — shown in addition to or instead of photos)
              </span>
            </label>
            <input
              type="url"
              value={form.answer_media_url}
              onChange={(e) => update('answer_media_url', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
        </div>

        {/* Order index */}
        <div className="form-group">
          <label>Order Index</label>
          <input
            type="number"
            min="0"
            value={form.order_index}
            onChange={(e) => update('order_index', e.target.value)}
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <button type="submit" className="btn btn-primary" disabled={saving || uploadingCount > 0}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Question'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/admin/questions')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
