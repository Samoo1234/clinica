import { api } from '../utils/api';

export interface NotificationPreferences {
  appointmentRemindersEnabled: boolean;
  appointmentRemindersChannel: 'email' | 'sms' | 'both';
  reminderHoursBefore: number;
  paymentRemindersEnabled: boolean;
  customNotificationsEnabled: boolean;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  channel: string;
  subject: string;
  body: string;
  variables: string[];
  active: boolean;
}

export interface Notification {
  id: string;
  type: string;
  channel: string;
  recipient_email?: string;
  recipient_phone?: string;
  subject: string;
  body: string;
  status: string;
  scheduled_at: string;
  sent_at?: string;
  error_message?: string;
  retry_count: number;
  appointment_id?: string;
  patient_id?: string;
  created_at: string;
  patient?: {
    name: string;
  };
  appointment?: {
    scheduled_at: string;
  };
}

export interface NotificationHistory {
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class NotificationService {
  /**
   * Get patient notification preferences
   */
  async getPatientNotificationPreferences(patientId: string): Promise<NotificationPreferences> {
    const response = await api.get(`/notifications/preferences/patient/${patientId}`);
    return (response as any).data.data;
  }

  /**
   * Update patient notification preferences
   */
  async updatePatientNotificationPreferences(
    patientId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    await api.put(`/notifications/preferences/patient/${patientId}`, preferences);
  }

  /**
   * Schedule a notification
   */
  async scheduleNotification(data: {
    type: string;
    channel: string;
    recipientEmail?: string;
    recipientPhone?: string;
    templateName: string;
    variables: Record<string, string>;
    scheduledAt?: string;
    appointmentId?: string;
    patientId?: string;
  }): Promise<{ id: string }> {
    const response = await api.post('/notifications/schedule', data);
    return (response as any).data.data;
  }

  /**
   * Send appointment confirmation
   */
  async sendAppointmentConfirmation(appointmentId: string): Promise<void> {
    await api.post(`/notifications/appointment/${appointmentId}/confirmation`);
  }

  /**
   * Schedule appointment reminder
   */
  async scheduleAppointmentReminder(appointmentId: string): Promise<void> {
    await api.post(`/notifications/appointment/${appointmentId}/reminder`);
  }

  /**
   * Cancel appointment notifications
   */
  async cancelAppointmentNotifications(appointmentId: string): Promise<void> {
    await api.delete(`/notifications/appointment/${appointmentId}`);
  }

  /**
   * Get notification templates
   */
  async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    const response = await api.get('/notifications/templates');
    return (response as any).data.data;
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(params?: {
    page?: number;
    limit?: number;
    patientId?: string;
    type?: string;
    status?: string;
  }): Promise<NotificationHistory> {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    const response = await api.get(`/notifications/history${queryString}`);
    return (response as any).data;
  }

  /**
   * Process pending notifications (admin only)
   */
  async processPendingNotifications(): Promise<void> {
    await api.post('/notifications/process-pending');
  }
}

export default new NotificationService();