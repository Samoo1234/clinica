import React, { useState, useEffect } from 'react'
import { ChartPieIcon, EyeIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { reportsService, ConsultationTypeData, ReportFilters } from '../../services/reports'

interface ConsultationTypesProps {
  filters: ReportFilters
  loading: boolean
}

const ConsultationTypesComponent: React.FC<ConsultationTypesProps> = ({
  filters,
  loading
}) => {
  const [consultationData, setConsultationData] = useState<ConsultationTypeData[]>([])
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    loadConsultationTypes()
  }, [filters])

  const loadConsultationTypes = async () => {
    try {
      setReportLoading(true)
      const data = await reportsService.getConsultationTypesReport(filters)
      setConsultationData(data)
    } catch (error) {
      console.error('Error loading consultation types:', error)
    } finally {
      setReportLoading(false)
    }
  }

  // Calculate totals
  const totalConsultations = consultationData.reduce((sum, item) => sum + item.consultation_count, 0)
  const totalUniquePatients = consultationData.reduce((sum, item) => sum + item.unique_patients, 0)

  // Get colors for different diagnosis categories
  const getCategoryColor = (category: string) => {
    const colors = {
      'Miopia': 'bg-blue-100 text-blue-800 border-blue-200',
      'Hipermetropia': 'bg-green-100 text-green-800 border-green-200',
      'Astigmatismo': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Catarata': 'bg-purple-100 text-purple-800 border-purple-200',
      'Glaucoma': 'bg-red-100 text-red-800 border-red-200',
      'Retinopatia': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Outros': 'bg-gray-100 text-gray-800 border-gray-200',
      'Não especificado': 'bg-orange-100 text-orange-800 border-orange-200'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getIconForCategory = (category: string) => {
    // For simplicity, using EyeIcon for all categories
    // In a real app, you might want different icons for different conditions
    return EyeIcon
  }

  if (reportLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
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
          <h2 className="text-xl font-semibold text-gray-900">Tipos de Consulta</h2>
          <p className="text-gray-600">
            Análise dos diagnósticos mais comuns na clínica
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <ChartPieIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Total de Consultas</p>
              <p className="text-2xl font-bold text-blue-900">{totalConsultations}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Pacientes Únicos</p>
              <p className="text-2xl font-bold text-green-900">{totalUniquePatients}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center">
            <EyeIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600">Tipos de Diagnóstico</p>
              <p className="text-2xl font-bold text-purple-900">{consultationData.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Consultation Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {consultationData.map((item) => {
          const Icon = getIconForCategory(item.diagnosis_category)
          return (
            <div
              key={item.diagnosis_category}
              className={`p-4 rounded-lg border-2 ${getCategoryColor(item.diagnosis_category)} transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Icon className="h-6 w-6 opacity-75 mr-2" />
                  <h3 className="font-medium">{item.diagnosis_category}</h3>
                </div>
                <span className="text-sm font-bold opacity-75">
                  {(item.percentage || 0).toFixed(1)}%
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Consultas:</span>
                  <span className="font-medium">{item.consultation_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pacientes:</span>
                  <span className="font-medium">{item.unique_patients}</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 bg-white bg-opacity-50 rounded-full h-2">
                <div
                  className="bg-current h-2 rounded-full opacity-75"
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detailed Table */}
      <div className="bg-white overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Detalhamento por Diagnóstico</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Diagnóstico
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Consultas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pacientes Únicos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Percentual
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Consultas por Paciente
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {consultationData.map((item) => {
              const consultationsPerPatient = item.unique_patients > 0 
                ? ((item.consultation_count || 0) / (item.unique_patients || 1)).toFixed(1)
                : '0'
              
              return (
                <tr key={item.diagnosis_category} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${getCategoryColor(item.diagnosis_category).split(' ')[0]}`}></div>
                      <span className="text-sm font-medium text-gray-900">
                        {item.diagnosis_category}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.consultation_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.unique_patients}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-2">
                        {(item.percentage || 0).toFixed(1)}%
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {consultationsPerPatient}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {consultationData.length === 0 && (
          <div className="text-center py-12">
            <ChartPieIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum dado encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tente ajustar os filtros para encontrar dados de consultas.
            </p>
          </div>
        )}
      </div>

      {/* Insights */}
      {consultationData.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Diagnóstico Mais Comum</h4>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${getCategoryColor(consultationData[0]?.diagnosis_category).split(' ')[0]}`}></div>
                <span className="text-sm text-gray-600">
                  {consultationData[0]?.diagnosis_category} ({(consultationData[0]?.percentage || 0).toFixed(1)}%)
                </span>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Média de Consultas por Paciente</h4>
              <span className="text-sm text-gray-600">
                {totalUniquePatients > 0 ? ((totalConsultations || 0) / totalUniquePatients).toFixed(1) : '0'} consultas
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConsultationTypesComponent