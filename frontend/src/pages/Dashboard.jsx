import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

export default function Dashboard() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/games/').then(({ data }) => {
      setGames(data)
      setLoading(false)
    })
  }, [])

  if (loading) return <p>Loading games...</p>

  const active = games.filter((g) => g.status === 'active')
  const completed = games.filter((g) => g.status === 'completed')

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <h1>Dashboard</h1>
        <Link to="/games/new" className="btn">+ New Game</Link>
      </div>

      <h2 className="section-title">Active Games ({active.length})</h2>
      {active.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No active games. Create one!</p>}
      {active.map((g) => (
        <Link to={`/games/${g.id}`} key={g.id} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card">
            <h3>{g.name} <span className="badge badge-active">Active</span></h3>
            <p className="meta">
              {g.num_holes} holes · {g.player_count} player{g.player_count !== 1 ? 's' : ''} · Created by {g.creator_name}
            </p>
          </div>
        </Link>
      ))}

      <h2 className="section-title">Completed Games ({completed.length})</h2>
      {completed.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No completed games yet.</p>}
      {completed.map((g) => (
        <Link to={`/games/${g.id}`} key={g.id} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card">
            <h3>{g.name} <span className="badge badge-completed">Completed</span></h3>
            <p className="meta">
              {g.num_holes} holes · {g.player_count} player{g.player_count !== 1 ? 's' : ''} · Created by {g.creator_name}
            </p>
          </div>
        </Link>
      ))}
    </>
  )
}
