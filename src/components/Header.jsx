import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGuest } from '../hooks/useGuest'
import { isMuted, setMuted } from '../utils/sounds'

export default function Header() {
  const { guest, clearGuest } = useGuest()
  const navigate = useNavigate()
  const [muted, setMutedState] = useState(isMuted)

  function handleLeave() {
    clearGuest()
    navigate('/')
  }

  function toggleMute() {
    const next = !muted
    setMuted(next)
    setMutedState(next)
  }

  return (
    <header className="site-header">
      <Link to="/" className="brand">J &amp; E — Betting on the Wedding</Link>
      <nav>
        {guest ? (
          <>
            <Link to="/board">Board</Link>
            <Link to="/slip">My Slip</Link>
            <Link to="/leaderboard">Leaderboard</Link>
            <button onClick={handleLeave} className="header-btn">Leave</button>
          </>
        ) : (
          <>
            <Link to="/enter">Enter</Link>
            <Link to="/leaderboard">Leaderboard</Link>
          </>
        )}
        <button onClick={toggleMute} className="header-btn mute-btn" aria-label={muted ? 'Unmute' : 'Mute'}>
          {muted ? '🔇' : '🔊'}
        </button>
      </nav>
    </header>
  )
}
