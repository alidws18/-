import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/common/Navbar'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { ClipboardCheck, FileText, Calendar, TrendingUp } from 'lucide-react'

export default function EmployeeDashboard() {
  const [forms, setForms] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Get self-evaluation forms
      const { data: formsData } = await supabase
        .from('forms')
        .select('*')
        .eq('form_type', 'self_evaluation')
        .eq('is_active', true)

      setForms(formsData || [])

      // Get user's evaluations
      const { data: evaluationsData } = await supabase
        .from('evaluations')
        .select(`
          *,
          form:forms(title_ar)
        `)
        .eq('evaluator_id', profile.id)
        .order('created_at', { ascending: false })

      setEvaluations(evaluationsData || [])

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartEvaluation = (formId) => {
    navigate(`/evaluation/${formId}`)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const completedEvaluations = evaluations.filter(e => e.status === 'submitted').length
  const draftEvaluations = evaluations.filter(e => e.status === 'draft').length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="page-title">لوحة تحكم الموظف</h1>
          <p className="text-gray-600">مرحباً {profile?.full_name}</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">التقييمات المكتملة</p>
                <p className="text-3xl font-bold mt-2">{completedEvaluations}</p>
              </div>
              <ClipboardCheck className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">المسودات</p>
                <p className="text-3xl font-bold mt-2">{draftEvaluations}</p>
              </div>
              <FileText className="w-12 h-12 text-orange-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">إجمالي التقييمات</p>
                <p className="text-3xl font-bold mt-2">{evaluations.length}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-200" />
            </div>
          </div>
        </div>

        {/* Available Forms */}
        <div className="card mb-8">
          <h2 className="section-title">نماذج التقييم المتاحة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {forms.map((form) => (
              <div
                key={form.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {form.title_ar}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {form.description || 'نموذج تقييم ذاتي'}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-government-accent" />
                </div>
                <button
                  onClick={() => handleStartEvaluation(form.id)}
                  className="btn-primary w-full"
                >
                  ابدأ التقييم
                </button>
              </div>
            ))}
          </div>

          {forms.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              لا توجد نماذج متاحة حالياً
            </div>
          )}
        </div>

        {/* Recent Evaluations */}
        <div className="card">
          <h2 className="section-title">سجل التقييمات</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">
                    النموذج
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">
                    النسبة
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {evaluations.map((evaluation) => (
                  <tr key={evaluation.id} className="table-row">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {evaluation.form?.title_ar}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 ml-1" />
                        {new Date(evaluation.evaluation_date).toLocaleDateString('ar-SA')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        evaluation.status === 'submitted' ? 'bg-green-100 text-green-800' :
                        evaluation.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {evaluation.status === 'submitted' ? 'مكتمل' :
                         evaluation.status === 'draft' ? 'مسودة' : evaluation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {evaluation.percentage ? `${evaluation.percentage.toFixed(1)}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {evaluations.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              لم تقم بأي تقييمات بعد
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
