import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function CreateGame() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [numHoles, setNumHoles] = useState(18)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const { data } = await api.post('/games/', { name, num_holes: numHoles })
      navigate(`/games/${data.id}`)
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const msg = Object.values(data).flat().join(' ')
        setError(msg)
      } else {
        setError('Failed to create game.')
      }
    }
  }

  return (
    <div className="form-page">
      <form className="form-card" onSubmit={handleSubmit}>
        <h2>New Game</h2>
        {error && <div className="error-msg">{error}</div>}
        <input
          type="text"
          placeholder="Game name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
        <label style={{ display: 'block', marginBottom: 6, fontSize: '0.9rem', color: '#555' }}>
          Number of holes
        </label>
        <input
          type="number"
          min={1}
          max={36}
          value={numHoles}
          onChange={(e) => setNumHoles(parseInt(e.target.value) || 1)}
          required
        />
        <button type="submit">Create Game</button>
      </form>
    </div>
  )
}
