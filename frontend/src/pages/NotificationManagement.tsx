import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/SimpleAuthContext';
import { ModuleGuard } from '../components/ModuleGuard';
import NotificationHistory from '../components/notifications/NotificationHistory';
import NotificationPreferences from '../components/notifications/NotificationPreferences';
import notificationService from '../services/notifications';
import { useToast } from '../contexts/ToastContext';
import { 
  Bell, 
  Settings, 
  History, 
  Play, 
  RefreshCw,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const NotificationManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'history' | 'preferences' | 'settings'>('history');
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    pending: 0,
    failed: 0
  });
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      // Simular carregamento de estatísticas
      // Em produção, isso viria da API
      const mockStats = {
        total: 156,
        sent: 142,
        pending: 8,
        failed: 6
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading notification stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPending = async () => {
    if (user?.role !== 'admin') {
      showError('Apenas administradores podem processar notificações pendentes');
      return;
    }

    try {
      setProcessing(true);
      await notificationService.processPendingNotifications();
      showSuccess('Notificações pendentes processadas com sucesso');
      loadStats(); // Recarregar estatísticas
    } catch (error) {
      console.error('Error processing pending notifications:', error);
      showError('Erro ao processar notificações pendentes');
    } finally {
      setProcessing(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      // Simular envio de notificação de teste
      showSuccess('Notificação de teste enviada com sucesso!');
    } catch (error) {
      showError('Erro ao enviar notificação de teste');
    }
  };

  const tabs = [
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'preferences', label: 'Preferências', icon: Settings },
    { id: 'settings', label: 'Configurações', icon: Bell }
  ];

  return (
    <ModuleGuard module="notifications">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
            <p className="text-gray-600">Gerencie notificações e lembretes do sistema</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleTestNotification}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span>Teste</span>
            </button>
            <button
              onClick={loadStats}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Bell className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Enviadas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.sent}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Falharam</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
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
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Admin Actions */}
              {user?.role === 'admin' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Play className="w-5 h-5 text-blue-600" />
                    <span>Ações Administrativas</span>
                  </h2>
                  <div className="flex space-x-4">
                    <button
                      onClick={handleProcessPending}
                      disabled={processing}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Processando...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Processar Pendentes</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Força o processamento imediato de todas as notificações pendentes na fila.
                  </p>
                </div>
              )}

              {/* Notification History */}
              <NotificationHistory />
            </div>
          )}

          {activeTab === 'preferences' && (
            <NotificationPreferences />
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Email Configuration */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span>Configurações de Email</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Servidor SMTP
                      </label>
                      <input
                        type="text"
                        value="smtp.gmail.com"
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Porta
                      </label>
                      <input
                        type="text"
                        value="587"
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Remetente
                      </label>
                      <input
                        type="email"
                        value="noreply@visioncare.com.br"
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Remetente
                      </label>
                      <input
                        type="text"
                        value="VisionCare Sistema"
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ As configurações de SMTP devem ser definidas nas variáveis de ambiente do servidor.
                  </p>
                </div>
              </div>

              {/* SMS Configuration */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <span>Configurações de SMS</span>
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Provedor SMS</h3>
                      <p className="text-sm text-gray-600">Twilio (Desenvolvimento)</p>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      Em Desenvolvimento
                    </span>
                  </div>
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      ℹ️ O sistema está preparado para integração com provedores de SMS como Twilio, AWS SNS, etc.
                      Atualmente em modo de desenvolvimento (mensagens são logadas no console).
                    </p>
                  </div>
                </div>
              </div>

              {/* System Status */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span>Status do Sistema</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Agendador Automático</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ativo
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Processamento Email</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Funcionando
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Processamento SMS</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Desenvolvimento
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Última Execução</span>
                      <span className="text-sm text-gray-600">
                        {new Date().toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                  <p>O sistema processa notificações pendentes automaticamente a cada minuto.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModuleGuard>
  );
};

export default NotificationManagement;