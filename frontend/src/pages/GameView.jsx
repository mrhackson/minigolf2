import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import { launchConfetti } from '../utils/confetti'

export default function GameView() {
  const { id } = useParams()
  const { user } = useAuth()
  const [game, setGame] = useState(null)
  const [scores, setScores] = useState({})
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [allPlayers, setAllPlayers] = useState([])
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [controlsOpen, setControlsOpen] = useState(false)
  const confettiShown = useRef(false)

  const fetchGame = useCallback(async () => {
    try {
      const { data } = await api.get(`/games/${id}/`)
      setGame(data)
      
      // Combine registered and guest players
      const combinedPlayers = [
        ...(data.players || []).map(p => ({ ...p, type: 'user', player_id: `user_${p.user_id}` })),
        ...(data.guest_players || []).map(p => ({ ...p, type: 'guest', player_id: `guest_${p.id}`, username: p.name, user_id: `guest_${p.id}` }))
      ]
      setAllPlayers(combinedPlayers)
      
      // Build scores lookup: { player_id: { holeNumber: strokes } }
      const s = {}
      combinedPlayers.forEach((p) => {
        s[p.player_id] = {}
        p.scores.forEach((sc) => {
          s[p.player_id][sc.hole_number] = sc.strokes
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

  // Confetti when logged-in player wins a completed game
  useEffect(() => {
    if (!game || game.status !== 'completed' || !allPlayers.length) return
    if (confettiShown.current) return

    // total === 0 means no scores recorded; filter those players out of winner logic
    const playersWithScores = allPlayers.filter((p) => p.total > 0)
    if (!playersWithScores.length) return

    const minTotal = Math.min(...playersWithScores.map((p) => p.total))
    const myPlayer = allPlayers.find((p) => p.type === 'user' && p.user_id === user.id)
    if (!myPlayer || myPlayer.total !== minTotal) return

    confettiShown.current = true
    const primaryColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary-color')
      .trim()
    launchConfetti([primaryColor, '#ffffff', '#ffd700'])
  }, [game, allPlayers, user])

  const handleScoreChange = (playerId, holeNum, value) => {
    setScores((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [holeNum]: value === '' ? '' : parseInt(value) || 0,
      },
    }))
  }

  const saveScores = async () => {
    setSaving(true)
    setError('')
    try {
      const myPlayerKey = `user_${user.id}`
      const myScores = scores[myPlayerKey] || {}
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

  const saveAllScores = async () => {
    setSaving(true)
    setError('')
    try {
      const scoreUpdates = []
      
      // Collect all score changes
      Object.entries(scores).forEach(([playerId, playerScores]) => {
        const [playerType, playerIdNum] = playerId.split('_')
        Object.entries(playerScores).forEach(([holeNum, strokes]) => {
          if (strokes !== '' && strokes > 0) {
            scoreUpdates.push({
              player_type: playerType,
              player_id: parseInt(playerIdNum),
              hole_number: parseInt(holeNum),
              strokes: parseInt(strokes)
            })
          }
        })
      })

      if (scoreUpdates.length === 0) {
        setError('No scores to save.')
        setSaving(false)
        return
      }

      await api.post(`/games/${id}/bulk-scores/`, { scores: scoreUpdates })
      await fetchGame()
    } catch (err) {
      const data = err.response?.data
      setError(data?.detail || data?.scores?.[0] || 'Failed to save scores.')
    } finally {
      setSaving(false)
    }
  }

  const addGuestPlayer = async () => {
    if (!newPlayerName.trim()) {
      setError('Please enter a player name.')
      return
    }

    setAddingPlayer(true)
    setError('')
    try {
      await api.post(`/games/${id}/guest-players/`, { name: newPlayerName.trim() })
      setNewPlayerName('')
      await fetchGame()
    } catch (err) {
      const data = err.response?.data
      setError(data?.detail || data?.name?.[0] || 'Failed to add player.')
    } finally {
      setAddingPlayer(false)
    }
  }

  const removeGuestPlayer = async (guestPlayerId) => {
    if (!window.confirm('Remove this player? All their scores will be lost.')) {
      return
    }

    try {
      await api.delete(`/games/${id}/guest-players/${guestPlayerId}/`)
      await fetchGame()
    } catch (err) {
      const data = err.response?.data
      setError(data?.detail || 'Failed to remove player.')
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
  const isCreator = game.is_creator
  const canEditAllScores = isCreator && game.status === 'active'
  const isCompleted = game.status === 'completed'

  // Determine winner(s) — lowest total among players who have at least one score
  // (total === 0 means no scores were recorded for that player)
  const winnerPlayerIds = (() => {
    if (!isCompleted || !allPlayers.length) return new Set()
    const playersWithScores = allPlayers.filter((p) => p.total > 0)
    if (!playersWithScores.length) return new Set()
    const minTotal = Math.min(...playersWithScores.map((p) => p.total))
    return new Set(playersWithScores.filter((p) => p.total === minTotal).map((p) => p.player_id))
  })()

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        <h1>
          {game.name}{' '}
          <span className={`badge badge-${game.status}`}>{game.status}</span>
        </h1>
        {(game.status === 'active') && (
          <button
            className="btn btn-secondary btn-sm controls-toggle"
            onClick={() => setControlsOpen((o) => !o)}
            aria-expanded={controlsOpen}
          >
            ⚙ Controls {controlsOpen ? '▲' : '▼'}
          </button>
        )}
      </div>

      {error && <div className="error-msg" style={{ marginTop: 12 }}>{error}</div>}

      {controlsOpen && game.status === 'active' && (
        <div className="controls-panel">
          <div className="controls-panel-actions">
            {canEditAllScores ? (
              <button className="btn" onClick={saveAllScores} disabled={saving}>
                {saving ? 'Saving...' : 'Save All Scores'}
              </button>
            ) : (
              <button className="btn" onClick={saveScores} disabled={saving}>
                {saving ? 'Saving...' : 'Save My Scores'}
              </button>
            )}
            {isCreator && (
              <button className="btn btn-secondary" onClick={completeGame}>
                Complete Game
              </button>
            )}
          </div>

          {isCreator && (
            <div className="player-management" style={{ marginTop: 16 }}>
              <h3>Add Player</h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Player Name"
                  onKeyDown={(e) => e.key === 'Enter' && addGuestPlayer()}
                />
                <button className="btn btn-sm" onClick={addGuestPlayer} disabled={addingPlayer}>
                  {addingPlayer ? 'Adding...' : 'Add Player'}
                </button>
              </div>
            </div>
          )}

          <div className="invite-box" style={{ marginTop: 16 }}>
            <input
              readOnly
              value={`${window.location.origin}/join/${game.invite_code}`}
            />
            <button className="btn btn-sm" onClick={copyInviteLink}>
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      )}

      <div className="scorecard-wrapper">
        <table className="scorecard">
          <thead>
            <tr>
              <th>Hole</th>
              {allPlayers.map((p) => {
                const isMe = p.type === 'user' && p.user_id === user.id
                const isWinner = winnerPlayerIds.has(p.player_id)
                return (
                  <th key={p.player_id} className={isWinner ? 'winner-col' : ''}>
                    {isWinner && '🏆 '}
                    {p.username}
                    {isMe && ' (you)'}
                    {p.type === 'guest' && ' (guest)'}
                    {isCreator && game.status === 'active' && p.type === 'guest' && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => removeGuestPlayer(p.id)}
                        title="Remove player"
                        style={{ marginLeft: 6 }}
                      >
                        ×
                      </button>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {holes.map((h) => (
              <tr key={h}>
                <td>{h}</td>
                {allPlayers.map((p) => {
                  const isMe = p.type === 'user' && p.user_id === user.id
                  const canEditPlayer = canEditAllScores || isMe
                  const playerScores = scores[p.player_id] || {}
                  const isWinner = winnerPlayerIds.has(p.player_id)
                  return (
                    <td key={p.player_id} className={isWinner ? 'winner-col' : ''}>
                      {canEditPlayer && game.status === 'active' ? (
                        <input
                          type="number"
                          min={1}
                          value={playerScores[h] ?? ''}
                          onChange={(e) => handleScoreChange(p.player_id, h, e.target.value)}
                          style={{ width: '60px' }}
                        />
                      ) : (
                        playerScores[h] ?? '-'
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
            <tr>
              <td className="total-col">Total</td>
              {allPlayers.map((p) => {
                const isWinner = winnerPlayerIds.has(p.player_id)
                const playerScores = scores[p.player_id] || {}
                const calculatedTotal = Object.values(playerScores).reduce(
                  (sum, v) => sum + (parseInt(v) || 0),
                  0
                )
                // For completed games, prefer server-calculated total; for active games use live state
                const displayTotal = isCompleted
                  ? (p.total > 0 ? p.total : calculatedTotal > 0 ? calculatedTotal : '-')
                  : (calculatedTotal > 0 ? calculatedTotal : '-')
                return (
                  <td
                    key={p.player_id}
                    className={`total-col${isWinner ? ' winner-col' : ''}`}
                  >
                    {displayTotal}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
