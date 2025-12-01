import { supabaseAdmin } from '../config/supabase'
import { 
  CreateAppointmentData, 
  UpdateAppointmentData,
  AppointmentStatus 
} from '../types/database'
import notificationService from './notifications'
import { startOfDayBrazil, endOfDayBrazil } from '../utils/timezone'

export class AppointmentService {
  // Get all appointments with optional filters
  async getAppointments(filters?: {
    doctorId?: string
    patientId?: string
    date?: string
    status?: AppointmentStatus
    limit?: number
    offset?: number
  }) {
    let query = supabaseAdmin
      .from('appointments')
      .select(`
        *,
        patient:patients(id, name, cpf, phone),
        doctor:users!appointments_doctor_id_fkey(id, name, email)
      `)
      .order('scheduled_at', { ascending: true })

    if (filters?.doctorId) {
      query = query.eq('doctor_id', filters.doctorId)
    }

    if (filters?.patientId) {
      query = query.eq('patient_id', filters.patientId)
    }

    if (filters?.date) {
      // Usar timezone Brasil para filtrar corretamente por dia
      const dayStart = startOfDayBrazil(filters.date)
      const dayEnd = endOfDayBrazil(filters.date)
      
      query = query
        .gte('scheduled_at', dayStart)
        .lte('scheduled_at', dayEnd)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Error fetching appointments: ${error.message}`)
    }

    return {
      appointments: data || [],
      total: count || 0
    }
  }

  // Get appointment by ID
  async getAppointmentById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        patient:patients(id, name, cpf, phone, email),
        doctor:users!appointments_doctor_id_fkey(id, name, email)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Error fetching appointment: ${error.message}`)
    }

