import { Appointment, AppointmentStatus } from '../types/database'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface CreateAppointmentData {
  patient_id: string
  doctor_id: string
  scheduled_at: string
  duration_minutes?: number
  notes?: string
  value?: number
}

export interface UpdateAppointmentData extends Partial<CreateAppointmentData> {
  status?: AppointmentStatus
  payment_status?: 'pending' | 'paid' | 'cancelled' | 'refunded'
}

export interface AppointmentFilters {
  doctorId?: string
  patientId?: string
  date?: string
  status?: AppointmentStatus
  limit?: number
  offset?: number
}

export interface AppointmentWithRelations extends Appointment {
  patient: {
    id: string
    name: string
    cpf: string
    phone: string
  }
  doctor: {
    id: string
    name: string
    email: string
  }
}

class AppointmentService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem('token')
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  async getAppointments(filters?: AppointmentFilters): Promise<{
    appointments: AppointmentWithRelations[]
    total: number
  }> {
    const params = new URLSearchParams()
    
    if (filters?.doctorId) params.append('doctorId', filters.doctorId)
    if (filters?.patientId) params.append('patientId', filters.patientId)
    if (filters?.date) params.append('date', filters.date)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const queryString = params.toString()
    const endpoint = `/api/appointments${queryString ? `?${queryString}` : ''}`
    
    return this.request<{
      appointments: AppointmentWithRelations[]
      total: number
    }>(endpoint)
  }

  async getAppointmentById(id: string): Promise<AppointmentWithRelations> {
    return this.request<AppointmentWithRelations>(`/api/appointments/${id}`)
  }

  async createAppointment(data: CreateAppointmentData): Promise<AppointmentWithRelations> {
    return this.request<AppointmentWithRelations>('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateAppointment(id: string, data: UpdateAppointmentData): Promise<AppointmentWithRelations> {
    return this.request<AppointmentWithRelations>(`/api/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<AppointmentWithRelations> {
    return this.request<AppointmentWithRelations>(`/api/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  async deleteAppointment(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/appointments/${id}`, {
      method: 'DELETE',
    })
  }

  async getAvailableSlots(doctorId: string, date: string, duration: number = 30): Promise<{
    availableSlots: string[]
  }> {
    return this.request<{ availableSlots: string[] }>(
      `/api/appointments/availability/${doctorId}/${date}?duration=${duration}`
    )
  }

  async getAppointmentsByDateRange(
    startDate: string, 
    endDate: string, 
    doctorId?: string
  ): Promise<AppointmentWithRelations[]> {
    const params = new URLSearchParams({
      startDate,
      endDate,
    })
    
    if (doctorId) {
      params.append('doctorId', doctorId)
    }

    return this.request<AppointmentWithRelations[]>(
      `/api/appointments/date-range?${params.toString()}`
    )
  }

  async getUpcomingAppointments(doctorId?: string, limit: number = 10): Promise<AppointmentWithRelations[]> {
    const params = new URLSearchParams({ limit: limit.toString() })
    if (doctorId) params.append('doctorId', doctorId)

    return this.request<AppointmentWithRelations[]>(
      `/api/appointments/upcoming?${params.toString()}`
    )
  }
}

export const appointmentService = new AppointmentService()