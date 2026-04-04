import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function GuestList() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { fetchList() }, [])

  async function fetchList() {
    setLoading(true)
    const { data } = await supabase.from('guest_list').select('*').order('name')
    setEntries(data || [])
    setLoading(false)
  }

  async function addSingle(e) {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('guest_list').insert({ name: trimmed })
    if (err) { setError('Failed to add: ' + err.message) }
    else { setNewName(''); setSuccess(`Added ${trimmed}`) }
    setSaving(false)
    fetchList()
  }

  async function handleBulkImport(e) {
    e.preventDefault()
    const names = bulkText
      .split('\n')
      .map((n) => n.trim())
      .filter(Boolean)

    if (!names.length) return
    setSaving(true)
    setError('')

    const rows = names.map((name) => ({ name }))
    const { error: err } = await supabase.from('guest_list').insert(rows)
    if (err) { setError('Import failed: ' + err.message) }
    else { setBulkText(''); setShowBulk(false); setSuccess(`Added ${names.length} guests`) }
    setSaving(false)
    fetchList()
  }

  async function deleteEntry(entry) {
    if (entry.guest_id) return // don't delete claimed entries
    await supabase.from('guest_list').delete().eq('id', entry.id)
    fetchList()
  }

  async function unclaim(entry) {
    if (!window.confirm(`Remove ${entry.name}'s claim? This will let someone else pick this name but will NOT delete their bets.`)) return
    await supabase.from('guest_list').update({ guest_id: null }).eq('id', entry.id)
    fetchList()
  }

  const claimed = entries.filter((e) => e.guest_id)
  const unclaimed = entries.filter((e) => !e.guest_id)

  return (
    <div>
      <h1>Guest List</h1>
      <p style={{ color: 'var(--cream-dim)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Add your expected guests. They'll pick their name from this list instead of typing it — preventing duplicate entries.
      </p>

      {error && <p className="form-error" style={{ marginBottom: '1rem' }}>{error}</p>}
      {success && (
        <p style={{ color: '#6ddc96', marginBottom: '1rem', fontSize: '0.9rem' }}>
          ✓ {success}
        </p>
      )}

      {/* Add single */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Add a Guest</h3>
        <form onSubmit={addSingle} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setSuccess('') }}
            placeholder="Full name"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !newName.trim()}>
            Add
          </button>
        </form>
      </div>

      {/* Bulk import */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => setShowBulk((v) => !v)}
          style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}
        >
          {showBulk ? '▲ Hide bulk import' : '▼ Bulk import (paste list)'}
        </button>
        {showBulk && (
          <form onSubmit={handleBulkImport} style={{ marginTop: '0.75rem' }}>
            <textarea
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"One name per line:\nJane Smith\nJohn Doe\nSarah Johnson"}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.9rem' }}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !bulkText.trim()} style={{ marginTop: '0.5rem' }}>
              Import Names
            </button>
          </form>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div className="stat-card">
          <span className="stat-value">{entries.length}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: '#6ddc96' }}>{claimed.length}</span>
          <span className="stat-label">Claimed</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: 'var(--cream-dim)' }}>{unclaimed.length}</span>
          <span className="stat-label">Unclaimed</span>
        </div>
      </div>

      {loading && <div className="loading-state"><span className="spinner" /> Loading...</div>}

      {!loading && entries.length === 0 && (
        <div className="empty-state">No guests added yet. Add names above.</div>
      )}

      {!loading && entries.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--gold-dim)' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--cream-dim)', fontWeight: 'normal', fontSize: '0.8rem', textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--cream-dim)', fontWeight: 'normal', fontSize: '0.8rem', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }} />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--cream)' }}>{entry.name}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {entry.guest_id
                      ? <span style={{ color: '#6ddc96', fontSize: '0.82rem' }}>✓ Claimed</span>
                      : <span style={{ color: 'var(--cream-dim)', fontSize: '0.82rem' }}>Unclaimed</span>
                    }
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {entry.guest_id ? (
                      <button
                        onClick={() => unclaim(entry)}
                        style={{ background: 'none', border: 'none', color: 'var(--cream-dim)', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Unclaim
                      </button>
                    ) : (
                      <button
                        onClick={() => deleteEntry(entry)}
                        style={{ background: 'none', border: 'none', color: '#ff8080', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    )}
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
