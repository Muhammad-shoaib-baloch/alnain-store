import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

/**
 * Guards routes by authentication (and optionally role).
 * Customers can never reach /admin; guests are bounced to /login with a
 * `next` param so they return where they were headed.
 */
export default function ProtectedRoute({ role }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }
  if (role === 'admin' && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
