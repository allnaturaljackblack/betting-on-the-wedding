import { Link, useNavigate } from 'react-router-dom'
import { useGuest } from '../hooks/useGuest'

export default function Header() {
  const { guest, clearGuest } = useGuest()
  const navigate = useNavigate()

  function handleLeave() {
    if (!window.confirm('Leave the game? Your bets are saved, but you\'ll need to enter your name again to get back in.')) return
    clearGuest()
    navigate('/')
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
      </nav>
    </header>
  )
}
