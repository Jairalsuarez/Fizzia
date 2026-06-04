import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './authContext'
import { canAccessRoleArea, getRoleHome, normalizeRole, ROLES } from './roles'
import { BrandLogo } from '../../components/BrandLogo'

export function ProtectedRoute({ role }) {
  const { session, user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center min-h-screen bg-dark-950">
        <div className="text-center space-y-4">
          <BrandLogo mode="mark" markClassName="h-12" className="mx-auto" />
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-fizzia-500 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const userRole = normalizeRole(user?.role || session.user?.user_metadata?.role)

  if (!canAccessRoleArea(role, userRole)) {
    return <Navigate to={getRoleHome(userRole)} replace />
  }

  if (role === 'client' && userRole !== ROLES.CLIENT) {
    return <Navigate to={getRoleHome(userRole)} replace />
  }

  return <Outlet />
}
