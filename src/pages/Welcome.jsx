import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGuest } from '../hooks/useGuest'

export default function Welcome() {
  const { guest } = useGuest()
  const navigate = useNavigate()

  useEffect(() => {
    if (guest) navigate('/board', { replace: true })
  }, [])

  return (
    <div className="welcome-page">
      {/* Corner suits */}
      <div style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', fontSize: '1.5rem', color: 'var(--gold-dim)' }}>♠</div>
      <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', fontSize: '1.5rem', color: 'var(--red)' }}>♥</div>
      <div style={{ position: 'absolute', bottom: '1.25rem', left: '1.25rem', fontSize: '1.5rem', color: 'var(--red)' }}>♦</div>
      <div style={{ position: 'absolute', bottom: '1.25rem', right: '1.25rem', fontSize: '1.5rem', color: 'var(--gold-dim)' }}>♣</div>

      {/* Monogram */}
      <div className="monogram">J &amp; E</div>

      {/* Title */}
      <h1 className="welcome-heading">Betting on the Wedding</h1>

      {/* Names & Date */}
      <p className="welcome-names">Jack DeSpain &amp; Emily Hill</p>
      <p className="welcome-date" style={{ marginTop: '0.5rem' }}>May 16th, 2026</p>

      {/* Divider */}
      <div className="divider" style={{ width: '100%', maxWidth: '320px', margin: '1.5rem auto' }}>
        <span>&#9830;</span>
      </div>

      {/* Description */}
      <p className="welcome-desc">
        Place your bets on the big night.<br />Who knows the couple best?
      </p>

      {/* CTA */}
      <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <Link to="/enter" className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.9rem 2.5rem' }}>
          Enter the Casino
        </Link>
        <Link to="/leaderboard" style={{ fontSize: '0.85rem', color: 'var(--cream-dim)' }}>
          View the Odds Board
        </Link>
      </div>

      {/* Bottom suit row */}
      <div className="suits-row" style={{ marginTop: '3rem' }}>
        <span>♠</span>
        <span className="red-suit">♥</span>
        <span className="red-suit">♦</span>
        <span>♣</span>
      </div>
    </div>
  )
}
