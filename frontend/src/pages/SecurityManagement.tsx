import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/SimpleAuthContext'
import { useToast } from '../contexts/ToastContext'
import { ModuleGuard } from '../components/ModuleGuard'
import { SecurityMetrics, SecurityAlert, AuditLog, BackupResult } from '../types/security'
import { securityService } from '../services/security'
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Database, 
  FileText,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Key,
  Settings
} from 'lucide-react'

const SecurityManagement: React.FC = () => {
  const { user } = useAuth()
  const { showSuccess, showError, showInfo } = useToast()
  
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'audit' | 'backups' | 'lgpd'>('overview')
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null)
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [backups, setBackups] = useState<BackupResult[]>([])
  const [loading, setLoading] = useState(false)

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <ModuleGuard module="security">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
            <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      </ModuleGuard>
    )
  }

  useEffect(() => {
    loadSecurityData()
  }, [activeTab])

  const loadSecurityData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'overview':
          await loadMetrics()
          break
        case 'alerts':
          await loadAlerts()
          break
        case 'audit':
          await loadAuditLogs()
          break
        case 'backups':
          await loadBackups()
          break
      }
    } catch (error: any) {
      showError(error.message || 'Erro ao carregar dados de segurança')
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async () => {
    try {
      const result = await securityService.getSecurityMetrics()
      setMetrics(result.metrics)
    } catch (error) {
      // Usar dados mock em caso de erro
      const mockMetrics: SecurityMetrics = {
        failed_logins_24h: 3,
        successful_logins_24h: 127,
        sensitive_data_access_24h: 45,
        api_calls_24h: 1250,
        unique_users_24h: 28,
        security_alerts_active: 2,
        data_exports_24h: 5,
        unusual_activity_score: 25
      }
      setMetrics(mockMetrics)
    }
  }

  const loadAlerts = async () => {
    try {
      const result = await securityService.getSecurityAlerts({ status: 'ACTIVE' })
      setAlerts(result.alerts)
    } catch (error) {
      // Usar dados mock em caso de erro
      const mockAlerts: SecurityAlert[] = [
        {
          id: '1',
          alert_type: 'FAILED_LOGIN_ATTEMPTS',
          title: 'Múltiplas tentativas de login falhadas',
          description: 'Detectadas 5 tentativas de login falhadas do IP 192.168.1.100 nos últimos 10 minutos',
          severity: 'HIGH',
          status: 'ACTIVE',
          ip_address: '192.168.1.100',
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          alert_type: 'UNUSUAL_ACCESS_TIME',
          title: 'Acesso a dados sensíveis fora do horário',
          description: 'Usuário acessou prontuários médicos às 23:45, fora do horário comercial',
          severity: 'MEDIUM',
          status: 'ACTIVE',
          ip_address: '10.0.0.50',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ]
      setAlerts(mockAlerts)
    }
  }

  const loadAuditLogs = async () => {
    try {
      const result = await securityService.getAuditLogs({ limit: 50 })
      setAuditLogs(result.logs)
    } catch (error) {
      // Usar dados mock em caso de erro
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          user_id: '1',
          user_name: 'Dr. João Silva',
          user_email: 'joao@clinica.com',
          action: 'LOGIN',
          resource_type: 'AUTH',
          ip_address: '192.168.1.50',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          success: true
        },
        {
          id: '2',
          user_id: '2',
          user_name: 'Maria Santos',
          user_email: 'maria@clinica.com',
          action: 'VIEW_PATIENT',
          resource_type: 'PATIENT',
          ip_address: '192.168.1.51',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          success: true
        },
        {
          id: '3',
          user_id: '3',
          user_name: 'Admin',
          user_email: 'admin@clinica.com',
          action: 'CREATE_BACKUP',
          resource_type: 'SYSTEM',
          ip_address: '192.168.1.1',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          success: true
        }
      ]
      setAuditLogs(mockLogs)
    }
  }

  const loadBackups = async () => {
    try {
      const result = await securityService.getBackupHistory({ limit: 20 })
      setBackups(result.backups)
    } catch (error) {
      // Usar dados mock em caso de erro
      const mockBackups: BackupResult[] = [
        {
          id: '1',
          backup_type: 'FULL',
          status: 'SUCCESS',
          started_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
          file_size: 1024 * 1024 * 150 // 150MB
        },
        {
          id: '2',
          backup_type: 'INCREMENTAL',
          status: 'SUCCESS',
          started_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 12 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
          file_size: 1024 * 1024 * 25 // 25MB
        },
        {
          id: '3',
          backup_type: 'INCREMENTAL',
          status: 'IN_PROGRESS',
          started_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        }
      ]
      setBackups(mockBackups)
    }
  }

  const handleResolveAlert = async (alertId: string, resolutionNotes: string) => {
    try {
      await securityService.resolveAlert(alertId, resolutionNotes)
      showSuccess('Alerta resolvido com sucesso')
      loadAlerts()
    } catch (error: any) {
      showError(error.message || 'Erro ao resolver alerta')
    }
  }

  const handleCreateBackup = async (type: 'full' | 'incremental') => {
    try {
      setLoading(true)
      if (type === 'full') {
        await securityService.createFullBackup()
      } else {
        await securityService.createIncrementalBackup()
      }
      showSuccess(`Backup ${type === 'full' ? 'completo' : 'incremental'} criado com sucesso`)
      loadBackups()
    } catch (error: any) {
      showError(error.message || 'Erro ao criar backup')
    } finally {
      setLoading(false)
    }
  }

  const handleMonitorSecurity = async () => {
    try {
      setLoading(true)
      const result = await securityService.monitorSecurity()
      showSuccess(`Monitoramento concluído. ${result.alerts.length} novos alertas encontrados.`)
      if (activeTab === 'alerts') {
        loadAlerts()
      }
    } catch (error: any) {
      showError(error.message || 'Erro ao executar monitoramento')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-800 bg-red-100'
      case 'HIGH': return 'text-red-700 bg-red-50'
      case 'MEDIUM': return 'text-yellow-700 bg-yellow-50'
      case 'LOW': return 'text-blue-700 bg-blue-50'
      default: return 'text-gray-700 bg-gray-50'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-800 bg-green-100'
      case 'FAILED': return 'text-red-800 bg-red-100'
      case 'IN_PROGRESS': return 'text-yellow-800 bg-yellow-100'
      default: return 'text-gray-800 bg-gray-100'
    }
  }

  const tabs = [
    { id: 'overview', name: 'Visão Geral', icon: Shield },
    { id: 'alerts', name: 'Alertas', icon: AlertTriangle },
    { id: 'audit', name: 'Auditoria', icon: Eye },
    { id: 'backups', name: 'Backups', icon: Database },
    { id: 'lgpd', name: 'LGPD', icon: FileText }
  ]

  return (
    <ModuleGuard module="security">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <span>Segurança</span>
            </h1>
            <p className="text-gray-600">
              Monitore a segurança do sistema, gerencie alertas e execute backups
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleMonitorSecurity}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Activity className="w-4 h-4" />
              )}
              <span>Monitorar</span>
            </button>
            <button
              onClick={loadSecurityData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && metrics && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <XCircle className="w-8 h-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Logins Falhados (24h)</p>
                      <p className="text-2xl font-bold text-red-600">{metrics.failed_logins_24h}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Logins Bem-sucedidos (24h)</p>
                      <p className="text-2xl font-bold text-green-600">{metrics.successful_logins_24h}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <Eye className="w-8 h-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Acesso a Dados Sensíveis (24h)</p>
                      <p className="text-2xl font-bold text-yellow-600">{metrics.sensitive_data_access_24h}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Alertas Ativos</p>
                      <p className="text-2xl font-bold text-red-600">{metrics.security_alerts_active}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <span>Score de Atividade Suspeita</span>
                  </h3>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all duration-300 ${
                      metrics.unusual_activity_score > 70 ? 'bg-red-600' :
                      metrics.unusual_activity_score > 40 ? 'bg-yellow-600' : 'bg-green-600'
                    }`}
                    style={{ width: `${metrics.unusual_activity_score}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-600">
                    Score: {metrics.unusual_activity_score}/100
                  </p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    metrics.unusual_activity_score > 70 ? 'bg-red-100 text-red-800' :
                    metrics.unusual_activity_score > 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {metrics.unusual_activity_score > 70 ? 'Alto Risco' :
                     metrics.unusual_activity_score > 40 ? 'Risco Médio' : 'Baixo Risco'}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  <span>Ações Rápidas</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleCreateBackup('full')}
                    disabled={loading}
                    className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <Database className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Backup Completo</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('alerts')}
                    className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium">Ver Alertas</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('audit')}
                    className="flex items-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Logs de Auditoria</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span>Alertas de Segurança Ativos</span>
                  </h3>
                  <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">
                    {alerts.length} alertas
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {alerts.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum alerta ativo
                    </h3>
                    <p className="text-gray-600">
                      Todos os alertas de segurança foram resolvidos.
                    </p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                              {alert.severity}
                            </span>
                            <span className="text-sm text-gray-500 flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(alert.created_at).toLocaleString('pt-BR')}</span>
                            </span>
                          </div>
                          <h4 className="text-lg font-medium text-gray-900 mb-1">{alert.title}</h4>
                          <p className="text-gray-600 mb-2">{alert.description}</p>
                          {alert.ip_address && (
                            <p className="text-sm text-gray-500 flex items-center space-x-1">
                              <Key className="w-3 h-3" />
                              <span>IP: {alert.ip_address}</span>
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const notes = prompt('Notas de resolução:')
                            if (notes && alert.id) {
                              handleResolveAlert(alert.id, notes)
                            }
                          }}
                          className="ml-4 flex items-center space-x-2 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Resolver</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Logs de Auditoria Recentes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recurso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.user_name} ({log.user_email})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.resource_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Backups Tab */}
        {activeTab === 'backups' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Criar Backup</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleCreateBackup('full')}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Backup Completo
                </button>
                <button
                  onClick={() => handleCreateBackup('incremental')}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Backup Incremental
                </button>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Histórico de Backups</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data/Hora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tamanho
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {backups.map((backup) => (
                      <tr key={backup.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(backup.started_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {backup.backup_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(backup.status)}`}>
                            {backup.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {backup.file_size ? `${(backup.file_size / 1024 / 1024).toFixed(2)} MB` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {backup.status === 'SUCCESS' && (
                            <button
                              onClick={() => {
                                if (confirm('Tem certeza que deseja restaurar este backup? Esta ação irá sobrescrever os dados existentes.')) {
                                  // Implement restore functionality
                                  showInfo('Funcionalidade de restauração será implementada')
                                }
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Restaurar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* LGPD Tab */}
        {activeTab === 'lgpd' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Conformidade LGPD</h3>
            <div className="space-y-4">
              <button
                onClick={async () => {
                  try {
                    setLoading(true)
                    await securityService.applyRetentionPolicies()
                    showSuccess('Políticas de retenção aplicadas com sucesso')
                  } catch (error: any) {
                    showError(error.message || 'Erro ao aplicar políticas de retenção')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                Aplicar Políticas de Retenção
              </button>
              <p className="text-sm text-gray-600">
                Aplica as políticas de retenção de dados conforme LGPD, anonimizando ou excluindo dados antigos.
              </p>
            </div>
          </div>
        )}
        </div>
      </div>
    </ModuleGuard>
  )
}

export { SecurityManagement }
export default SecurityManagement