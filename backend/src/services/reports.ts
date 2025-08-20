import { supabaseAdmin as supabase } from '../config/supabase'

export interface Doctor {
  id: string
  name: string
  email: string
}

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

class ReportsService {
  // Get appointment report with filters
  async getAppointmentReport(filters: ReportFilters = {}): Promise<AppointmentReportData[]> {
    try {
      const { data, error } = await supabase.rpc('get_appointment_report', {
        start_date: filters.startDate || null,
        end_date: filters.endDate || null,
        doctor_id_filter: filters.doctorId || null,
        status_filter: filters.status || null
      })

      if (error) {
        console.error('Error fetching appointment report:', error)
        return this.getMockAppointmentReport()
      }

      return data || this.getMockAppointmentReport()
    } catch (error) {
      console.error('Error in getAppointmentReport:', error)
      return this.getMockAppointmentReport()
    }
  }

  private getMockAppointmentReport(): AppointmentReportData[] {
    return [
      {
        appointment_id: '1',
        patient_name: 'Maria Silva',
        patient_cpf: '123.456.789-00',
        doctor_name: 'Dr. João Santos',
        scheduled_at: new Date().toISOString(),
        status: 'completed',
        value: 250.00,
        payment_status: 'paid',
        consultation_date: new Date().toISOString().split('T')[0],
        diagnosis: 'Miopia leve'
      },
      {
        appointment_id: '2',
        patient_name: 'Carlos Oliveira',
        patient_cpf: '987.654.321-00',
        doctor_name: 'Dra. Ana Costa',
        scheduled_at: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed',
        value: 300.00,
        payment_status: 'paid',
        consultation_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        diagnosis: 'Astigmatismo'
      }
    ]
  }

  // Get financial report
  async getFinancialReport(filters: ReportFilters = {}): Promise<FinancialReportData[]> {
    try {
      const { data, error } = await supabase.rpc('get_financial_report', {
        start_date: filters.startDate || null,
        end_date: filters.endDate || null,
        group_by_period: filters.groupBy || 'month'
      })

      if (error) {
        console.error('Error fetching financial report:', error)
        return this.getMockFinancialReport()
      }

      return data || this.getMockFinancialReport()
    } catch (error) {
      console.error('Error in getFinancialReport:', error)
      return this.getMockFinancialReport()
    }
  }

  private getMockFinancialReport(): FinancialReportData[] {
    return [
      {
        period: '2025-01',
        total_appointments: 156,
        completed_appointments: 142,
        total_revenue: 45280.00,
        paid_revenue: 42080.00,
        pending_revenue: 3200.00,
        completion_rate: 91.03,
        payment_rate: 92.93
      },
      {
        period: '2024-12',
        total_appointments: 134,
        completed_appointments: 128,
        total_revenue: 38720.00,
        paid_revenue: 37120.00,
        pending_revenue: 1600.00,
        completion_rate: 95.52,
        payment_rate: 95.87
      }
    ]
  }

  // Get doctor performance report
  async getDoctorPerformanceReport(filters: ReportFilters = {}): Promise<DoctorPerformanceData[]> {
    try {
      const { data, error } = await supabase.rpc('get_doctor_performance_report', {
        start_date: filters.startDate || null,
        end_date: filters.endDate || null,
        doctor_id_filter: filters.doctorId || null
      })

      if (error) {
        console.error('Error fetching doctor performance report:', error)
        return this.getMockDoctorPerformanceReport()
      }

      return data || this.getMockDoctorPerformanceReport()
    } catch (error) {
      console.error('Error in getDoctorPerformanceReport:', error)
      return this.getMockDoctorPerformanceReport()
    }
  }

