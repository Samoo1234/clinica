import React, { useState, useEffect } from 'react';
import notificationService, { NotificationHistory as NotificationHistoryType } from '../../services/notifications';
import { useToast } from '../../contexts/ToastContext';
import { 
  History, 
  Filter, 
  RefreshCw, 
  Mail, 
  MessageSquare, 
  Calendar,
  DollarSign,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface NotificationHistoryProps {
  patientId?: string;
}

const NotificationHistory: React.FC<NotificationHistoryProps> = ({ patientId }) => {
  const [history, setHistory] = useState<NotificationHistoryType>({
    data: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    page: 1,
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadHistory();
  }, [filters, patientId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: filters.page,
        limit: 20,
      };

      if (patientId) {
        params.patientId = patientId;
      }
      if (filters.type) {
        params.type = filters.type;
      }
      if (filters.status) {
        params.status = filters.status;
      }

      // Simular dados para demonstração
      const mockData: NotificationHistoryType = {
        data: [
          {
            id: '1',
            type: 'appointment_reminder',
            subject: 'Lembrete: Consulta agendada para amanhã',
            body: 'Sua consulta está agendada para amanhã',
            channel: 'email',
            status: 'sent',
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            recipient_email: 'paciente@email.com',
            scheduled_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            sent_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            retry_count: 0,
            patient: { name: 'João Silva' },
            appointment: { scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }
          },
          {
            id: '2',
            type: 'payment_reminder',
            subject: 'Lembrete: Pagamento pendente',
            body: 'Você tem um pagamento pendente',
            channel: 'sms',
            status: 'pending',
            created_at: new Date().toISOString(),
            recipient_phone: '(11) 99999-9999',
            scheduled_at: new Date().toISOString(),
            retry_count: 0,
            patient: { name: 'Maria Santos' }
          },
          {
            id: '3',
            type: 'appointment_confirmation',
            subject: 'Confirmação: Consulta agendada',
            body: 'Sua consulta foi confirmada',
            channel: 'email',
            status: 'failed',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            recipient_email: 'erro@email.com',
            scheduled_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            retry_count: 2,
            error_message: 'Email inválido',
            patient: { name: 'Pedro Costa' },
            appointment: { scheduled_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() }
          }
        ],
        pagination: {
          page: filters.page,
          limit: 20,
          total: 3,
          totalPages: 1
        }
      };

      setHistory(mockData);
    } catch (error) {
      console.error('Error loading notification history:', error);
      showToast('error', 'Erro ao carregar histórico de notificações');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page,
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendente', icon: Clock },
      sent: { color: 'bg-green-100 text-green-800', text: 'Enviado', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', text: 'Falhou', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', text: 'Cancelado', icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      appointment_reminder: { color: 'bg-blue-100 text-blue-800', text: 'Lembrete de Consulta', icon: Calendar },
      appointment_confirmation: { color: 'bg-green-100 text-green-800', text: 'Confirmação de Consulta', icon: CheckCircle },
      appointment_cancellation: { color: 'bg-red-100 text-red-800', text: 'Cancelamento de Consulta', icon: XCircle },
      payment_reminder: { color: 'bg-orange-100 text-orange-800', text: 'Lembrete de Pagamento', icon: DollarSign },
      custom: { color: 'bg-purple-100 text-purple-800', text: 'Personalizada', icon: Bell },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.custom;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="w-4 h-4 text-blue-600" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4 text-green-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>Histórico de Notificações</span>
          </h2>
          <button
            onClick={loadHistory}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2 mb-3">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Todos os tipos</option>
              <option value="appointment_reminder">Lembrete de Consulta</option>
              <option value="appointment_confirmation">Confirmação de Consulta</option>
              <option value="appointment_cancellation">Cancelamento de Consulta</option>
              <option value="payment_reminder">Lembrete de Pagamento</option>
              <option value="custom">Personalizada</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="sent">Enviado</option>
              <option value="failed">Falhou</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ type: '', status: '', page: 1 })}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-200">
        {history.data.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            Nenhuma notificação encontrada
          </div>
        ) : (
          history.data.map((notification) => (
            <div key={notification.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getTypeBadge(notification.type)}
                    {getStatusBadge(notification.status)}
                    <div className="flex items-center space-x-1">
                      {getChannelIcon(notification.channel)}
                      <span className="text-xs text-gray-500 capitalize">
                        {notification.channel}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    {notification.subject}
                  </h3>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    {notification.patient && (
                      <p>Paciente: {notification.patient.name}</p>
                    )}
                    {notification.recipient_email && (
                      <p>Email: {notification.recipient_email}</p>
                    )}
                    {notification.recipient_phone && (
                      <p>Telefone: {notification.recipient_phone}</p>
                    )}
                    {notification.appointment && (
                      <p>
                        Consulta: {formatDate(notification.appointment.scheduled_at)}
                      </p>
                    )}
                  </div>

                  {notification.error_message && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      Erro: {notification.error_message}
                    </div>
                  )}
                </div>

                <div className="text-right text-sm text-gray-500 ml-4">
                  <p>Agendado: {formatDate(notification.scheduled_at)}</p>
                  {notification.sent_at && (
                    <p>Enviado: {formatDate(notification.sent_at)}</p>
                  )}
                  {notification.retry_count > 0 && (
                    <p>Tentativas: {notification.retry_count}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {history.pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {((history.pagination.page - 1) * history.pagination.limit) + 1} a{' '}
            {Math.min(history.pagination.page * history.pagination.limit, history.pagination.total)} de{' '}
            {history.pagination.total} notificações
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(history.pagination.page - 1)}
              disabled={history.pagination.page === 1}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            
            <span className="px-3 py-1 text-sm font-medium text-gray-700">
              Página {history.pagination.page} de {history.pagination.totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(history.pagination.page + 1)}
              disabled={history.pagination.page === history.pagination.totalPages}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationHistory;