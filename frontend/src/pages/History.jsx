import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

export default function History() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/games/history/').then(({ data }) => {
      setGames(data)
      setLoading(false)
    })
  }, [])

  if (loading) return <p>Loading history...</p>

  return (
    <>
      <h1 style={{ marginTop: 8 }}>Game History</h1>

      {games.length === 0 && (
        <p style={{ color: '#888', marginTop: 16 }}>
          No games played yet. <Link to="/games/new">Start one!</Link>
        </p>
      )}

      {games.map((g) => (
        <Link to={`/games/${g.id}`} key={g.id} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card">
            <h3>
              {g.name}{' '}
              <span className={`badge badge-${g.status}`}>{g.status}</span>
            </h3>
            <p className="meta">
              {g.num_holes} holes · {g.player_count} player{g.player_count !== 1 ? 's' : ''} · Created by {g.creator_name}
            </p>
            <p style={{ marginTop: 4, fontWeight: 600 }}>
              Your total: {g.total_score ?? '-'} strokes
            </p>
            <p className="meta">
              {new Date(g.created_at).toLocaleDateString()}
            </p>
          </div>
        </Link>
      ))}
    </>
  )
}
