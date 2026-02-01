import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import Navbar from '../components/common/Navbar'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { 
  FileText, 
  Building2, 
  Users, 
  ClipboardCheck, 
  TrendingUp,
  Calendar,
  Award,
  AlertTriangle
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Get statistics
      const [
        { count: totalCenters },
        { count: totalUsers },
        { count: totalForms },
        { count: totalEvaluations },
        { count: pendingEvaluations },
        { data: topCenters },
        { data: recentEvals }
      ] = await Promise.all([
        supabase.from('centers').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('forms').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('evaluations').select('*', { count: 'exact', head: true }),
        supabase.from('evaluations').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('v_center_rankings').select('*').limit(5),
        supabase.from('evaluations').select(`
          *,
          evaluator:users!evaluations_evaluator_id_fkey(full_name),
          form:forms(title_ar)
        `).order('created_at', { ascending: false }).limit(10)
      ])

      setStats({
        totalCenters,
        totalUsers,
        totalForms,
        totalEvaluations,
        pendingEvaluations,
        topCenters: topCenters || []
      })

      setRecentActivity(recentEvals || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const COLORS = ['#0369a1', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd']

  const quickActions = [
    {
      title: 'إدارة النماذج',
      description: 'إنشاء وتعديل نماذج التقييم',
      icon: FileText,
      color: 'bg-blue-500',
      path: '/admin/forms'
    },
    {
      title: 'إدارة المراكز',
      description: 'إضافة وتعديل مراكز خدمة العملاء',
      icon: Building2,
      color: 'bg-green-500',
      path: '/admin/centers'
    },
    {
      title: 'إدارة المستخدمين',
      description: 'إضافة وتعديل المستخدمين والصلاحيات',
      icon: Users,
      color: 'bg-purple-500',
      path: '/admin/users'
    },
    {
      title: 'الزيارات الميدانية',
      description: 'تسجيل وإدارة الزيارات',
      icon: Calendar,
      color: 'bg-orange-500',
      path: '/admin/visits'
    },
    {
      title: 'التقارير',
      description: 'عرض وتصدير التقارير',
      icon: TrendingUp,
      color: 'bg-red-500',
      path: '/reports'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="page-title">لوحة تحكم المدير</h1>
          <p className="text-gray-600">نظرة عامة على نظام التقييم المركزي</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">إجمالي المراكز</p>
                <p className="text-3xl font-bold mt-2">{stats.totalCenters}</p>
              </div>
              <Building2 className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">إجمالي المستخدمين</p>
                <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
              </div>
              <Users className="w-12 h-12 text-green-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">النماذج النشطة</p>
                <p className="text-3xl font-bold mt-2">{stats.totalForms}</p>
              </div>
              <FileText className="w-12 h-12 text-purple-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">إجمالي التقييمات</p>
                <p className="text-3xl font-bold mt-2">{stats.totalEvaluations}</p>
              </div>
              <ClipboardCheck className="w-12 h-12 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Pending Evaluations Alert */}
        {stats.pendingEvaluations > 0 && (
          <div className="card bg-yellow-50 border-r-4 border-yellow-500 mb-8">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600 ml-3" />
              <div>
                <h3 className="font-semibold text-yellow-900">تنبيه: تقييمات معلقة</h3>
                <p className="text-yellow-800 text-sm mt-1">
                  يوجد {stats.pendingEvaluations} تقييم في حالة مسودة بانتظار الإرسال
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="section-title">الإجراءات السريعة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="card hover:shadow-lg transition-shadow text-right group"
              >
                <div className="flex items-start space-x-4 space-x-reverse">
                  <div className={`${action.color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Centers */}
          <div className="card">
            <h2 className="section-title flex items-center">
              <Award className="w-5 h-5 ml-2 text-yellow-500" />
              أفضل 5 مراكز
            </h2>
            {stats.topCenters.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.topCenters}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name_ar" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg_percentage" name="النسبة المئوية" fill="#0369a1" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">لا توجد بيانات متاحة</p>
            )}
          </div>

          {/* Evaluation Status Pie */}
          <div className="card">
            <h2 className="section-title">توزيع حالة التقييمات</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'مكتمل', value: stats.totalEvaluations - stats.pendingEvaluations },
                    { name: 'معلق', value: stats.pendingEvaluations }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[0, 1].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="section-title">النشاطات الأخيرة</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    المقيّم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    النموذج
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    النسبة
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentActivity.map((activity) => (
                  <tr key={activity.id} className="table-row">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.evaluator?.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.form?.title_ar}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activity.status === 'submitted' ? 'bg-green-100 text-green-800' :
                        activity.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.status === 'submitted' ? 'مكتمل' :
                         activity.status === 'draft' ? 'مسودة' : activity.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(activity.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.percentage ? `${activity.percentage.toFixed(1)}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
