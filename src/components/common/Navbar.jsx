import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LogOut, User, FileText, BarChart3, Settings, Users, Building2 } from 'lucide-react'

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getNavigationLinks = () => {
    const links = []

    if (profile?.role?.name === 'admin') {
      links.push(
        { to: '/', label: 'لوحة التحكم', icon: BarChart3 },
        { to: '/admin/forms', label: 'إدارة النماذج', icon: FileText },
        { to: '/admin/centers', label: 'إدارة المراكز', icon: Building2 },
        { to: '/admin/users', label: 'إدارة المستخدمين', icon: Users },
        { to: '/admin/visits', label: 'الزيارات الميدانية', icon: Settings },
        { to: '/reports', label: 'التقارير', icon: BarChart3 }
      )
    } else if (profile?.role?.name === 'manager') {
      links.push(
        { to: '/', label: 'لوحة التحكم', icon: BarChart3 },
        { to: '/reports', label: 'التقارير', icon: BarChart3 }
      )
    } else if (profile?.role?.name === 'employee') {
      links.push(
        { to: '/', label: 'لوحة التحكم', icon: BarChart3 }
      )
    } else if (profile?.role?.name === 'reviewer') {
      links.push(
        { to: '/', label: 'لوحة التحكم', icon: BarChart3 },
        { to: '/admin/visits', label: 'الزيارات الميدانية', icon: Settings },
        { to: '/reports', label: 'التقارير', icon: BarChart3 }
      )
    }

    return links
  }

  return (
    <nav className="bg-government-dark text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold">نظام التقييم المركزي</h1>
              <p className="text-xs text-gray-300">وزارة الاتصالات وتقنية المعلومات</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4 space-x-reverse">
            {getNavigationLinks().map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-md text-sm font-medium hover:bg-government-light transition-colors"
              >
                <link.icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex items-center space-x-2 space-x-reverse">
              <User className="w-5 h-5" />
              <div className="text-right">
                <p className="text-sm font-medium">{profile?.full_name}</p>
                <p className="text-xs text-gray-300">{profile?.role?.name_ar}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-md text-sm font-medium hover:bg-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 space-y-1">
          {getNavigationLinks().map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-md text-sm font-medium hover:bg-government-light transition-colors"
            >
              <link.icon className="w-4 h-4" />
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