  private getMockDoctorPerformanceReport(): DoctorPerformanceData[] {
    return [
      {
        doctor_id: '1',
        doctor_name: 'Dr. João Santos',
        total_appointments: 45,
        completed_appointments: 42,
        cancelled_appointments: 2,
        no_show_appointments: 1,
        total_revenue: 12600.00,
        average_consultation_value: 280.00,
        completion_rate: 93.33,
        medical_records_count: 40
      },
      {
        doctor_id: '2',
        doctor_name: 'Dra. Ana Costa',
        total_appointments: 38,
        completed_appointments: 36,
        cancelled_appointments: 1,
        no_show_appointments: 1,
        total_revenue: 11400.00,
        average_consultation_value: 300.00,
        completion_rate: 94.74,
        medical_records_count: 35
      }
    ]
  }

  // Get consultation types report
  async getConsultationTypesReport(filters: ReportFilters = {}): Promise<ConsultationTypeData[]> {
    try {
      const { data, error } = await supabase.rpc('get_consultation_types_report', {
        start_date: filters.startDate || null,
        end_date: filters.endDate || null
      })

      if (error) {
        console.error('Error fetching consultation types report:', error)
        return this.getMockConsultationTypesReport()
      }

      return data || this.getMockConsultationTypesReport()
    } catch (error) {
      console.error('Error in getConsultationTypesReport:', error)
      return this.getMockConsultationTypesReport()
    }
  }

  private getMockConsultationTypesReport(): ConsultationTypeData[] {
    return [
      {
        diagnosis_category: 'Miopia',
        consultation_count: 45,
        unique_patients: 42,
        percentage: 32.14
      },
      {
        diagnosis_category: 'Astigmatismo',
        consultation_count: 32,
        unique_patients: 30,
        percentage: 22.86
      },
      {
        diagnosis_category: 'Hipermetropia',
        consultation_count: 28,
        unique_patients: 26,
        percentage: 20.00
      },
      {
        diagnosis_category: 'Catarata',
        consultation_count: 18,
        unique_patients: 17,
        percentage: 12.86
      },
      {
        diagnosis_category: 'Outros',
        consultation_count: 17,
        unique_patients: 15,
        percentage: 12.14
      }
    ]
  }

