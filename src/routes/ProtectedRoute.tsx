import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const isLimitedAllowed = (pathname: string) => pathname === '/sdr' || pathname.startsWith('/sdr/')

export function ProtectedRoute() {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-app-bg">
        <span className="text-sm text-text-muted">Carregando…</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/login" replace />
  }

  if (user?.is_limited === true && !isLimitedAllowed(location.pathname)) {
    return <Navigate to="/sdr" replace />
  }

  return <Outlet />
}
