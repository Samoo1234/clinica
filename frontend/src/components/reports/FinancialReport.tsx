import React, { useState, useEffect } from 'react'
import { CurrencyDollarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import { reportsService, FinancialReportData, ReportFilters } from '../../services/reports'

interface FinancialReportProps {
  filters: ReportFilters
  onExport: () => void
  loading: boolean
}

const FinancialReportComponent: React.FC<FinancialReportProps> = ({
  filters,
  onExport,
  loading
}) => {
  const [financialData, setFinancialData] = useState<FinancialReportData[]>([])
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    loadFinancialReport()
  }, [filters])

  const loadFinancialReport = async () => {
    try {
      setReportLoading(true)
      const data = await reportsService.getFinancialReport(filters)
      setFinancialData(data)
    } catch (error) {
      console.error('Error loading financial report:', error)
    } finally {
      setReportLoading(false)
    }
  }

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) {
      return 'R$ 0,00'
    }
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
  const totals = financialData.reduce(
    (acc, item) => ({
      appointments: acc.appointments + item.total_appointments,
      completed: acc.completed + item.completed_appointments,
      revenue: acc.revenue + item.total_revenue,
      paid: acc.paid + item.paid_revenue,
      pending: acc.pending + item.pending_revenue
    }),
    { appointments: 0, completed: 0, revenue: 0, paid: 0, pending: 0 }
  )

  const overallCompletionRate = totals.appointments > 0 ? (totals.completed / totals.appointments) * 100 : 0
  const overallPaymentRate = totals.appointments > 0 ? ((totals.paid / totals.revenue) * 100) : 0

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
          <h2 className="text-xl font-semibold text-gray-900">Relatório Financeiro</h2>
          <p className="text-gray-600">
            Análise financeira por {filters.groupBy === 'day' ? 'dia' : filters.groupBy === 'week' ? 'semana' : 'mês'}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Receita Total</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(totals.revenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center">
            <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Receita Recebida</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(totals.paid)}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <ArrowTrendingDownIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-600">Receita Pendente</p>
              <p className="text-2xl font-bold text-yellow-900">{formatCurrency(totals.pending)}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              %
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600">Taxa de Recebimento</p>
              <p className="text-2xl font-bold text-purple-900">{formatPercentage(overallPaymentRate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Data Table */}
      <div className="bg-white overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Período
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Consultas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Concluídas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receita Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receita Paga
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receita Pendente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Taxa Conclusão
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Taxa Pagamento
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {financialData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.period}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.total_appointments}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.completed_appointments}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(item.total_revenue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                  {formatCurrency(item.paid_revenue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                  {formatCurrency(item.pending_revenue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${
                      item.completion_rate >= 80 ? 'text-green-600' : 
                      item.completion_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(item.completion_rate)}
                    </span>
                    {item.completion_rate >= 80 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 ml-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 text-red-600 ml-1" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${
                      item.payment_rate >= 80 ? 'text-green-600' : 
                      item.payment_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(item.payment_rate)}
                    </span>
                    {item.payment_rate >= 80 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 ml-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 text-red-600 ml-1" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {financialData.length === 0 && (
          <div className="text-center py-12">
            <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum dado financeiro encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tente ajustar os filtros para encontrar dados financeiros.
            </p>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {financialData.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Resumo Geral</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {totals.appointments}
              </div>
              <div className="text-sm text-gray-600">Total de Consultas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totals.paid)}
              </div>
              <div className="text-sm text-gray-600">Receita Recebida</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(totals.pending)}
              </div>
              <div className="text-sm text-gray-600">Receita Pendente</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatPercentage(overallCompletionRate)}
              </div>
              <div className="text-sm text-gray-600">Taxa de Conclusão</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FinancialReportComponent