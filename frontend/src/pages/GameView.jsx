import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

export default function GameView() {
  const { id } = useParams()
  const { user } = useAuth()
  const [game, setGame] = useState(null)
  const [scores, setScores] = useState({})
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const fetchGame = useCallback(async () => {
    try {
      const { data } = await api.get(`/games/${id}/`)
      setGame(data)
      // Build scores lookup: { playerId: { holeNumber: strokes } }
      const s = {}
      data.players.forEach((p) => {
        s[p.user_id] = {}
        p.scores.forEach((sc) => {
          s[p.user_id][sc.hole_number] = sc.strokes
        })
      })
      setScores(s)
    } catch {
      setError('Game not found.')
    }
  }, [id])

  useEffect(() => {
    fetchGame()
  }, [fetchGame])

  const handleScoreChange = (holeNum, value) => {
    setScores((prev) => ({
      ...prev,
      [user.id]: {
        ...prev[user.id],
        [holeNum]: value === '' ? '' : parseInt(value) || 0,
      },
    }))
  }

  const saveScores = async () => {
    setSaving(true)
    setError('')
    try {
      const myScores = scores[user.id] || {}
      const scoreList = Object.entries(myScores)
        .filter(([, v]) => v !== '' && v > 0)
        .map(([hole, strokes]) => ({
          hole_number: parseInt(hole),
          strokes: parseInt(strokes),
        }))

      if (scoreList.length === 0) {
        setError('Enter at least one score.')
        setSaving(false)
        return
      }

      await api.post(`/games/${id}/scores/`, { scores: scoreList })
      await fetchGame()
    } catch (err) {
      const data = err.response?.data
      setError(data?.detail || data?.scores?.[0] || 'Failed to save scores.')
    } finally {
      setSaving(false)
    }
  }

  const completeGame = async () => {
    try {
      await api.patch(`/games/${id}/`, { status: 'completed' })
      await fetchGame()
    } catch {
      setError('Failed to complete game.')
    }
  }

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join/${game.invite_code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (error && !game) return <p className="error-msg">{error}</p>
  if (!game) return <p>Loading game...</p>

  const holes = Array.from({ length: game.num_holes }, (_, i) => i + 1)

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        <h1>
          {game.name}{' '}
          <span className={`badge badge-${game.status}`}>{game.status}</span>
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {game.status === 'active' && (
            <>
              <button className="btn" onClick={saveScores} disabled={saving}>
                {saving ? 'Saving...' : 'Save Scores'}
              </button>
              {game.is_creator && (
                <button className="btn btn-secondary" onClick={completeGame}>
                  Complete Game
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {error && <div className="error-msg" style={{ marginTop: 12 }}>{error}</div>}

      {game.status === 'active' && (
        <div className="invite-box">
          <input
            readOnly
            value={`${window.location.origin}/join/${game.invite_code}`}
          />
          <button className="btn btn-sm" onClick={copyInviteLink}>
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      )}

      <div className="scorecard-wrapper">
        <table className="scorecard">
          <thead>
            <tr>
              <th>Player</th>
              {holes.map((h) => (
                <th key={h}>{h}</th>
              ))}
              <th className="total-col">Total</th>
            </tr>
          </thead>
          <tbody>
            {game.players.map((p) => {
              const isMe = p.user_id === user.id
              const myScores = scores[p.user_id] || {}
              const total = Object.values(myScores).reduce(
                (sum, v) => sum + (parseInt(v) || 0),
                0
              )
              return (
                <tr key={p.user_id}>
                  <td>{p.username}{isMe ? ' (you)' : ''}</td>
                  {holes.map((h) => (
                    <td key={h}>
                      {isMe && game.status === 'active' ? (
                        <input
                          type="number"
                          min={1}
                          value={myScores[h] ?? ''}
                          onChange={(e) => handleScoreChange(h, e.target.value)}
                        />
                      ) : (
                        myScores[h] || '-'
                      )}
                    </td>
                  ))}
                  <td className="total-col">{total || '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
