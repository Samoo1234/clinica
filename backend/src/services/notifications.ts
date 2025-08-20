import { supabaseAdmin } from '../config/supabase';
import nodemailer from 'nodemailer';
import { Database } from '../types/database';

type NotificationType = Database['public']['Enums']['notification_type'];
type NotificationChannel = Database['public']['Enums']['notification_channel'];
type NotificationStatus = Database['public']['Enums']['notification_status'];

interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject: string;
  body: string;
  variables: string[];
}

interface NotificationData {
  type: NotificationType;
  channel: NotificationChannel;
  recipientEmail?: string;
  recipientPhone?: string;
  templateName: string;
  variables: Record<string, string>;
  scheduledAt?: Date | string;
  appointmentId?: string;
  patientId?: string;
  userId?: string;
}

interface NotificationPreferences {
  appointmentRemindersEnabled: boolean;
  appointmentRemindersChannel: NotificationChannel;
  reminderHoursBefore: number;
  paymentRemindersEnabled: boolean;
  customNotificationsEnabled: boolean;
}

class NotificationService {
  private supabase;
  private emailTransporter;

  constructor() {
    this.supabase = supabaseAdmin;

    // Configure email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Schedule a notification to be sent
   */
  async scheduleNotification(data: NotificationData): Promise<string> {
    try {
      // Get template
      const template = await this.getTemplate(data.templateName);
      if (!template) {
        throw new Error(`Template not found: ${data.templateName}`);
      }

      // Replace variables in subject and body
      const subject = this.replaceVariables(template.subject, data.variables);
      const body = this.replaceVariables(template.body, data.variables);

      // Insert notification into queue
      const { data: notification, error } = await this.supabase
        .from('notifications')
        .insert({
          type: data.type,
          channel: data.channel,
          recipient_email: data.recipientEmail,
          recipient_phone: data.recipientPhone,
          subject,
          body,
          scheduled_at: data.scheduledAt ? (typeof data.scheduledAt === 'string' ? data.scheduledAt : data.scheduledAt.toISOString()) : new Date().toISOString(),
          appointment_id: data.appointmentId,
          patient_id: data.patientId,
          user_id: data.userId,
          template_id: template.id,
          metadata: data.variables,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return notification.id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Schedule appointment reminder based on user preferences
   */
  async scheduleAppointmentReminder(appointmentId: string): Promise<void> {
    try {
      // Get appointment details
      const { data: appointment, error: appointmentError } = await this.supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(*),
          doctor:users(*)
        `)
        .eq('id', appointmentId)
        .single();

      if (appointmentError || !appointment) {
        throw new Error('Appointment not found');
      }

      // Get patient notification preferences
      const preferences = await this.getPatientNotificationPreferences(appointment.patient_id);
      
      if (!preferences.appointmentRemindersEnabled) {
        return; // Patient has disabled reminders
      }

      // Calculate reminder time
      const appointmentTime = new Date(appointment.scheduled_at);
      const reminderTime = new Date(appointmentTime.getTime() - (preferences.reminderHoursBefore * 60 * 60 * 1000));

      // Don't schedule if reminder time is in the past
      if (reminderTime <= new Date()) {
        return;
      }

      // Prepare variables for template
      const variables = {
        patient_name: appointment.patient.name,
        appointment_date: appointmentTime.toLocaleDateString('pt-BR'),
        appointment_time: appointmentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        doctor_name: appointment.doctor.name,
      };

      // Determine recipient based on channel preference
      let recipientEmail: string | undefined;
      let recipientPhone: string | undefined;

      if (preferences.appointmentRemindersChannel === 'email' || preferences.appointmentRemindersChannel === 'both') {
        recipientEmail = appointment.patient.email;
      }
      if (preferences.appointmentRemindersChannel === 'sms' || preferences.appointmentRemindersChannel === 'both') {
        recipientPhone = appointment.patient.phone;
      }

      // Schedule email reminder
      if (recipientEmail) {
        await this.scheduleNotification({
          type: 'appointment_reminder',
          channel: 'email',
          recipientEmail,
          templateName: 'appointment_reminder_email_24h',
          variables,
          scheduledAt: reminderTime,
          appointmentId,
          patientId: appointment.patient_id,
        });
      }

      // Schedule SMS reminder
      if (recipientPhone) {
        await this.scheduleNotification({
          type: 'appointment_reminder',
          channel: 'sms',
          recipientPhone,
          templateName: 'appointment_reminder_sms_24h',
          variables,
          scheduledAt: reminderTime,
          appointmentId,
          patientId: appointment.patient_id,
        });
      }
    } catch (error) {
      console.error('Error scheduling appointment reminder:', error);
      throw error;
    }
  }

  /**
   * Send appointment confirmation
   */
  async sendAppointmentConfirmation(appointmentId: string): Promise<void> {
    try {
      // Get appointment details
      const { data: appointment, error: appointmentError } = await this.supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(*),
          doctor:users(*)
        `)
        .eq('id', appointmentId)
        .single();

      if (appointmentError || !appointment) {
        throw new Error('Appointment not found');
      }

      const appointmentTime = new Date(appointment.scheduled_at);
      const variables = {
        patient_name: appointment.patient.name,
        appointment_date: appointmentTime.toLocaleDateString('pt-BR'),
        appointment_time: appointmentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        doctor_name: appointment.doctor.name,
      };

      // Send confirmation email if patient has email
      if (appointment.patient.email) {
        await this.scheduleNotification({
          type: 'appointment_confirmation',
          channel: 'email',
          recipientEmail: appointment.patient.email,
          templateName: 'appointment_confirmation_email',
          variables,
          appointmentId,
          patientId: appointment.patient_id,
        });
      }
    } catch (error) {
      console.error('Error sending appointment confirmation:', error);
      throw error;
    }
  }

  /**
   * Process pending notifications
   */
  async processPendingNotifications(): Promise<void> {
    try {
      // Get pending notifications that are due
      const { data: notifications, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .lt('retry_count', 3)
        .order('scheduled_at', { ascending: true })
        .limit(50);

      if (error) {
        throw error;
      }

      for (const notification of notifications || []) {
        await this.sendNotification(notification);
      }
    } catch (error) {
      console.error('Error processing pending notifications:', error);
    }
  }

  /**
   * Send a single notification
   */
  private async sendNotification(notification: any): Promise<void> {
    try {
      let success = false;

      if (notification.channel === 'email' && notification.recipient_email) {
        success = await this.sendEmail(
          notification.recipient_email,
          notification.subject,
          notification.body
        );
      } else if (notification.channel === 'sms' && notification.recipient_phone) {
        success = await this.sendSMS(
          notification.recipient_phone,
          notification.body
        );
      }

      // Update notification status
      const updateData: any = {
        retry_count: notification.retry_count + 1,
      };

      if (success) {
        updateData.status = 'sent';
        updateData.sent_at = new Date().toISOString();
      } else {
        updateData.status = notification.retry_count + 1 >= notification.max_retries ? 'failed' : 'pending';
        updateData.error_message = 'Failed to send notification';
      }

      await this.supabase
        .from('notifications')
        .update(updateData)
        .eq('id', notification.id);

    } catch (error) {
      console.error('Error sending notification:', error);
      
      // Update notification with error
      await this.supabase
        .from('notifications')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          retry_count: notification.retry_count + 1,
        })
        .eq('id', notification.id);
    }
  }

  /**
   * Send email
   */
  private async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    try {
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@visioncare.com.br',
        to,
        subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
      });
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send SMS (placeholder - integrate with SMS provider)
   */
  private async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
      console.log(`SMS to ${to}: ${message}`);
      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }

  /**
   * Get notification template by name
   */
  private async getTemplate(name: string): Promise<NotificationTemplate | null> {
    const { data, error } = await this.supabase
      .from('notification_templates')
      .select('*')
      .eq('name', name)
      .eq('active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      channel: data.channel,
      subject: data.subject,
      body: data.body,
      variables: data.variables || [],
    };
  }

  /**
   * Replace variables in template text
   */
  private replaceVariables(text: string, variables: Record<string, string>): string {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  /**
   * Get patient notification preferences
   */
  private async getPatientNotificationPreferences(patientId: string): Promise<NotificationPreferences> {
    const { data, error } = await this.supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('patient_id', patientId)
      .single();

    if (error || !data) {
      // Return default preferences
      return {
        appointmentRemindersEnabled: true,
        appointmentRemindersChannel: 'email',
        reminderHoursBefore: 24,
        paymentRemindersEnabled: true,
        customNotificationsEnabled: true,
      };
    }

    return {
      appointmentRemindersEnabled: data.appointment_reminders_enabled,
      appointmentRemindersChannel: data.appointment_reminders_channel,
      reminderHoursBefore: data.reminder_hours_before,
      paymentRemindersEnabled: data.payment_reminders_enabled,
      customNotificationsEnabled: data.custom_notifications_enabled,
    };
  }

  /**
   * Update patient notification preferences
   */
  async updatePatientNotificationPreferences(
    patientId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    const updateData: any = {};

    if (preferences.appointmentRemindersEnabled !== undefined) {
      updateData.appointment_reminders_enabled = preferences.appointmentRemindersEnabled;
    }
    if (preferences.appointmentRemindersChannel !== undefined) {
      updateData.appointment_reminders_channel = preferences.appointmentRemindersChannel;
    }
    if (preferences.reminderHoursBefore !== undefined) {
      updateData.reminder_hours_before = preferences.reminderHoursBefore;
    }
    if (preferences.paymentRemindersEnabled !== undefined) {
      updateData.payment_reminders_enabled = preferences.paymentRemindersEnabled;
    }
    if (preferences.customNotificationsEnabled !== undefined) {
      updateData.custom_notifications_enabled = preferences.customNotificationsEnabled;
    }

    const { error } = await this.supabase
      .from('user_notification_preferences')
      .upsert({
        patient_id: patientId,
        ...updateData,
      });

    if (error) {
      throw error;
    }
  }

  /**
   * Cancel notifications for an appointment
   */
  async cancelAppointmentNotifications(appointmentId: string): Promise<void> {
    await this.supabase
      .from('notifications')
      .update({ status: 'cancelled' })
      .eq('appointment_id', appointmentId)
      .eq('status', 'pending');
  }
}

export default new NotificationService();