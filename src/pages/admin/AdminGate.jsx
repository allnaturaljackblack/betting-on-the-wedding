import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminGate() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!password) {
      setError('Please enter the password.')
      return
    }

    setLoading(true)
    setError('')

    const { data, error: err } = await supabase
      .from('settings')
      .select('admin_password')
      .eq('id', 1)
      .single()

    if (err || !data) {
      setError('Could not verify password. Check your Supabase connection.')
      setLoading(false)
      return
    }

    if (password === data.admin_password) {
      sessionStorage.setItem('admin_authed', 'true')
      navigate('/admin/dashboard')
    } else {
      setError('Incorrect password. Try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem', color: 'var(--gold-dim)', marginBottom: '0.5rem' }}>&#128274;</div>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--gold)', fontStyle: 'italic' }}>Staff Only</h1>
        <p style={{ color: 'var(--cream-dim)', fontSize: '0.85rem' }}>Admin access required</p>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: '360px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="adminPw">Admin Password</label>
            <input
              id="adminPw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
            />
            {error && <p className="form-error">{error}</p>}
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </form>
      </div>

      <Link to="/" style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--cream-dim)' }}>
        ← Back to Welcome
      </Link>
    </div>
  )
}
