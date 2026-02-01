import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/common/Navbar'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { Users, ClipboardCheck, TrendingUp, Plus } from 'lucide-react'

export default function ManagerDashboard() {
  const [employees, setEmployees] = useState([])
  const [forms, setForms] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Get manager's employees
      const { data: employeesData } = await supabase
        .from('employees')
        .select(`
          *,
          user:users(*)
        `)
        .eq('manager_id', profile.id)
        .eq('is_active', true)

      setEmployees(employeesData || [])

      // Get available forms for manager
      const { data: formsData } = await supabase
        .from('forms')
        .select('*')
        .eq('form_type', 'manager_evaluation')
        .eq('is_active', true)

      setForms(formsData || [])

      // Get evaluation statistics
      const { count: totalEvaluations } = await supabase
        .from('evaluations')
        .select('*', { count: 'exact', head: true })
        .eq('evaluator_id', profile.id)

      const { count: completedEvaluations } = await supabase
        .from('evaluations')
        .select('*', { count: 'exact', head: true })
        .eq('evaluator_id', profile.id)
        .eq('status', 'submitted')

      setStats({
        totalEmployees: employeesData?.length || 0,
        totalEvaluations,
        completedEvaluations,
        pendingEvaluations: totalEvaluations - completedEvaluations
      })

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartEvaluation = (formId, employeeId) => {
    navigate(`/evaluation/${formId}?employee=${employeeId}`)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="page-title">لوحة تحكم المدير</h1>
          <p className="text-gray-600">إدارة وتقييم الموظفين</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">عدد الموظفين</p>
                <p className="text-3xl font-bold mt-2">{stats.totalEmployees}</p>
              </div>
              <Users className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">التقييمات المكتملة</p>
                <p className="text-3xl font-bold mt-2">{stats.completedEvaluations}</p>
              </div>
              <ClipboardCheck className="w-12 h-12 text-green-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">التقييمات المعلقة</p>
                <p className="text-3xl font-bold mt-2">{stats.pendingEvaluations}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Employees List */}
        <div className="card">
          <h2 className="section-title">قائمة الموظفين</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">
                    اسم الموظف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">
                    القسم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">
                    المنصب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr key={employee.id} className="table-row">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.user?.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.department_ar || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.position_ar || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2 space-x-reverse">
                        {forms.map((form) => (
                          <button
                            key={form.id}
                            onClick={() => handleStartEvaluation(form.id, employee.user_id)}
                            className="btn-primary text-xs flex items-center space-x-1 space-x-reverse"
                          >
                            <Plus className="w-4 h-4" />
                            <span>{form.title_ar}</span>
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {employees.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              لا يوجد موظفون مسجلون
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
