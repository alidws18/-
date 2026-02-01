import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'
import ReviewerDashboard from './pages/ReviewerDashboard'
import FormsManagement from './pages/admin/FormsManagement'
import CentersManagement from './pages/admin/CentersManagement'
import UsersManagement from './pages/admin/UsersManagement'
import VisitsManagement from './pages/admin/VisitsManagement'
import ReportsPage from './pages/ReportsPage'
import EvaluationForm from './pages/EvaluationForm'
import LoadingSpinner from './components/common/LoadingSpinner'
import './index.css'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(profile?.role?.name)) {
    return <Navigate to="/" replace />
  }

  return children
}

// Dashboard Router based on role
const DashboardRouter = () => {
  const { profile } = useAuth()

  switch (profile?.role?.name) {
    case 'admin':
      return <AdminDashboard />
    case 'manager':
      return <ManagerDashboard />
    case 'employee':
      return <EmployeeDashboard />
    case 'reviewer':
      return <ReviewerDashboard />
    default:
      return <Navigate to="/login" replace />
  }
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/forms"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <FormsManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/centers"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CentersManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UsersManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/visits"
        element={
          <ProtectedRoute allowedRoles={['admin', 'reviewer']}>
            <VisitsManagement />
          </ProtectedRoute>
        }
      />

      {/* Common Routes */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/evaluation/:formId"
        element={
          <ProtectedRoute>
            <EvaluationForm />
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App