    return data
  }

  // Create new appointment
  async createAppointment(appointmentData: CreateAppointmentData) {
    // Check for conflicts before creating
    const hasConflict = await this.checkTimeConflict(
      appointmentData.doctor_id,
      appointmentData.scheduled_at,
      appointmentData.duration_minutes || 30
    )

    if (hasConflict) {
      throw new Error('Time conflict detected. The selected time slot is not available.')
    }

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .insert([appointmentData])
      .select(`
        *,
        patient:patients(id, name, cpf, phone),
        doctor:users!appointments_doctor_id_fkey(id, name, email)
      `)
      .single()

    if (error) {
      throw new Error(`Error creating appointment: ${error.message}`)
    }

    // Schedule appointment confirmation and reminder
    try {
      await notificationService.sendAppointmentConfirmation(data.id)
      await notificationService.scheduleAppointmentReminder(data.id)
    } catch (notificationError) {
      console.error('Error scheduling notifications for appointment:', notificationError)
      // Don't fail the appointment creation if notifications fail
    }

    return data
  }

  // Update appointment
  async updateAppointment(id: string, appointmentData: UpdateAppointmentData) {
    // Check if appointment exists first
    const currentAppointment = await this.getAppointmentById(id)
    if (!currentAppointment) {
      throw new Error('Appointment not found')
    }

    // If updating scheduled_at, check for conflicts
    if (appointmentData.scheduled_at) {
      const hasConflict = await this.checkTimeConflict(
        currentAppointment.doctor_id,
        appointmentData.scheduled_at,
        appointmentData.duration_minutes || currentAppointment.duration_minutes,
        id // Exclude current appointment from conflict check
      )

      if (hasConflict) {
        throw new Error('Time conflict detected. The selected time slot is not available.')
      }
    }

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update(appointmentData)
      .eq('id', id)
      .select(`
        *,
        patient:patients(id, name, cpf, phone),
        doctor:users!appointments_doctor_id_fkey(id, name, email)
      `)
      .single()

    if (error) {
      throw new Error(`Error updating appointment: ${error.message}`)
    }

    // If appointment was rescheduled, update notifications
    if (appointmentData.scheduled_at) {
      try {
        await notificationService.cancelAppointmentNotifications(id)
        await notificationService.scheduleAppointmentReminder(id)
      } catch (notificationError) {
        console.error('Error updating notifications for appointment:', notificationError)
        // Don't fail the appointment update if notifications fail
      }
    }

    return data
  }

  // Delete appointment
  async deleteAppointment(id: string) {
    // Cancel notifications before deleting
    try {
      await notificationService.cancelAppointmentNotifications(id)
    } catch (notificationError) {
      console.error('Error canceling notifications for appointment:', notificationError)
      // Continue with deletion even if notification cancellation fails
    }

    const { error } = await supabaseAdmin
      .from('appointments')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Error deleting appointment: ${error.message}`)
    }

    return { success: true }
  }

  // Check for time conflicts
  async checkTimeConflict(
    doctorId: string, 
    scheduledAt: string, 
    durationMinutes: number,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    const startTime = new Date(scheduledAt)
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000)

    // Get all appointments for the doctor on the same day
    const dayStart = new Date(startTime)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(startTime)
    dayEnd.setHours(23, 59, 59, 999)

    let query = supabaseAdmin
      .from('appointments')
      .select('id, scheduled_at, duration_minutes')
      .eq('doctor_id', doctorId)
      .in('status', ['scheduled', 'confirmed', 'in_progress'])
      .gte('scheduled_at', dayStart.toISOString())
      .lte('scheduled_at', dayEnd.toISOString())

    if (excludeAppointmentId) {
      query = query.neq('id', excludeAppointmentId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error checking time conflict: ${error.message}`)
    }

    // Check for overlapping appointments
    if (data && data.length > 0) {
      for (const appointment of data) {
        const appointmentStart = new Date(appointment.scheduled_at)
        const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration_minutes * 60000)

        // Check if there's any overlap
        if (startTime < appointmentEnd && endTime > appointmentStart) {
          return true
        }
      }
    }

    return false
  }

  // Get available time slots for a doctor on a specific date
  async getAvailableSlots(doctorId: string, date: string, slotDuration: number = 30) {
    const startDate = new Date(date)
    const endDate = new Date(date)
    endDate.setDate(endDate.getDate() + 1)

    // Get existing appointments for the day
    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select('scheduled_at, duration_minutes')
      .eq('doctor_id', doctorId)
      .in('status', ['scheduled', 'confirmed', 'in_progress'])
      .gte('scheduled_at', startDate.toISOString())
      .lt('scheduled_at', endDate.toISOString())
      .order('scheduled_at')

    if (error) {
      throw new Error(`Error fetching appointments: ${error.message}`)
    }

    // Define working hours (8:00 AM to 6:00 PM)
    const workingHours = {
      start: 8, // 8:00 AM
      end: 18,  // 6:00 PM
      lunchStart: 12, // 12:00 PM
      lunchEnd: 13    // 1:00 PM
    }

    const availableSlots: string[] = []
    const bookedSlots = new Set<string>()

    // Mark booked slots
    if (appointments) {
      appointments.forEach(appointment => {
        const appointmentStart = new Date(appointment.scheduled_at)
        const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration_minutes * 60000)
        
        // Mark all slots within this appointment as booked
        let current = new Date(appointmentStart)
        while (current < appointmentEnd) {
          bookedSlots.add(current.toISOString())
          current = new Date(current.getTime() + slotDuration * 60000)
        }
      })
    }

    // Generate available slots
    const currentDate = new Date(startDate)
    currentDate.setHours(workingHours.start, 0, 0, 0)

    while (currentDate.getHours() < workingHours.end) {
      const hour = currentDate.getHours()
      
      // Skip lunch time
      if (hour >= workingHours.lunchStart && hour < workingHours.lunchEnd) {
        currentDate.setTime(currentDate.getTime() + slotDuration * 60000)
        continue
      }

      // Check if slot is available
      if (!bookedSlots.has(currentDate.toISOString())) {
        availableSlots.push(currentDate.toISOString())
      }

      currentDate.setTime(currentDate.getTime() + slotDuration * 60000)
    }

    return availableSlots
  }

  // Get appointments for a specific date range
  async getAppointmentsByDateRange(startDate: string, endDate: string, doctorId?: string) {
    let query = supabaseAdmin
      .from('appointments')
      .select(`
        *,
        patient:patients(id, name, cpf, phone),
        doctor:users!appointments_doctor_id_fkey(id, name, email)
      `)
      .gte('scheduled_at', startDate)
      .lte('scheduled_at', endDate)
      .order('scheduled_at')

    if (doctorId) {
      query = query.eq('doctor_id', doctorId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error fetching appointments: ${error.message}`)
    }

    return data || []
  }

  // Update appointment status
  async updateAppointmentStatus(id: string, status: AppointmentStatus) {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        patient:patients(id, name, cpf, phone),
        doctor:users!appointments_doctor_id_fkey(id, name, email)
      `)
      .single()

    if (error) {
      throw new Error(`Error updating appointment status: ${error.message}`)
    }

    return data
  }

  // Get upcoming appointments (next 7 days)
  async getUpcomingAppointments(doctorId?: string, limit: number = 10) {
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    let query = supabaseAdmin
      .from('appointments')
      .select(`
        *,
        patient:patients(id, name, cpf, phone),
        doctor:users!appointments_doctor_id_fkey(id, name, email)
      `)
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', nextWeek.toISOString())
      .in('status', ['scheduled', 'confirmed'])
      .order('scheduled_at')
      .limit(limit)

    if (doctorId) {
      query = query.eq('doctor_id', doctorId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error fetching upcoming appointments: ${error.message}`)
    }

    return data || []
  }
}

export const appointmentService = new AppointmentService()