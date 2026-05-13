import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useGuest } from '../hooks/useGuest'

export default function NameEntry() {
  const [name, setName] = useState('')
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setGuest } = useGuest()
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('settings').select('*').eq('id', 1).single()
      .then(({ data }) => setSettings(data))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || trimmed.length < 2) {
      setError('Please enter your full name.')
      return
    }

    setLoading(true)
    setError('')

    // Check if this name already exists — restore their session instead of creating a duplicate
    const { data: existing } = await supabase
      .from('guests')
      .select('*')
      .ilike('name', trimmed)
      .maybeSingle()

    if (existing) {
      setGuest({ id: existing.id, name: existing.name })
      navigate('/board')
      return
    }

    const { data, error: err } = await supabase
      .from('guests')
      .insert({ name: trimmed })
      .select()
      .single()

    if (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setGuest({ id: data.id, name: data.name })
    navigate('/board')
  }

  const isVegas = settings?.scoring_mode === 'vegas'
  const chips = settings?.starting_chips || 1000

  return (
    <div className="name-entry-page">
      <div className="name-entry-inner">

        <div className="name-entry-header">
          <div className="monogram" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>J &amp; E</div>
          <h1 className="name-entry-title">Who's Placing This Bet?</h1>
          <p className="name-entry-subtitle">Enter your name to take your seat</p>
        </div>

        {isVegas && (
          <div className="chips-banner">
            ♦ You'll receive <strong>{chips.toLocaleString()} chips</strong> to wager
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            autoFocus
            autoComplete="name"
            className="name-entry-input"
          />
          {error && <p className="form-error" style={{ marginTop: '0.5rem' }}>{error}</p>}
          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ marginTop: '0.75rem' }}
            disabled={loading || !name.trim()}
          >
            {loading ? 'Taking your seat...' : 'Take Your Seat'}
          </button>
        </form>

        <p className="name-entry-walkin">
          Your name will appear on the leaderboard.
        </p>

      </div>
    </div>
  )
}
