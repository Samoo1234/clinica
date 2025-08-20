import express from 'express';
import { z } from 'zod';
import notificationService from '../services/notifications';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const updatePreferencesSchema = z.object({
  appointmentRemindersEnabled: z.boolean().optional(),
  appointmentRemindersChannel: z.enum(['email', 'sms', 'both']).optional(),
  reminderHoursBefore: z.number().min(1).max(168).optional(), // 1 hour to 1 week
  paymentRemindersEnabled: z.boolean().optional(),
  customNotificationsEnabled: z.boolean().optional(),
});

const scheduleNotificationSchema = z.object({
  type: z.enum(['appointment_reminder', 'appointment_confirmation', 'appointment_cancellation', 'payment_reminder', 'custom']),
  channel: z.enum(['email', 'sms', 'both']),
  recipientEmail: z.string().email().optional(),
  recipientPhone: z.string().optional(),
  templateName: z.string(),
  variables: z.record(z.string()),
  scheduledAt: z.string().datetime().optional(),
  appointmentId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
});

/**
 * Get patient notification preferences
 */
router.get('/preferences/patient/:patientId', authMiddleware, async (req, res) => {
  try {
    const { patientId } = req.params;

    const { data, error } = await notificationService['supabase']
      .from('user_notification_preferences')
      .select('*')
      .eq('patient_id', patientId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      throw error;
    }

    // Return default preferences if not found
    const preferences = data || {
      appointment_reminders_enabled: true,
      appointment_reminders_channel: 'email',
      reminder_hours_before: 24,
      payment_reminders_enabled: true,
      custom_notifications_enabled: true,
    };

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * Update patient notification preferences
 */
router.put('/preferences/patient/:patientId', authMiddleware, async (req, res) => {
  try {
    const { patientId } = req.params;
    const validatedData = updatePreferencesSchema.parse(req.body);

    await notificationService.updatePatientNotificationPreferences(patientId, validatedData);

    res.json({
      success: true,
      message: 'Preferências de notificação atualizadas com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors,
      });
    }

    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * Schedule a notification
 */
router.post('/schedule', authMiddleware, async (req, res) => {
  try {
    const validatedData = scheduleNotificationSchema.parse(req.body);

    const notificationId = await notificationService.scheduleNotification(validatedData);

    res.json({
      success: true,
      data: { id: notificationId },
      message: 'Notificação agendada com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors,
      });
    }

    console.error('Error scheduling notification:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * Send appointment confirmation
 */
router.post('/appointment/:appointmentId/confirmation', authMiddleware, async (req, res) => {
  try {
    const { appointmentId } = req.params;

    await notificationService.sendAppointmentConfirmation(appointmentId);

    res.json({
      success: true,
      message: 'Confirmação de agendamento enviada com sucesso',
    });
  } catch (error) {
    console.error('Error sending appointment confirmation:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * Schedule appointment reminder
 */
router.post('/appointment/:appointmentId/reminder', authMiddleware, async (req, res) => {
  try {
    const { appointmentId } = req.params;

    await notificationService.scheduleAppointmentReminder(appointmentId);

    res.json({
      success: true,
      message: 'Lembrete de consulta agendado com sucesso',
    });
  } catch (error) {
    console.error('Error scheduling appointment reminder:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * Cancel appointment notifications
 */
router.delete('/appointment/:appointmentId', authMiddleware, async (req, res) => {
  try {
    const { appointmentId } = req.params;

    await notificationService.cancelAppointmentNotifications(appointmentId);

    res.json({
      success: true,
      message: 'Notificações do agendamento canceladas com sucesso',
    });
  } catch (error) {
    console.error('Error canceling appointment notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * Get notification templates
 */
router.get('/templates', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await notificationService['supabase']
      .from('notification_templates')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Error getting notification templates:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * Get notification history
 */
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, patientId, type, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = notificationService['supabase']
      .from('notifications')
      .select(`
        *,
        patient:patients(name),
        appointment:appointments(scheduled_at)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error getting notification history:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * Process pending notifications (admin only)
 */
router.post('/process-pending', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado',
      });
    }

    await notificationService.processPendingNotifications();

    res.json({
      success: true,
      message: 'Notificações pendentes processadas com sucesso',
    });
  } catch (error) {
    console.error('Error processing pending notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

export default router;