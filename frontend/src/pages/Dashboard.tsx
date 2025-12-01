import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/SimpleAuthContext'
import { PatientCentralService } from '../services/patient-central'
import { 
  Users, 
  Calendar, 
  FileText, 
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: {
    value: number
    isPositive: boolean
  }
  color: 'blue' | 'green' | 'yellow' | 'purple'
}

function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:shadow-md hover:border-gray-300 transform hover:scale-105 h-full">
      <div className="flex items-start justify-between h-full">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp className={`w-4 h-4 mr-1 ${trend.isPositive ? 'text-green-500 rotate-0' : 'text-red-500 rotate-180'}`} />
              <span className={`text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs. mês anterior</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0 ml-4 ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [totalPacientes, setTotalPacientes] = useState<number>(0)
  const [loadingStats, setLoadingStats] = useState(true)

  // Carregar estatísticas do Banco Central
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoadingStats(true)
        const result = await PatientCentralService.getAllPatients({ limit: 1 })
        setTotalPacientes(result.pagination.total)
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      } finally {
        setLoadingStats(false)
      }
    }
    loadStats()
  }, [])

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'patients/new':
        navigate('/patients?action=new')
        break
      case 'appointments/new':
        navigate('/appointments?action=new')
        break
      case 'medical-records/new':
        navigate('/medical-records?action=new')
        break
      default:
        console.log(`Navigate to ${action}`)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '1':
            event.preventDefault()
            handleQuickAction('patients/new')
            break
          case '2':
            event.preventDefault()
            handleQuickAction('appointments/new')
            break
          case '3':
            event.preventDefault()
            handleQuickAction('medical-records/new')
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const quickActions = [
    {
      id: 'patients/new',
      title: 'Novo Paciente',
      description: 'Cadastrar novo paciente',
      icon: Users,
      color: 'bg-blue-600 hover:bg-blue-700',
      shortcut: 'Ctrl+1'
    },
    {
      id: 'appointments/new',
      title: 'Agendar Consulta',
      description: 'Criar novo agendamento',
      icon: Calendar,
      color: 'bg-green-600 hover:bg-green-700',
      shortcut: 'Ctrl+2'
    },
    {
      id: 'medical-records/new',
      title: 'Novo Prontuário',
      description: 'Criar registro médico',
      icon: FileText,
      color: 'bg-purple-600 hover:bg-purple-700',
      shortcut: 'Ctrl+3'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Bem-vindo, {user?.name}!
        </h1>
        <p className="opacity-90">
          Aqui está um resumo das atividades da sua clínica hoje.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        <div onClick={() => navigate('/patients')} className="cursor-pointer">
          <StatCard
            title="Pacientes (Banco Central)"
            value={loadingStats ? '...' : totalPacientes.toLocaleString('pt-BR')}
            icon={Users}
            color="blue"
          />
        </div>
        <div onClick={() => navigate('/appointments')} className="cursor-pointer">
          <StatCard
            title="Consultas Hoje"
            value="28"
            icon={Calendar}
            trend={{ value: 8, isPositive: true }}
            color="green"
          />
        </div>
        <div onClick={() => navigate('/medical-records')} className="cursor-pointer">
          <StatCard
            title="Prontuários"
            value="156"
            icon={FileText}
            trend={{ value: 5, isPositive: true }}
            color="purple"
          />
        </div>
        <div onClick={() => navigate('/financial')} className="cursor-pointer">
          <StatCard
            title="Receita do Mês"
            value="R$ 45.280"
            icon={DollarSign}
            trend={{ value: 15, isPositive: true }}
            color="yellow"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
            <div className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.id)}
                    className={`w-full text-left p-4 rounded-lg text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105 ${action.color}`}
                    title={`${action.description} (${action.shortcut})`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className="w-6 h-6" />
                        <div>
                          <h3 className="font-medium">{action.title}</h3>
                          <p className="text-sm opacity-90">{action.description}</p>
                        </div>
                      </div>
                      <div className="text-xs opacity-75 bg-black bg-opacity-20 px-2 py-1 rounded">
                        {action.shortcut}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Consultas de Hoje</h2>
              <button 
                onClick={() => navigate('/appointments')}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Ver todas
              </button>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/appointments?patient=maria-silva')}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Maria Silva</p>
                    <p className="text-sm text-gray-500">Consulta de rotina</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">09:00</p>
                  <div className="flex items-center text-xs text-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Confirmado
                  </div>
                </div>
              </button>

              <button 
                onClick={() => navigate('/appointments?patient=joao-santos')}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">João Santos</p>
                    <p className="text-sm text-gray-500">Exame de vista</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">10:30</p>
                  <div className="flex items-center text-xs text-yellow-600">
                    <Clock className="w-3 h-3 mr-1" />
                    Aguardando
                  </div>
                </div>
              </button>

              <button 
                onClick={() => navigate('/appointments?patient=ana-costa')}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Ana Costa</p>
                    <p className="text-sm text-gray-500">Retorno pós-cirurgia</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">14:00</p>
                  <div className="flex items-center text-xs text-red-600">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Atrasado
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">
                <span className="font-medium">Dr. Silva</span> cadastrou um novo paciente
              </p>
              <p className="text-xs text-gray-500">Há 2 minutos</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Calendar className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">
                <span className="font-medium">Recepção</span> agendou consulta para amanhã
              </p>
              <p className="text-xs text-gray-500">Há 15 minutos</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <FileText className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">
                <span className="font-medium">Dr. Costa</span> atualizou prontuário médico
              </p>
              <p className="text-xs text-gray-500">Há 1 hora</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}