import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)
  const handleLogout = () => { logout(); closeMenu() }

  return (
    <nav>
      <div>
        <Link to="/" className="brand" onClick={closeMenu}>⛳ Minigolf</Link>
      </div>
      <button
        className="nav-hamburger"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
      >
        {menuOpen ? '✕' : '☰'}
      </button>
      <div className={`nav-links${menuOpen ? ' open' : ''}`}>
        {user ? (
          <>
            <Link to="/" onClick={closeMenu}>Dashboard</Link>
            <Link to="/history" onClick={closeMenu}>History</Link>
            <Link to="/settings" onClick={closeMenu}>Settings</Link>
            <span className="nav-username">{user.username}</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={closeMenu}>Login</Link>
            <Link to="/register" onClick={closeMenu}>Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}
