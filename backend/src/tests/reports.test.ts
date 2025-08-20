import { reportsService } from '../services/reports'

// Mock the Supabase client
const mockSupabase = {
  rpc: jest.fn(),
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({ data: [], error: null }))
      })),
      gte: jest.fn(() => ({
        lte: jest.fn(() => ({
          order: jest.fn(() => ({ data: [], error: null }))
        }))
      })),
      order: jest.fn(() => ({ data: [], error: null }))
    }))
  }))
}

// Mock the database service
jest.mock('../config/supabase', () => ({
  supabaseAdmin: mockSupabase
}))

describe('ReportsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('exportToCSV', () => {
    it('should convert data to CSV format', () => {
      const data = [
        { name: 'João', age: 30, city: 'São Paulo' },
        { name: 'Maria', age: 25, city: 'Rio de Janeiro' }
      ]

      const result = reportsService.exportToCSV(data, 'test')

      const expectedCSV = 'name,age,city\nJoão,30,São Paulo\nMaria,25,Rio de Janeiro'
      expect(result).toBe(expectedCSV)
    })

    it('should handle empty data', () => {
      const result = reportsService.exportToCSV([], 'test')
      expect(result).toBe('')
    })

    it('should handle data with commas and quotes', () => {
      const data = [
        { name: 'João, Silva', description: 'Test "quoted" text' }
      ]

      const result = reportsService.exportToCSV(data, 'test')

      const expectedCSV = 'name,description\n"João, Silva","Test ""quoted"" text"'
      expect(result).toBe(expectedCSV)
    })
  })

  describe('getDashboardKPIs', () => {
    it('should return dashboard KPIs', async () => {
      const mockKPIs = {
        total_patients: 100,
        new_patients_this_month: 10,
        total_appointments_this_month: 50,
        completed_appointments_this_month: 45,
        completion_rate: 90.0,
        total_revenue_this_month: 5000.00,
        pending_revenue: 500.00,
        average_consultation_value: 100.00,
        active_doctors: 3,
        medical_records_this_month: 45
      }

      mockSupabase.rpc.mockResolvedValue({
        data: [mockKPIs],
        error: null
      })

      const result = await reportsService.getDashboardKPIs()

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_dashboard_kpis')
      expect(result).toEqual(mockKPIs)
    })

    it('should handle errors gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      await expect(reportsService.getDashboardKPIs()).rejects.toThrow('Failed to fetch dashboard KPIs')
    })

    it('should return default values when no data', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await reportsService.getDashboardKPIs()

      expect(result).toEqual({
        total_patients: 0,
        new_patients_this_month: 0,
        total_appointments_this_month: 0,
        completed_appointments_this_month: 0,
        completion_rate: 0,
        total_revenue_this_month: 0,
        pending_revenue: 0,
        average_consultation_value: 0,
        active_doctors: 0,
        medical_records_this_month: 0
      })
    })
  })

  describe('getAppointmentReport', () => {
    it('should return appointment report with filters', async () => {
      const mockAppointments = [
        {
          appointment_id: '1',
          patient_name: 'João Silva',
          patient_cpf: '123.456.789-00',
          doctor_name: 'Dr. Maria',
          scheduled_at: '2024-01-15T10:00:00Z',
          status: 'completed',
          value: 150.00,
          payment_status: 'paid',
          consultation_date: '2024-01-15',
          diagnosis: 'Miopia'
        }
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: mockAppointments,
        error: null
      })

      const filters = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        doctorId: 'doctor-1',
        status: 'completed'
      }

      const result = await reportsService.getAppointmentReport(filters)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_appointment_report', {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        doctor_id_filter: 'doctor-1',
        status_filter: 'completed'
      })
      expect(result).toEqual(mockAppointments)
    })
  })

  describe('getFinancialReport', () => {
    it('should return financial report', async () => {
      const mockFinancialData = [
        {
          period: '2024-01',
          total_appointments: 20,
          completed_appointments: 18,
          total_revenue: 3000.00,
          paid_revenue: 2700.00,
          pending_revenue: 300.00,
          completion_rate: 90.0,
          payment_rate: 90.0
        }
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: mockFinancialData,
        error: null
      })

      const filters = { groupBy: 'month' as const }
      const result = await reportsService.getFinancialReport(filters)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_financial_report', {
        start_date: null,
        end_date: null,
        group_by_period: 'month'
      })
      expect(result).toEqual(mockFinancialData)
    })
  })

  describe('getDoctorPerformanceReport', () => {
    it('should return doctor performance report', async () => {
      const mockPerformanceData = [
        {
          doctor_id: 'doctor-1',
          doctor_name: 'Dr. Maria Silva',
          total_appointments: 50,
          completed_appointments: 45,
          cancelled_appointments: 3,
          no_show_appointments: 2,
          total_revenue: 7500.00,
          average_consultation_value: 150.00,
          completion_rate: 90.0,
          medical_records_count: 45
        }
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: mockPerformanceData,
        error: null
      })

      const result = await reportsService.getDoctorPerformanceReport()

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_doctor_performance_report', {
        start_date: null,
        end_date: null,
        doctor_id_filter: null
      })
      expect(result).toEqual(mockPerformanceData)
    })
  })

  describe('getConsultationTypesReport', () => {
    it('should return consultation types report', async () => {
      const mockConsultationTypes = [
        {
          diagnosis_category: 'Miopia',
          consultation_count: 25,
          unique_patients: 20,
          percentage: 50.0
        },
        {
          diagnosis_category: 'Hipermetropia',
          consultation_count: 15,
          unique_patients: 12,
          percentage: 30.0
        }
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: mockConsultationTypes,
        error: null
      })

      const result = await reportsService.getConsultationTypesReport()

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_consultation_types_report', {
        start_date: null,
        end_date: null
      })
      expect(result).toEqual(mockConsultationTypes)
    })
  })

  describe('getDoctors', () => {
    it('should return list of doctors', async () => {
      const mockDoctors = [
        { id: 'doctor-1', name: 'Dr. Maria Silva', email: 'maria@clinic.com' },
        { id: 'doctor-2', name: 'Dr. João Santos', email: 'joao@clinic.com' }
      ]

      // Mock the chain of methods
      const orderMock = jest.fn(() => ({ data: mockDoctors, error: null }))
      const eqMock2 = jest.fn(() => ({ order: orderMock }))
      const eqMock1 = jest.fn(() => ({ eq: eqMock2 }))
      const selectMock = jest.fn(() => ({ eq: eqMock1 }))
      
      mockSupabase.from.mockReturnValue({ select: selectMock })

      const result = await reportsService.getDoctors()

      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(selectMock).toHaveBeenCalledWith('id, name, email')
      expect(result).toEqual(mockDoctors)
    })
  })
})