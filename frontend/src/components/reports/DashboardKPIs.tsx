import React from 'react'
import { 
  UserGroupIcon, 
  CalendarIcon, 
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import { DashboardKPIs } from '../../services/reports'

interface DashboardKPIsProps {
  kpis: DashboardKPIs | null
  loading: boolean
  onRefresh: () => void
}

const DashboardKPIsComponent: React.FC<DashboardKPIsProps> = ({
  kpis,
  loading,
  onRefresh
}) => {
  if (loading && !kpis) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!kpis) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Erro ao carregar indicadores</p>
        <button
          onClick={onRefresh}
          className="mt-2 text-blue-600 hover:text-blue-800"
        >
          Tentar novamente
        </button>
      </div>
    )
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

  const safeNumber = (value: number | null) => value || 0

  const kpiCards = [
    {
      title: 'Total de Pacientes',
      value: safeNumber(kpis.total_patients).toLocaleString('pt-BR'),
      icon: UserGroupIcon,
      color: 'blue',
      subtitle: `${safeNumber(kpis.new_patients_this_month)} novos este mês`
    },
    {
      title: 'Consultas Este Mês',
      value: safeNumber(kpis.total_appointments_this_month).toLocaleString('pt-BR'),
      icon: CalendarIcon,
      color: 'green',
      subtitle: `${safeNumber(kpis.completed_appointments_this_month)} concluídas`
    },
    {
      title: 'Receita Este Mês',
      value: formatCurrency(kpis.total_revenue_this_month),
      icon: CurrencyDollarIcon,
      color: 'yellow',
      subtitle: formatCurrency(kpis.pending_revenue) + ' pendente'
    },
    {
      title: 'Prontuários Este Mês',
      value: safeNumber(kpis.medical_records_this_month).toLocaleString('pt-BR'),
      icon: ClipboardDocumentListIcon,
      color: 'purple',
      subtitle: `${safeNumber(kpis.active_doctors)} médicos ativos`
    },
    {
      title: 'Taxa de Conclusão',
      value: formatPercentage(kpis.completion_rate),
      icon: (kpis.completion_rate || 0) >= 80 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon,
      color: (kpis.completion_rate || 0) >= 80 ? 'green' : 'red',
      subtitle: 'Consultas concluídas'
    },
    {
      title: 'Valor Médio Consulta',
      value: formatCurrency(kpis.average_consultation_value),
      icon: CurrencyDollarIcon,
      color: 'indigo',
      subtitle: 'Por consulta'
    },
    {
      title: 'Novos Pacientes',
      value: safeNumber(kpis.new_patients_this_month).toLocaleString('pt-BR'),
      icon: UserGroupIcon,
      color: 'pink',
      subtitle: 'Este mês'
    },
    {
      title: 'Médicos Ativos',
      value: safeNumber(kpis.active_doctors).toLocaleString('pt-BR'),
      icon: UserGroupIcon,
      color: 'gray',
      subtitle: 'Disponíveis'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      pink: 'bg-pink-50 text-pink-600 border-pink-200',
      gray: 'bg-gray-50 text-gray-600 border-gray-200'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Indicadores Principais</h2>
          <p className="text-gray-600">Visão geral do desempenho da clínica</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div
              key={index}
              className={`p-6 rounded-lg border-2 ${getColorClasses(card.color)} transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium opacity-75">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                  {card.subtitle && (
                    <p className="text-xs opacity-60 mt-1">{card.subtitle}</p>
                  )}
                </div>
                <div className="ml-4">
                  <Icon className="h-8 w-8 opacity-75" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Stats Summary */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resumo Rápido</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {formatPercentage(kpis.completion_rate)}
            </div>
            <div className="text-sm text-gray-600">Taxa de Conclusão</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(kpis.total_revenue_this_month)}
            </div>
            <div className="text-sm text-gray-600">Receita do Mês</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {safeNumber(kpis.new_patients_this_month)}
            </div>
            <div className="text-sm text-gray-600">Novos Pacientes</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardKPIsComponent