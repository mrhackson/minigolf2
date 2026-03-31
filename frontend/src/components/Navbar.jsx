import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav>
      <div>
        <Link to="/" className="brand">⛳ Minigolf</Link>
      </div>
      <div>
        {user ? (
          <>
            <Link to="/">Dashboard</Link>
            <Link to="/history">History</Link>
            <Link to="/settings">Settings</Link>
            <span style={{ marginLeft: 16, opacity: 0.85 }}>{user.username}</span>
            <button onClick={logout} style={{ marginLeft: 12 }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}
