import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const [stats, setStats] = useState({ guests: 0, bets: 0, questions: 0, scoringMode: 'traditional' })
  const [guests, setGuests] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, fetchData)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchData() {
    setLoading(true)
    const [guestsRes, betsRes, questionsRes, settingsRes] = await Promise.all([
      supabase.from('guests').select('*').order('created_at', { ascending: false }),
      supabase.from('bets').select('guest_id, question_id'),
      supabase.from('questions').select('id, active').eq('active', true),
      supabase.from('settings').select('*').eq('id', 1).single(),
    ])

    const guestsData = guestsRes.data || []
    const betsData = betsRes.data || []

    const betCountByGuest = {}
    for (const b of betsData) {
      betCountByGuest[b.guest_id] = (betCountByGuest[b.guest_id] || 0) + 1
    }

    setGuests(guestsData.map((g) => ({ ...g, betCount: betCountByGuest[g.id] || 0 })))
    setSettings(settingsRes.data)
    setStats({
      guests: guestsData.length,
      bets: betsData.length,
      questions: (questionsRes.data || []).length,
      scoringMode: settingsRes.data?.scoring_mode || 'traditional',
    })
    setLoading(false)
  }

  async function toggleLock() {
    setActionLoading(true)
    await supabase.from('settings').update({ event_locked: !settings.event_locked }).eq('id', 1)
    await fetchData()
    setActionLoading(false)
  }

  async function toggleAnswers() {
    setActionLoading(true)
    await supabase.from('settings').update({ show_answers: !settings.show_answers }).eq('id', 1)
    await fetchData()
    setActionLoading(false)
  }

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.guests}</div>
          <div className="stat-label">Total Guests</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.bets}</div>
          <div className="stat-label">Bets Placed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.questions}</div>
          <div className="stat-label">Active Questions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '1rem', paddingTop: '0.5rem' }}>
            {stats.scoringMode === 'vegas' ? '🎰 Vegas' : '📋 Traditional'}
          </div>
          <div className="stat-label">Scoring Mode</div>
        </div>
      </div>

      {/* Quick actions */}
      {settings && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', color: 'var(--cream-dim)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${settings.event_locked ? 'btn-primary' : 'btn-danger'}`}
              onClick={toggleLock}
              disabled={actionLoading}
            >
              {settings.event_locked ? '🔓 Unlock Betting' : '🔒 Lock Betting'}
            </button>
            <button
              className={`btn btn-sm ${settings.show_answers ? 'btn-danger' : 'btn-primary'}`}
              onClick={toggleAnswers}
              disabled={actionLoading}
            >
              {settings.show_answers ? 'Hide Answers' : 'Show Answers'}
            </button>
          </div>
        </div>
      )}

      {/* Guests list */}
      <div>
        <h2 style={{ fontSize: '1rem', color: 'var(--cream-dim)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Recent Guests
        </h2>
        {loading ? (
          <div className="loading-state" style={{ padding: '1rem' }}>
            <span className="spinner" />
          </div>
        ) : guests.length === 0 ? (
          <div className="empty-state" style={{ padding: '1.5rem' }}>No guests yet.</div>
        ) : (
          <div style={{ background: 'var(--green-mid)', border: '1px solid var(--gold-dim)', borderRadius: '6px', overflow: 'hidden' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Bets Placed</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {guests.slice(0, 20).map((g) => (
                  <tr key={g.id}>
                    <td>{g.name}</td>
                    <td style={{ color: 'var(--gold)' }}>{g.betCount}</td>
                    <td style={{ color: 'var(--cream-dim)', fontSize: '0.8rem' }}>
                      {new Date(g.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
