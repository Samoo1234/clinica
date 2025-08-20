import { reportsService } from '../services/reports'

describe('ReportsService - Simple Tests', () => {
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

    it('should handle null and undefined values', () => {
      const data = [
        { name: 'João', age: null, city: undefined }
      ]

      const result = reportsService.exportToCSV(data, 'test')

      const expectedCSV = 'name,age,city\nJoão,,'
      expect(result).toBe(expectedCSV)
    })

    it('should handle numeric values', () => {
      const data = [
        { name: 'João', age: 30, salary: 5000.50 }
      ]

      const result = reportsService.exportToCSV(data, 'test')

      const expectedCSV = 'name,age,salary\nJoão,30,5000.5'
      expect(result).toBe(expectedCSV)
    })
  })

  describe('Service structure', () => {
    it('should have all required methods', () => {
      expect(typeof reportsService.getDashboardKPIs).toBe('function')
      expect(typeof reportsService.getAppointmentReport).toBe('function')
      expect(typeof reportsService.getFinancialReport).toBe('function')
      expect(typeof reportsService.getDoctorPerformanceReport).toBe('function')
      expect(typeof reportsService.getConsultationTypesReport).toBe('function')
      expect(typeof reportsService.exportToCSV).toBe('function')
      expect(typeof reportsService.getDoctors).toBe('function')
    })
  })
})