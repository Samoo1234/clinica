import React, { useState, useEffect } from 'react';
import notificationService, { NotificationPreferences as NotificationPreferencesType } from '../../services/notifications';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/SimpleAuthContext';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Clock, 
  DollarSign,
  Calendar,
  Settings
} from 'lucide-react';

interface NotificationPreferencesProps {
  patientId?: string;
  onClose?: () => void;
}

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  patientId,
  onClose
}) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferencesType>({
    appointmentRemindersEnabled: true,
    appointmentRemindersChannel: 'email',
    reminderHoursBefore: 24,
    paymentRemindersEnabled: true,
    customNotificationsEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, [patientId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      
      if (patientId) {
        // Carregar preferências específicas do paciente
        const data = await notificationService.getPatientNotificationPreferences(patientId);
        setPreferences({
          appointmentRemindersEnabled: data.appointmentRemindersEnabled,
          appointmentRemindersChannel: data.appointmentRemindersChannel,
          reminderHoursBefore: data.reminderHoursBefore,
          paymentRemindersEnabled: data.paymentRemindersEnabled,
          customNotificationsEnabled: data.customNotificationsEnabled,
        });
      } else {
        // Carregar preferências gerais do usuário logado
        // Por enquanto, usar valores padrão
        setPreferences({
          appointmentRemindersEnabled: true,
          appointmentRemindersChannel: 'email',
          reminderHoursBefore: 24,
          paymentRemindersEnabled: true,
          customNotificationsEnabled: true,
        });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      showToast('error', 'Erro ao carregar preferências de notificação');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (patientId) {
        await notificationService.updatePatientNotificationPreferences(patientId, preferences);
      } else {
        // Salvar preferências gerais do usuário
        // Por enquanto, apenas simular o salvamento
        console.log('Saving user preferences:', preferences);
      }
      
      showToast('success', 'Preferências de notificação atualizadas com sucesso');
      if (onClose) onClose();
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      showToast('error', 'Erro ao salvar preferências de notificação');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof NotificationPreferencesType, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Preferences Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>Minhas Preferências de Notificação</span>
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {!patientId && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ Configurando preferências para: <strong>{user?.name}</strong> ({user?.email})
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Appointment Reminders */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <span>Lembretes de Consulta</span>
            </h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="appointment-reminders"
                type="checkbox"
                checked={preferences.appointmentRemindersEnabled}
                onChange={(e) => handleInputChange('appointmentRemindersEnabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="appointment-reminders" className="ml-2 text-sm text-gray-700">
                Receber lembretes de consulta
              </label>
            </div>

            {preferences.appointmentRemindersEnabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Canal de notificação
                  </label>
                  <select
                    value={preferences.appointmentRemindersChannel}
                    onChange={(e) => handleInputChange('appointmentRemindersChannel', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="both">Email e SMS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enviar lembrete com antecedência de
                  </label>
                  <select
                    value={preferences.reminderHoursBefore}
                    onChange={(e) => handleInputChange('reminderHoursBefore', parseInt(e.target.value))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>1 hora</option>
                    <option value={2}>2 horas</option>
                    <option value={4}>4 horas</option>
                    <option value={12}>12 horas</option>
                    <option value={24}>24 horas (1 dia)</option>
                    <option value={48}>48 horas (2 dias)</option>
                    <option value={72}>72 horas (3 dias)</option>
                    <option value={168}>1 semana</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

          {/* Payment Reminders */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-yellow-600" />
              <span>Lembretes de Pagamento</span>
            </h3>
          
          <div className="flex items-center">
            <input
              id="payment-reminders"
              type="checkbox"
              checked={preferences.paymentRemindersEnabled}
              onChange={(e) => handleInputChange('paymentRemindersEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="payment-reminders" className="ml-2 text-sm text-gray-700">
              Receber lembretes de pagamento pendente
            </label>
          </div>
        </div>

          {/* Custom Notifications */}
          <div className="pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <Bell className="w-5 h-5 text-purple-600" />
              <span>Notificações Personalizadas</span>
            </h3>
          
          <div className="flex items-center">
            <input
              id="custom-notifications"
              type="checkbox"
              checked={preferences.customNotificationsEnabled}
              onChange={(e) => handleInputChange('customNotificationsEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="custom-notifications" className="ml-2 text-sm text-gray-700">
              Receber notificações personalizadas da clínica
            </label>
          </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando...' : 'Salvar Preferências'}
          </button>
        </div>
      </div>

      {/* Notification Types Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <span>Tipos de Notificação</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Email</h4>
                <p className="text-sm text-gray-600">
                  Notificações enviadas para seu email cadastrado. Ideais para lembretes importantes e confirmações.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <MessageSquare className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">SMS</h4>
                <p className="text-sm text-gray-600">
                  Mensagens de texto para seu celular. Perfeitas para lembretes urgentes e confirmações rápidas.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Lembretes Automáticos</h4>
                <p className="text-sm text-gray-600">
                  Sistema automatizado que envia lembretes baseados em suas preferências de tempo.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Settings className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Personalizável</h4>
                <p className="text-sm text-gray-600">
                  Configure quando e como receber cada tipo de notificação de acordo com sua preferência.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;