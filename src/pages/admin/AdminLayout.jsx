import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'

export default function AdminLayout() {
  const navigate = useNavigate()

  useEffect(() => {
    if (sessionStorage.getItem('admin_authed') !== 'true') {
      navigate('/admin')
    }
  }, [])

  function handleExit() {
    sessionStorage.removeItem('admin_authed')
    navigate('/')
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <span className="brand">&#9830; Admin Panel</span>
        <nav>
          <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/questions" className={({ isActive }) => isActive ? 'active' : ''}>
            Questions
          </NavLink>
          <NavLink to="/admin/guests" className={({ isActive }) => isActive ? 'active' : ''}>
            Guest List
          </NavLink>
          <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'active' : ''}>
            Settings
          </NavLink>
        </nav>
        <button
          onClick={handleExit}
          className="exit-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--cream-dim)', padding: '0', marginTop: 'auto', paddingTop: '2rem' }}
        >
          ← Exit Admin
        </button>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}
