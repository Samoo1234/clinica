import React, { useState, useEffect } from 'react'
import { UserGroupIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import { reportsService, DoctorPerformanceData, ReportFilters } from '../../services/reports'

interface DoctorPerformanceProps {
  filters: ReportFilters
  onExport: () => void
  loading: boolean
}

const DoctorPerformanceComponent: React.FC<DoctorPerformanceProps> = ({
  filters,
  onExport,
  loading
}) => {
  const [performanceData, setPerformanceData] = useState<DoctorPerformanceData[]>([])
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    loadDoctorPerformance()
  }, [filters])

  const loadDoctorPerformance = async () => {
    try {
      setReportLoading(true)
      const data = await reportsService.getDoctorPerformanceReport(filters)
      setPerformanceData(data)
    } catch (error) {
      console.error('Error loading doctor performance:', error)
    } finally {
      setReportLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercentage = (value: number | null) => {
    if (value === null || value === undefined) {
      return '0.0%'
    }
    return `${value.toFixed(1)}%`
  }

  // Calculate totals
  const totals = performanceData.reduce(
    (acc, doctor) => ({
      appointments: acc.appointments + doctor.total_appointments,
      completed: acc.completed + doctor.completed_appointments,
      cancelled: acc.cancelled + doctor.cancelled_appointments,
      noShow: acc.noShow + doctor.no_show_appointments,
      revenue: acc.revenue + doctor.total_revenue,
      records: acc.records + doctor.medical_records_count
    }),
    { appointments: 0, completed: 0, cancelled: 0, noShow: 0, revenue: 0, records: 0 }
  )

  const overallCompletionRate = totals.appointments > 0 ? (totals.completed / totals.appointments) * 100 : 0
  const averageRevenue = performanceData.length > 0 ? totals.revenue / performanceData.length : 0

  if (reportLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Desempenho dos Médicos</h2>
          <p className="text-gray-600">
            Análise de performance individual dos médicos
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Médicos Ativos</p>
              <p className="text-2xl font-bold text-blue-900">{performanceData.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center">
            <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Consultas Concluídas</p>
              <p className="text-2xl font-bold text-green-900">{totals.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
              R$
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-600">Receita Total</p>
              <p className="text-2xl font-bold text-yellow-900">{formatCurrency(totals.revenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center">
            <ClipboardDocumentListIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600">Prontuários</p>
              <p className="text-2xl font-bold text-purple-900">{totals.records}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Médico
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Consultas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Concluídas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Canceladas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Não Compareceu
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Taxa Conclusão
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receita
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Médio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prontuários
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {performanceData.map((doctor) => (
              <tr key={doctor.doctor_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {doctor.doctor_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {doctor.doctor_name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {doctor.total_appointments}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                  {doctor.completed_appointments}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                  {doctor.cancelled_appointments}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {doctor.no_show_appointments}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${
                      doctor.completion_rate >= 80 ? 'text-green-600' : 
                      doctor.completion_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(doctor.completion_rate)}
                    </span>
                    {doctor.completion_rate >= 80 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 ml-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 text-red-600 ml-1" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {formatCurrency(doctor.total_revenue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(doctor.average_consultation_value)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {doctor.medical_records_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {performanceData.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum médico encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tente ajustar os filtros para encontrar dados de médicos.
            </p>
          </div>
        )}
      </div>

      {/* Performance Rankings */}
      {performanceData.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top by Appointments */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-lg font-medium text-blue-900 mb-3">Mais Consultas</h3>
            <div className="space-y-2">
              {performanceData
                .sort((a, b) => b.total_appointments - a.total_appointments)
                .slice(0, 3)
                .map((doctor, index) => (
                  <div key={doctor.doctor_id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        'bg-orange-300 text-orange-700'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="ml-2 text-sm text-blue-900 truncate">
                        {doctor.doctor_name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-blue-600">
                      {doctor.total_appointments}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Top by Revenue */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="text-lg font-medium text-green-900 mb-3">Maior Receita</h3>
            <div className="space-y-2">
              {performanceData
                .sort((a, b) => b.total_revenue - a.total_revenue)
                .slice(0, 3)
                .map((doctor, index) => (
                  <div key={doctor.doctor_id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        'bg-orange-300 text-orange-700'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="ml-2 text-sm text-green-900 truncate">
                        {doctor.doctor_name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(doctor.total_revenue)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Top by Completion Rate */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="text-lg font-medium text-purple-900 mb-3">Melhor Taxa de Conclusão</h3>
            <div className="space-y-2">
              {performanceData
                .filter(doctor => doctor.total_appointments > 0)
                .sort((a, b) => b.completion_rate - a.completion_rate)
                .slice(0, 3)
                .map((doctor, index) => (
                  <div key={doctor.doctor_id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        'bg-orange-300 text-orange-700'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="ml-2 text-sm text-purple-900 truncate">
                        {doctor.doctor_name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-purple-600">
                      {formatPercentage(doctor.completion_rate)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorPerformanceComponent