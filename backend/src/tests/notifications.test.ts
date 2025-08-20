import request from 'supertest';
import { createClient } from '@supabase/supabase-js';
import notificationService from '../services/notifications';

// Mock Supabase
jest.mock('@supabase/supabase-js');
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        order: jest.fn(() => ({
          limit: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
      upsert: jest.fn(),
      lte: jest.fn(() => ({
        lt: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(),
          })),
        })),
      })),
    })),
  })),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-message-id' })),
  })),
}));

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scheduleNotification', () => {
    it('should schedule a notification successfully', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'appointment_reminder_email_24h',
        type: 'appointment_reminder',
        channel: 'email',
        subject: 'Lembrete: Consulta agendada para {{appointment_date}}',
        body: 'Olá {{patient_name}}, você tem uma consulta agendada.',
        variables: ['patient_name', 'appointment_date'],
      };

      const mockNotification = {
        id: 'notification-1',
        type: 'appointment_reminder',
        channel: 'email',
        recipient_email: 'patient@example.com',
        subject: 'Lembrete: Consulta agendada para 25/12/2024',
        body: 'Olá João Silva, você tem uma consulta agendada.',
        status: 'pending',
        scheduled_at: new Date().toISOString(),
      };

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockTemplate,
        error: null,
      });

      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: mockNotification,
        error: null,
      });

      const notificationData = {
        type: 'appointment_reminder' as const,
        channel: 'email' as const,
        recipientEmail: 'patient@example.com',
        templateName: 'appointment_reminder_email_24h',
        variables: {
          patient_name: 'João Silva',
          appointment_date: '25/12/2024',
        },
        patientId: 'patient-1',
      };

      const result = await notificationService.scheduleNotification(notificationData);

      expect(result).toBe('notification-1');
      expect(mockSupabase.from).toHaveBeenCalledWith('notification_templates');
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
    });

    it('should throw error if template not found', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const notificationData = {
        type: 'appointment_reminder' as const,
        channel: 'email' as const,
        recipientEmail: 'patient@example.com',
        templateName: 'non_existent_template',
        variables: {},
      };

      await expect(notificationService.scheduleNotification(notificationData))
        .rejects.toThrow('Template not found: non_existent_template');
    });
  });

  describe('scheduleAppointmentReminder', () => {
    it('should schedule appointment reminder successfully', async () => {
      const mockAppointment = {
        id: 'appointment-1',
        patient_id: 'patient-1',
        doctor_id: 'doctor-1',
        scheduled_at: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // 25 hours from now
        patient: {
          id: 'patient-1',
          name: 'João Silva',
          email: 'patient@example.com',
          phone: '11999999999',
        },
        doctor: {
          id: 'doctor-1',
          name: 'Dr. Maria Santos',
        },
      };

      const mockPreferences = {
        appointment_reminders_enabled: true,
        appointment_reminders_channel: 'email',
        reminder_hours_before: 24,
        payment_reminders_enabled: true,
        custom_notifications_enabled: true,
      };

      const mockTemplate = {
        id: 'template-1',
        name: 'appointment_reminder_email_24h',
        type: 'appointment_reminder',
        channel: 'email',
        subject: 'Lembrete: Consulta agendada',
        body: 'Olá {{patient_name}}, você tem uma consulta agendada.',
        variables: ['patient_name', 'appointment_date', 'appointment_time', 'doctor_name'],
      };

      // Mock appointment fetch
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockAppointment,
        error: null,
      });

      // Mock preferences fetch
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockPreferences,
        error: null,
      });

      // Mock template fetch
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockTemplate,
        error: null,
      });

      // Mock notification insert
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: { id: 'notification-1' },
        error: null,
      });

      await notificationService.scheduleAppointmentReminder('appointment-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('appointments');
      expect(mockSupabase.from).toHaveBeenCalledWith('user_notification_preferences');
      expect(mockSupabase.from).toHaveBeenCalledWith('notification_templates');
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
    });

    it('should not schedule reminder if patient has disabled reminders', async () => {
      const mockAppointment = {
        id: 'appointment-1',
        patient_id: 'patient-1',
        scheduled_at: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        patient: { name: 'João Silva', email: 'patient@example.com' },
        doctor: { name: 'Dr. Maria Santos' },
      };

      const mockPreferences = {
        appointment_reminders_enabled: false,
        appointment_reminders_channel: 'email',
        reminder_hours_before: 24,
      };

      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({ data: mockAppointment, error: null })
        .mockResolvedValueOnce({ data: mockPreferences, error: null });

      await notificationService.scheduleAppointmentReminder('appointment-1');

      // Should not call template or notification insert
      expect(mockSupabase.from).toHaveBeenCalledTimes(2); // Only appointment and preferences
    });
  });

  describe('processPendingNotifications', () => {
    it('should process pending notifications', async () => {
      const mockNotifications = [
        {
          id: 'notification-1',
          channel: 'email',
          recipient_email: 'patient@example.com',
          subject: 'Test Subject',
          body: 'Test Body',
          retry_count: 0,
          max_retries: 3,
        },
      ];

      mockSupabase.from().select().eq().lte().lt().order().limit.mockResolvedValueOnce({
        data: mockNotifications,
        error: null,
      });

      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await notificationService.processPendingNotifications();

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
    });
  });

  describe('updatePatientNotificationPreferences', () => {
    it('should update patient notification preferences', async () => {
      const preferences = {
        appointmentRemindersEnabled: false,
        reminderHoursBefore: 48,
      };

      mockSupabase.from().upsert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await notificationService.updatePatientNotificationPreferences('patient-1', preferences);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_notification_preferences');
      expect(mockSupabase.from().upsert).toHaveBeenCalledWith({
        patient_id: 'patient-1',
        appointment_reminders_enabled: false,
        reminder_hours_before: 48,
      });
    });
  });

  describe('cancelAppointmentNotifications', () => {
    it('should cancel appointment notifications', async () => {
      mockSupabase.from().update().eq().eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await notificationService.cancelAppointmentNotifications('appointment-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
      expect(mockSupabase.from().update).toHaveBeenCalledWith({ status: 'cancelled' });
    });
  });
});

describe('Notification Routes', () => {
  // Note: These would require setting up the full Express app for integration testing
  // For now, we'll focus on unit tests for the service layer
  
  it('should be tested with integration tests', () => {
    // TODO: Add integration tests for notification routes
    expect(true).toBe(true);
  });
});