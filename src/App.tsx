import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { tokenService } from './services/tokenService'
import { isAdminUser } from './utils/roles'
import { hasPermission } from './utils/permissions'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MailManagement from './pages/MailManagement'
import Appointments from './pages/Appointments'
import ReceptionDashboard from './pages/ReceptionDashboard'
import UserAdministration from './pages/UserAdministration'
import PublicBooking from './pages/PublicBooking'
import Settings from './pages/Settings'
import DeletionRequests from './pages/DeletionRequests'
import Layout from './components/Layout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const hasTokens = tokenService.hasTokens()
  
  // Show loading state while checking auth
  if (loading) {
    return null // or a loading spinner
  }
  
  // Check both state and token for authentication
  if (isAuthenticated || hasTokens) {
    return <>{children}</>
  }
  
  return <Navigate to="/login" />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return null
  }
  if (!isAdminUser(user?.role)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

function PermissionRoute({
  permission,
  children,
}: {
  permission: string
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  if (loading) {
    return null
  }
  if (!hasPermission(user, permission)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/book" element={<PublicBooking />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="mail" element={<MailManagement />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="reception" element={<ReceptionDashboard />} />
        <Route
          path="deletion-requests"
          element={
            <PermissionRoute permission="deletion_requests.review">
              <DeletionRequests />
            </PermissionRoute>
          }
        />
        <Route
          path="users"
          element={
            <AdminRoute>
              <UserAdministration />
            </AdminRoute>
          }
        />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App

