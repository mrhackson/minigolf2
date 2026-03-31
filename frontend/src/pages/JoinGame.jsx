import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function JoinGame() {
  const { inviteCode } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .post(`/games/join/${inviteCode}/`)
      .then(({ data }) => {
        navigate(`/games/${data.game_id}`)
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to join game.')
      })
  }, [inviteCode, navigate])

  if (error) {
    return (
      <div className="form-page">
        <div className="form-card">
          <h2>Join Game</h2>
          <div className="error-msg">{error}</div>
          <button className="btn" onClick={() => navigate('/')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <p>Joining game...</p>
}
