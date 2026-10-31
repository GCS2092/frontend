import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ roles = ['ADMIN'] }) {
  const { user } = useAuth()
  if (!user || !roles.includes(user.role)) return <Navigate to="/login" replace />
  return <Outlet />
}