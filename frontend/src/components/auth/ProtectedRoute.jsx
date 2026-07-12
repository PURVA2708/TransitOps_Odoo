// Route guard: requires login, and optionally a permitted role (RBAC).
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { can } from '../../constants/roles'

export default function ProtectedRoute({ feature, children }) {
  const { isAuthed, user } = useAuth()
  const location = useLocation()

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (feature && !can(user.role, feature)) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}