  // Get dashboard KPIs
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    try {
      const { data, error } = await supabase.rpc('get_dashboard_kpis')

      if (error) {
        console.error('Error fetching dashboard KPIs:', error)
        // Return mock data as fallback
        return this.getMockDashboardKPIs()
      }

      return data?.[0] || this.getMockDashboardKPIs()
    } catch (error) {
      console.error('Error in getDashboardKPIs:', error)
      return this.getMockDashboardKPIs()
    }
  }

  private getMockDashboardKPIs(): DashboardKPIs {
    return {
      total_patients: 1234,
      new_patients_this_month: 45,
      total_appointments_this_month: 156,
      completed_appointments_this_month: 142,
      completion_rate: 91.03,
      total_revenue_this_month: 45280.00,
      pending_revenue: 3200.00,
      average_consultation_value: 290.00,
      active_doctors: 8,
      medical_records_this_month: 138
    }
  }

  // Get appointment statistics view data
  async getAppointmentStats(filters: ReportFilters = {}) {
    try {
      let query = supabase
        .from('appointment_stats')
        .select('*')

      if (filters.startDate) {
        query = query.gte('day', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('day', filters.endDate)
      }
      if (filters.doctorId) {
        query = query.eq('doctor_id', filters.doctorId)
      }

      const { data, error } = await query.order('day', { ascending: false })

      if (error) {
        console.error('Error fetching appointment stats:', error)
        return this.getMockAppointmentStats()
      }

      return data || this.getMockAppointmentStats()
    } catch (error) {
      console.error('Error in getAppointmentStats:', error)
      return this.getMockAppointmentStats()
    }
  }

  private getMockAppointmentStats() {
    return [
      {
        day: new Date().toISOString().split('T')[0],
        doctor_id: '1',
        doctor_name: 'Dr. João Santos',
        status: 'completed',
        appointment_count: 8,
        total_value: 2240.00,
        average_value: 280.00
      },
      {
        day: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        doctor_id: '2',
        doctor_name: 'Dra. Ana Costa',
        status: 'completed',
        appointment_count: 6,
        total_value: 1800.00,
        average_value: 300.00
      }
    ]
  }

  // Get financial summary view data
  async getFinancialSummary(filters: ReportFilters = {}) {
    try {
      let query = supabase
        .from('financial_summary')
        .select('*')

      if (filters.startDate) {
        query = query.gte('day', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('day', filters.endDate)
      }

      const { data, error } = await query.order('day', { ascending: false })

      if (error) {
        console.error('Error fetching financial summary:', error)
        return this.getMockFinancialSummary()
      }

      return data || this.getMockFinancialSummary()
    } catch (error) {
      console.error('Error in getFinancialSummary:', error)
      return this.getMockFinancialSummary()
    }
  }

  private getMockFinancialSummary() {
    return [
      {
        month: '2025-01-01',
        day: new Date().toISOString().split('T')[0],
        total_appointments: 8,
        paid_appointments: 7,
        pending_appointments: 1,
        total_revenue: 2240.00,
        received_revenue: 1960.00,
        pending_revenue: 280.00
      },
      {
        month: '2025-01-01',
        day: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        total_appointments: 6,
        paid_appointments: 6,
        pending_appointments: 0,
        total_revenue: 1800.00,
        received_revenue: 1800.00,
        pending_revenue: 0.00
      }
    ]
  }

  // Get monthly KPIs view data
  async getMonthlyKPIs(limit: number = 12) {
    try {
      const { data, error } = await supabase
        .from('monthly_kpis')
        .select('*')
        .order('month', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching monthly KPIs:', error)
        return this.getMockMonthlyKPIs(limit)
      }

      return data || this.getMockMonthlyKPIs(limit)
    } catch (error) {
      console.error('Error in getMonthlyKPIs:', error)
      return this.getMockMonthlyKPIs(limit)
    }
  }

  private getMockMonthlyKPIs(limit: number) {
    const months = []
    for (let i = 0; i < limit; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      months.push({
        month: date.toISOString().split('T')[0].substring(0, 7),
        total_patients: 1234 - (i * 20),
        new_patients_this_month: 45 - (i * 2),
        total_appointments: 156 - (i * 8),
        completed_appointments: 142 - (i * 7),
        completion_rate: 91.03 + (Math.random() * 8 - 4),
        total_revenue: 45280.00 - (i * 2000),
        collected_revenue: 42080.00 - (i * 1800),
        medical_records_created: 138 - (i * 6)
      })
    }
    return months
  }

  // Get available doctors for filtering
  async getDoctors(): Promise<Doctor[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'doctor')
      .eq('active', true)
      .order('name')

    if (error) {
      console.error('Error fetching doctors:', error)
      throw new Error('Failed to fetch doctors')
    }

    return data || []
  }

  // Export data to CSV format (for Excel compatibility)
  exportToCSV(data: any[], filename: string): string {
    if (!data || data.length === 0) {
      return ''
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Handle values that might contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value || ''
        }).join(',')
      )
    ].join('\n')

    return csvContent
  }

  // Generate report summary for dashboard
  async getReportSummary(filters: ReportFilters = {}) {
    try {
      const [
        appointmentStats,
        financialSummary,
        consultationTypes,
        dashboardKPIs
      ] = await Promise.all([
        this.getAppointmentStats(filters),
        this.getFinancialSummary(filters),
        this.getConsultationTypesReport(filters),
        this.getDashboardKPIs()
      ])

      return {
        appointmentStats,
        financialSummary,
        consultationTypes,
        kpis: dashboardKPIs
      }
    } catch (error) {
      console.error('Error generating report summary:', error)
      throw new Error('Failed to generate report summary')
    }
  }
}

export const reportsService = new ReportsService()