import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Settings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  async function resetReveals() {
    if (!window.confirm('Reset all revealed answers? Guests will no longer see any results until you reveal them again.')) return
    setResetting(true)
    setResetSuccess(false)
    await supabase.from('questions').update({ answer_revealed: false }).neq('id', '00000000-0000-0000-0000-000000000000')
    setResetting(false)
    setResetSuccess(true)
    setTimeout(() => setResetSuccess(false), 3000)
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    setLoading(true)
    const { data } = await supabase.from('settings').select('*').eq('id', 1).single()
    setSettings(data)
    setLoading(false)
  }

  async function updateSetting(field, value) {
    setSaving(true)
    await supabase.from('settings').update({ [field]: value }).eq('id', 1)
    await fetchSettings()
    setSaving(false)
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    if (!newPassword || newPassword.length < 4) {
      setPwError('Password must be at least 4 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.')
      return
    }
    setSaving(true)
    await supabase.from('settings').update({ admin_password: newPassword }).eq('id', 1)
    setNewPassword('')
    setConfirmPassword('')
    setPwSuccess(true)
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="loading-state">
        <span className="spinner" />
        Loading settings...
      </div>
    )
  }

  if (!settings) return <div className="error-state">Failed to load settings.</div>

  const isVegas = settings.scoring_mode === 'vegas'

  return (
    <div>
      <h1>Settings</h1>

      <div style={{ maxWidth: '560px' }}>

        {/* Scoring Mode */}
        <div style={{ marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1rem', color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', fontFamily: 'Georgia, serif' }}>
            Scoring Mode
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <button
              className={`btn btn-sm ${!isVegas ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => updateSetting('scoring_mode', 'traditional')}
              disabled={saving}
            >
              Traditional
            </button>
            <button
              className={`btn btn-sm ${isVegas ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => updateSetting('scoring_mode', 'vegas')}
              disabled={saving}
            >
              Vegas
            </button>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--cream-dim)', fontStyle: 'italic' }}>
            {isVegas
              ? 'Vegas: Guests wager chips. Payouts based on American odds.'
              : 'Traditional: Points awarded for correct answers.'}
          </p>
        </div>

        {/* Show Answers */}
        <div className="toggle-row">
          <div className="toggle-info">
            <h3>Show Answers</h3>
            <p>Reveal correct answers to guests after they submit</p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.show_answers}
              onChange={() => updateSetting('show_answers', !settings.show_answers)}
              disabled={saving}
            />
            <span className="slider" />
          </label>
        </div>

        {/* Lock Betting */}
        <div className="toggle-row">
          <div className="toggle-info">
            <h3>Lock Betting</h3>
            <p>Prevent new bets from being placed</p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.event_locked}
              onChange={() => updateSetting('event_locked', !settings.event_locked)}
              disabled={saving}
            />
            <span className="slider" />
          </label>
        </div>

        {/* Starting Chips (Vegas only) */}
        {isVegas && (
          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label>Starting Chips</label>
            <input
              type="number"
              min="100"
              step="100"
              value={settings.starting_chips}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                if (v > 0) updateSetting('starting_chips', v)
              }}
              style={{ maxWidth: '200px' }}
              disabled={saving}
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--cream-dim)', marginTop: '0.3rem' }}>
              Chips given to each new guest
            </p>
          </div>
        )}

        {/* Practice / Reset */}
        <div style={{ marginTop: '1.5rem', background: 'var(--green-mid)', border: '1px solid var(--gold-dim)', borderRadius: '6px', padding: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--cream)', marginBottom: '0.25rem', fontFamily: 'Georgia, serif', fontWeight: 'normal' }}>
            Practice Run
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--cream-dim)', marginBottom: '0.75rem' }}>
            Hides all revealed answers from guests so you can run through the MC flow again from the start.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn btn-danger btn-sm"
              onClick={resetReveals}
              disabled={resetting}
            >
              {resetting ? 'Resetting…' : 'Reset All Reveals'}
            </button>
            {resetSuccess && <span style={{ color: '#6ddc96', fontSize: '0.85rem' }}>✓ All reveals cleared</span>}
          </div>
        </div>

        {/* Change Admin Password */}
        <div style={{ marginTop: '1.5rem', background: 'var(--green-mid)', border: '1px solid var(--gold-dim)', borderRadius: '6px', padding: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--cream)', marginBottom: '0.75rem', fontFamily: 'Georgia, serif', fontWeight: 'normal' }}>
            Change Admin Password
          </h3>
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            {pwError && <p className="form-error">{pwError}</p>}
            {pwSuccess && <p style={{ color: '#6ddc96', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Password updated!</p>}
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              Change Password
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
