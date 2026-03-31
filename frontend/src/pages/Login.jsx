import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(username, password)
    } catch {
      setError('Invalid username or password.')
    }
  }

  return (
    <div className="form-page">
      <form className="form-card" onSubmit={handleSubmit}>
        <h2>Login</h2>
        {error && <div className="error-msg">{error}</div>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoFocus
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        <div className="switch">
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </form>
    </div>
  )
}
