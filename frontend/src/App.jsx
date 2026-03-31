import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CreateGame from './pages/CreateGame'
import GameView from './pages/GameView'
import JoinGame from './pages/JoinGame'
import History from './pages/History'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="container">Loading...</div>
  return user ? children : <Navigate to="/login" />
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <div className="container">Loading...</div>

  return (
    <>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/games/new" element={<PrivateRoute><CreateGame /></PrivateRoute>} />
          <Route path="/games/:id" element={<PrivateRoute><GameView /></PrivateRoute>} />
          <Route path="/join/:inviteCode" element={<PrivateRoute><JoinGame /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
        </Routes>
      </div>
    </>
  )
}
