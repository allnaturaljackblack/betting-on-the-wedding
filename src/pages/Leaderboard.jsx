import { Link } from 'react-router-dom'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useGuest } from '../hooks/useGuest'
import Header from '../components/Header'

function RankDisplay({ rank }) {
  if (rank === 1) return <span className="rank-crown">♛</span>
  if (rank === 2) return <span className="rank-silver">2</span>
  if (rank === 3) return <span className="rank-bronze">3</span>
  return <span style={{ color: 'var(--cream-dim)' }}>{rank}</span>
}

export default function Leaderboard() {
  const { leaderboard, settings, loading, error } = useLeaderboard()
  const { guest } = useGuest()

  const isVegas = settings?.scoring_mode === 'vegas'
  const showAnswers = settings?.show_answers === true

  return (
    <>
      <Header />
      <div className="page">
        <div className="page-wide" style={{ width: '100%', paddingTop: '1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', color: 'var(--gold-dim)', marginBottom: '0.5rem' }}>♛</div>
            <h1 style={{ fontSize: '2rem', color: 'var(--gold)', fontStyle: 'italic' }}>The Leaderboard</h1>
            <p style={{ color: 'var(--cream-dim)', fontSize: '0.85rem' }}>
              {showAnswers
                ? isVegas
                  ? 'Live scores — Vegas chip payouts'
                  : 'Live scores — Traditional scoring'
                : 'Scores will be revealed when answers are shown'}
            </p>
          </div>

          {loading && (
            <div className="loading-state">
              <span className="spinner" />
              Tallying the chips...
            </div>
          )}

          {error && <div className="error-state">Failed to load leaderboard: {error}</div>}

          {!loading && leaderboard.length === 0 && (
            <div className="empty-state">No guests yet. Be the first to place your bets!</div>
          )}

          {!loading && leaderboard.length > 0 && (
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Rank</th>
                    <th>Name</th>
                    <th>Bets</th>
                    {showAnswers && <th>{isVegas ? 'Chips' : 'Score'}</th>}
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => {
                    const isCurrentGuest = guest && entry.id === guest.id
                    const rankClass = entry.rank <= 3 ? `rank-${entry.rank}` : ''
                    return (
                      <tr
                        key={entry.id}
                        className={[rankClass, isCurrentGuest ? 'current-guest' : ''].filter(Boolean).join(' ')}
                      >
                        <td style={{ textAlign: 'center' }}>
                          <RankDisplay rank={entry.rank} />
                        </td>
                        <td>
                          {entry.name}
                          {isCurrentGuest && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--gold-dim)' }}>
                              (you)
                            </span>
                          )}
                        </td>
                        <td style={{ color: 'var(--cream-dim)', fontSize: '0.85rem' }}>
                          {entry.betCount}
                        </td>
                        {showAnswers && (
                          <td style={{ color: 'var(--gold)', fontFamily: "'Playfair Display', serif" }}>
                            {entry.score.toLocaleString()}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {guest && <Link to="/board" className="btn btn-secondary btn-sm">Back to Board</Link>}
            {!guest && <Link to="/enter" className="btn btn-primary btn-sm">Place Your Bets</Link>}
          </div>

          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--cream-dim)' }}>
            &#9830; Updates live as bets are placed
          </p>
        </div>
      </div>
    </>
  )
}
