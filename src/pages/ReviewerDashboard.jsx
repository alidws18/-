import { useNavigate } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import { FileText, Calendar, BarChart3 } from 'lucide-react'

export default function ReviewerDashboard() {
  const navigate = useNavigate()

  const actions = [
    {
      title: 'الزيارات الميدانية',
      description: 'تسجيل وإدارة الزيارات',
      icon: Calendar,
      color: 'bg-blue-500',
      path: '/admin/visits'
    },
    {
      title: 'التقارير',
      description: 'عرض وتصدير التقارير',
      icon: BarChart3,
      color: 'bg-green-500',
      path: '/reports'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="page-title">لوحة تحكم المراجع</h1>
          <p className="text-gray-600">إدارة الزيارات والمراجعات</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {actions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="card hover:shadow-lg transition-shadow text-right group"
            >
              <div className="flex items-start space-x-4 space-x-reverse">
                <div className={`${action.color} p-4 rounded-lg text-white group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-gray-600">{action.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
