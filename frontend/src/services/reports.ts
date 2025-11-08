import { api } from '../utils/api'

export interface AppointmentReportData {
  appointment_id: string
  patient_name: string
  patient_cpf: string
  doctor_name: string
  scheduled_at: string
  status: string
  value: number
  payment_status: string
  consultation_date: string
  diagnosis: string
}

export interface FinancialReportData {
  period: string
  total_appointments: number
  completed_appointments: number
  total_revenue: number
  paid_revenue: number
  pending_revenue: number
  completion_rate: number
  payment_rate: number
}

export interface DoctorPerformanceData {
  doctor_id: string
  doctor_name: string
  total_appointments: number
  completed_appointments: number
  cancelled_appointments: number
  no_show_appointments: number
  total_revenue: number
  average_consultation_value: number
  completion_rate: number
  medical_records_count: number
}

export interface ConsultationTypeData {
  diagnosis_category: string
  consultation_count: number
  unique_patients: number
  percentage: number
}

export interface DashboardKPIs {
  total_patients: number
  new_patients_this_month: number
  total_appointments_this_month: number
  completed_appointments_this_month: number
  completion_rate: number
  total_revenue_this_month: number
  pending_revenue: number
  average_consultation_value: number
  active_doctors: number
  medical_records_this_month: number
}

export interface ReportFilters {
  startDate?: string
  endDate?: string
  doctorId?: string
  status?: string
  groupBy?: 'day' | 'week' | 'month'
}

export interface Doctor {
  id: string
  name: string
  email: string
}

class ReportsService {
  // Get dashboard KPIs
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    const response = await api.get<DashboardKPIs>('/api/reports/dashboard/kpis')
    return response
  }

  // Get appointment report
  async getAppointmentReport(filters: ReportFilters = {}): Promise<AppointmentReportData[]> {
    const params = new URLSearchParams()
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.doctorId) params.append('doctorId', filters.doctorId)
    if (filters.status) params.append('status', filters.status)

    const response = await api.get<AppointmentReportData[]>(`/api/reports/appointments?${params.toString()}`)
    return response
  }

  // Get financial report
  async getFinancialReport(filters: ReportFilters = {}): Promise<FinancialReportData[]> {
    const params = new URLSearchParams()
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.groupBy) params.append('groupBy', filters.groupBy)

    const response = await api.get<FinancialReportData[]>(`/api/reports/financial?${params.toString()}`)
    return response
  }

  // Get doctor performance report
  async getDoctorPerformanceReport(filters: ReportFilters = {}): Promise<DoctorPerformanceData[]> {
    const params = new URLSearchParams()
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.doctorId) params.append('doctorId', filters.doctorId)

    const response = await api.get<DoctorPerformanceData[]>(`/api/reports/doctors/performance?${params.toString()}`)
    return response
  }

  // Get consultation types report
  async getConsultationTypesReport(filters: ReportFilters = {}): Promise<ConsultationTypeData[]> {
    const params = new URLSearchParams()
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)

    const response = await api.get<ConsultationTypeData[]>(`/api/reports/consultations/types?${params.toString()}`)
    return response
  }

  // Get appointment statistics
  async getAppointmentStats(filters: ReportFilters = {}) {
    const params = new URLSearchParams()
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.doctorId) params.append('doctorId', filters.doctorId)

    const response = await api.get<any>(`/api/reports/stats/appointments?${params.toString()}`)
    return response
  }

  // Get financial summary
  async getFinancialSummary(filters: ReportFilters = {}) {
    const params = new URLSearchParams()
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)

    const response = await api.get<any>(`/api/reports/stats/financial?${params.toString()}`)
    return response
  }

  // Get monthly KPIs
  async getMonthlyKPIs(limit: number = 12) {
    const response = await api.get<any>(`/api/reports/stats/monthly?limit=${limit}`)
    return response
  }

  // Get available doctors
  async getDoctors(): Promise<Doctor[]> {
    const response = await api.get<Doctor[]>('/api/reports/doctors')
    return response
  }

  // Export appointment report
  async exportAppointmentReport(filters: ReportFilters = {}): Promise<void> {
    const params = new URLSearchParams()
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.doctorId) params.append('doctorId', filters.doctorId)
    if (filters.status) params.append('status', filters.status)

    const response = await api.get<Blob>(`/api/reports/appointments/export?${params.toString()}`, {
      responseType: 'blob'
    })

    const blob = new Blob([response], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'relatorio-consultas.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Export financial report
  async exportFinancialReport(filters: ReportFilters = {}): Promise<void> {
    const params = new URLSearchParams()
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.groupBy) params.append('groupBy', filters.groupBy)

    const response = await api.get<Blob>(`/api/reports/financial/export?${params.toString()}`, {
      responseType: 'blob'
    })

    const blob = new Blob([response], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'relatorio-financeiro.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Export doctor performance report
  async exportDoctorPerformanceReport(filters: ReportFilters = {}): Promise<void> {
    const params = new URLSearchParams()
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.doctorId) params.append('doctorId', filters.doctorId)

    const response = await api.get<Blob>(`/api/reports/doctors/performance/export?${params.toString()}`, {
      responseType: 'blob'
    })

    const blob = new Blob([response], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'relatorio-desempenho-medicos.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Get comprehensive report summary
  async getReportSummary(filters: ReportFilters = {}) {
    const params = new URLSearchParams()
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.doctorId) params.append('doctorId', filters.doctorId)

    const response = await api.get<any>(`/api/reports/summary?${params.toString()}`)
    return response
  }
}

export const reportsService = new ReportsService()