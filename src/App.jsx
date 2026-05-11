import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useGuest } from './hooks/useGuest'

// Pages
import Welcome from './pages/Welcome'
import NameEntry from './pages/NameEntry'
import Board from './pages/Board'
import BetDetail from './pages/BetDetail'
import MySlip from './pages/MySlip'
import Leaderboard from './pages/Leaderboard'

// Admin
import AdminGate from './pages/admin/AdminGate'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Questions from './pages/admin/Questions'
import QuestionForm from './pages/admin/QuestionForm'
import Settings from './pages/admin/Settings'
import GuestList from './pages/admin/GuestList'
import QRCode from './pages/admin/QRCode'
import MCView from './pages/admin/MCView'

function RequireGuest({ children }) {
  const { guest } = useGuest()
  if (!guest) return <Navigate to="/enter" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Welcome />} />
      <Route path="/enter" element={<NameEntry />} />
      <Route path="/leaderboard" element={<Leaderboard />} />

      {/* Guest-protected */}
      <Route
        path="/board"
        element={
          <RequireGuest>
            <Board />
          </RequireGuest>
        }
      />
      <Route
        path="/bet/:id"
        element={
          <RequireGuest>
            <BetDetail />
          </RequireGuest>
        }
      />
      <Route
        path="/slip"
        element={
          <RequireGuest>
            <MySlip />
          </RequireGuest>
        }
      />

      {/* Admin */}
      <Route path="/admin" element={<AdminGate />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="questions" element={<Questions />} />
        <Route path="questions/new" element={<QuestionForm />} />
        <Route path="questions/:id/edit" element={<QuestionForm />} />
        <Route path="settings" element={<Settings />} />
        <Route path="guests" element={<GuestList />} />
        <Route path="qr" element={<QRCode />} />
        <Route path="mc" element={<MCView />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
