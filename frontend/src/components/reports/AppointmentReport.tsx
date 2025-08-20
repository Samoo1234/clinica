import React, { useState, useEffect } from 'react'
import { CalendarIcon, UserIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import { reportsService, AppointmentReportData, ReportFilters } from '../../services/reports'

interface AppointmentReportProps {
  filters: ReportFilters
  onExport: () => void
  loading: boolean
}

const AppointmentReportComponent: React.FC<AppointmentReportProps> = ({
  filters,
  onExport,
  loading
}) => {
  const [appointments, setAppointments] = useState<AppointmentReportData[]>([])
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    loadAppointmentReport()
  }, [filters])

  const loadAppointmentReport = async () => {
    try {
      setReportLoading(true)
      const data = await reportsService.getAppointmentReport(filters)
      setAppointments(data)
    } catch (error) {
      console.error('Error loading appointment report:', error)
    } finally {
      setReportLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts = {
      scheduled: 'Agendado',
      confirmed: 'Confirmado',
      in_progress: 'Em andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado',
      no_show: 'Não compareceu'
    }
    return texts[status as keyof typeof texts] || status
  }

  const getPaymentStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPaymentStatusText = (status: string) => {
    const texts = {
      pending: 'Pendente',
      paid: 'Pago',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado'
    }
    return texts[status as keyof typeof texts] || status
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  // Calculate summary statistics
  const totalAppointments = appointments.length
  const completedAppointments = appointments.filter(a => a.status === 'completed').length
  const totalRevenue = appointments.reduce((sum, a) => sum + (a.value || 0), 0)
  const paidRevenue = appointments.filter(a => a.payment_status === 'paid').reduce((sum, a) => sum + (a.value || 0), 0)
  const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0

  if (reportLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
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
          <h2 className="text-xl font-semibold text-gray-900">Relatório de Consultas</h2>
          <p className="text-gray-600">
            {totalAppointments} consulta{totalAppointments !== 1 ? 's' : ''} encontrada{totalAppointments !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Total de Consultas</p>
              <p className="text-2xl font-bold text-blue-900">{totalAppointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Concluídas</p>
              <p className="text-2xl font-bold text-green-900">{completedAppointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-600">Receita Total</p>
              <p className="text-2xl font-bold text-yellow-900">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              %
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600">Taxa de Conclusão</p>
              <p className="text-2xl font-bold text-purple-900">{(completionRate || 0).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paciente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Médico
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data/Hora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pagamento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Diagnóstico
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointments.map((appointment) => (
              <tr key={appointment.appointment_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.patient_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.patient_cpf}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {appointment.doctor_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDateTime(appointment.scheduled_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                    {getStatusText(appointment.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {appointment.value ? formatCurrency(appointment.value) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(appointment.payment_status)}`}>
                    {getPaymentStatusText(appointment.payment_status)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                  {appointment.diagnosis || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {appointments.length === 0 && (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma consulta encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tente ajustar os filtros para encontrar consultas.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AppointmentReportComponent