import { supabaseAdmin } from '../config/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export class RealtimeAppointmentService {
  private channels: Map<string, RealtimeChannel> = new Map()

  // Subscribe to appointment changes for a specific doctor
  subscribeToAppointmentChanges(
    doctorId: string,
    callbacks: {
      onInsert?: (payload: any) => void
      onUpdate?: (payload: any) => void
      onDelete?: (payload: any) => void
    }
  ): RealtimeChannel {
    const channelName = `appointments_${doctorId}`
    
    // Remove existing channel if it exists
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName)
    }

    const channel = supabaseAdmin
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `doctor_id=eq.${doctorId}`
        },
        (payload) => {
          console.log('New appointment created:', payload)
          callbacks.onInsert?.(payload)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `doctor_id=eq.${doctorId}`
        },
        (payload) => {
          console.log('Appointment updated:', payload)
          callbacks.onUpdate?.(payload)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'appointments',
          filter: `doctor_id=eq.${doctorId}`
        },
        (payload) => {
          console.log('Appointment deleted:', payload)
          callbacks.onDelete?.(payload)
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)
    return channel
  }

  // Subscribe to all appointment changes (for admin users)
  subscribeToAllAppointmentChanges(callbacks: {
    onInsert?: (payload: any) => void
    onUpdate?: (payload: any) => void
    onDelete?: (payload: any) => void
  }): RealtimeChannel {
    const channelName = 'all_appointments'
    
    // Remove existing channel if it exists
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName)
    }

    const channel = supabaseAdmin
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('New appointment created:', payload)
          callbacks.onInsert?.(payload)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('Appointment updated:', payload)
          callbacks.onUpdate?.(payload)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('Appointment deleted:', payload)
          callbacks.onDelete?.(payload)
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)
    return channel
  }

  // Subscribe to appointment status changes
  subscribeToAppointmentStatusChanges(
    appointmentId: string,
    callback: (payload: any) => void
  ): RealtimeChannel {
    const channelName = `appointment_status_${appointmentId}`
    
    // Remove existing channel if it exists
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName)
    }

    const channel = supabaseAdmin
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `id=eq.${appointmentId}`
        },
        (payload) => {
          console.log('Appointment status changed:', payload)
          callback(payload)
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)
    return channel
  }

  // Subscribe to patient's appointments
  subscribeToPatientAppointments(
    patientId: string,
    callbacks: {
      onInsert?: (payload: any) => void
      onUpdate?: (payload: any) => void
      onDelete?: (payload: any) => void
    }
  ): RealtimeChannel {
    const channelName = `patient_appointments_${patientId}`
    
    // Remove existing channel if it exists
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName)
    }

    const channel = supabaseAdmin
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `patient_id=eq.${patientId}`
        },
        (payload) => {
          console.log('New appointment for patient:', payload)
          callbacks.onInsert?.(payload)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `patient_id=eq.${patientId}`
        },
        (payload) => {
          console.log('Patient appointment updated:', payload)
          callbacks.onUpdate?.(payload)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'appointments',
          filter: `patient_id=eq.${patientId}`
        },
        (payload) => {
          console.log('Patient appointment deleted:', payload)
          callbacks.onDelete?.(payload)
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)
    return channel
  }

  // Unsubscribe from a specific channel
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName)
    if (channel) {
      supabaseAdmin.removeChannel(channel)
      this.channels.delete(channelName)
      console.log(`Unsubscribed from channel: ${channelName}`)
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll(): void {
    this.channels.forEach((channel, channelName) => {
      supabaseAdmin.removeChannel(channel)
      console.log(`Unsubscribed from channel: ${channelName}`)
    })
    this.channels.clear()
  }

  // Get active channels
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys())
  }

  // Check if a channel is active
  isChannelActive(channelName: string): boolean {
    return this.channels.has(channelName)
  }

  // Send custom notification through Supabase
  async sendCustomNotification(channel: string, payload: any): Promise<void> {
    try {
      const { error } = await supabaseAdmin.rpc('pg_notify', {
        channel,
        payload: JSON.stringify(payload)
      })

      if (error) {
        throw error
      }

      console.log(`Custom notification sent to channel ${channel}:`, payload)
    } catch (error) {
      console.error('Error sending custom notification:', error)
      throw error
    }
  }

  // Listen to custom notifications
  subscribeToCustomNotifications(
    channel: string,
    callback: (payload: any) => void
  ): RealtimeChannel {
    const channelName = `custom_${channel}`
    
    // Remove existing channel if it exists
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName)
    }

    const realtimeChannel = supabaseAdmin
      .channel(channelName)
      .on('broadcast', { event: channel }, (payload) => {
        console.log(`Custom notification received on ${channel}:`, payload)
        callback(payload)
      })
      .subscribe()

    this.channels.set(channelName, realtimeChannel)
    return realtimeChannel
  }
}

export const realtimeAppointmentService = new RealtimeAppointmentService()