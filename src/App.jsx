import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'
import ReviewerDashboard from './pages/ReviewerDashboard'
// تم تعطيل الصفحات غير الموجودة مؤقتاً
// import FormsManagement from './pages/admin/FormsManagement'
// import CentersManagement from './pages/admin/CentersManagement'
// import UsersManagement from './pages/admin/UsersManagement'
// import VisitsManagement from './pages/admin/VisitsManagement'
import ReportsPage from './pages/ReportsPage'
import EvaluationForm from './pages/EvaluationForm'
import LoadingSpinner from './components/common/LoadingSpinner'
import './index.css'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(profile?.role?.name)) {
    return <Navigate to="/" replace />
  }
  return children
}

// Dashboard Router based on role
const DashboardRouter = () => {
  const { profile } = useAuth()
  switch (profile?.role?.name) {
    case 'admin': return <AdminDashboard />
    case 'manager': return <ManagerDashboard />
    case 'employee': return <EmployeeDashboard />
    case 'reviewer': return <ReviewerDashboard />
    default: return <Navigate to="/login" replace />
  }
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
      
      {/* الصفحات الموجودة فعلياً */}
      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/evaluation/:formId" element={<ProtectedRoute><EvaluationForm /></ProtectedRoute>} />

      {/* تم إيقاف المسارات الناقصة مؤقتاً */}
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
