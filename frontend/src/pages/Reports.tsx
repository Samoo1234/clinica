import React, { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  CalendarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'
import { useToast } from '../contexts/ToastContext'
import { reportsService, ReportFilters, DashboardKPIs } from '../services/reports'
import ReportFiltersComponent from '../components/reports/ReportFilters'
import DashboardKPIsComponent from '../components/reports/DashboardKPIs'
import AppointmentReportComponent from '../components/reports/AppointmentReport'
import FinancialReportComponent from '../components/reports/FinancialReport'
import DoctorPerformanceComponent from '../components/reports/DoctorPerformance'
import ConsultationTypesComponent from '../components/reports/ConsultationTypes'

type ReportTab = 'dashboard' | 'appointments' | 'financial' | 'doctors' | 'consultations'

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('dashboard')
  const [filters, setFilters] = useState<ReportFilters>({})
  const [dashboardKPIs, setDashboardKPIs] = useState<DashboardKPIs | null>(null)
  const [loading, setLoading] = useState(false)
  const { showError, showSuccess } = useToast()

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: ChartBarIcon },
    { id: 'appointments', name: 'Consultas', icon: CalendarIcon },
    { id: 'financial', name: 'Financeiro', icon: CurrencyDollarIcon },
    { id: 'doctors', name: 'Médicos', icon: UserGroupIcon },
    { id: 'consultations', name: 'Tipos de Consulta', icon: ClipboardDocumentListIcon }
  ]

  useEffect(() => {
    loadDashboardKPIs()
  }, [])

  const loadDashboardKPIs = async () => {
    try {
      setLoading(true)
      const kpis = await reportsService.getDashboardKPIs()
      setDashboardKPIs(kpis)
    } catch (error) {
      console.error('Error loading dashboard KPIs:', error)
      showError('Erro ao carregar indicadores do dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltersChange = (newFilters: ReportFilters) => {
    setFilters(newFilters)
  }

  const handleExportReport = async (reportType: string) => {
    try {
      setLoading(true)
      
      switch (reportType) {
        case 'appointments':
          await reportsService.exportAppointmentReport(filters)
          showSuccess('Relatório de consultas exportado com sucesso')
          break
        case 'financial':
          await reportsService.exportFinancialReport(filters)
          showSuccess('Relatório financeiro exportado com sucesso')
          break
        case 'doctors':
          await reportsService.exportDoctorPerformanceReport(filters)
          showSuccess('Relatório de desempenho dos médicos exportado com sucesso')
          break
        default:
          showError('Tipo de relatório não suportado para exportação')
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      showError('Erro ao exportar relatório')
    } finally {
      setLoading(false)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardKPIsComponent 
            kpis={dashboardKPIs} 
            loading={loading}
            onRefresh={loadDashboardKPIs}
          />
        )
      case 'appointments':
        return (
          <AppointmentReportComponent 
            filters={filters}
            onExport={() => handleExportReport('appointments')}
            loading={loading}
          />
        )
      case 'financial':
        return (
          <FinancialReportComponent 
            filters={filters}
            onExport={() => handleExportReport('financial')}
            loading={loading}
          />
        )
      case 'doctors':
        return (
          <DoctorPerformanceComponent 
            filters={filters}
            onExport={() => handleExportReport('doctors')}
            loading={loading}
          />
        )
      case 'consultations':
        return (
          <ConsultationTypesComponent 
            filters={filters}
            loading={loading}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios e Estatísticas</h1>
          <p className="text-gray-600">Acompanhe o desempenho da clínica e gere relatórios detalhados</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ReportTab)}
                className={`
                  flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Filters - Show for all tabs except dashboard */}
      {activeTab !== 'dashboard' && (
        <ReportFiltersComponent
          filters={filters}
          onChange={handleFiltersChange}
          showExportButton={activeTab !== 'consultations'}
          onExport={() => handleExportReport(activeTab)}
          loading={loading}
        />
      )}

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default Reports