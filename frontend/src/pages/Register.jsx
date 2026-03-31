import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await register(username, email, password)
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const msg = Object.values(data).flat().join(' ')
        setError(msg)
      } else {
        setError('Registration failed.')
      }
    }
  }

  return (
    <div className="form-page">
      <form className="form-card" onSubmit={handleSubmit}>
        <h2>Register</h2>
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
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <button type="submit">Register</button>
        <div className="switch">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </form>
    </div>
  )
}
