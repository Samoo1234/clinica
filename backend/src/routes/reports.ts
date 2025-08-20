import { Router } from 'express'
import { reportsService, ReportFilters } from '../services/reports'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Apply authentication middleware to all routes
router.use(authMiddleware)

// Get dashboard KPIs
router.get('/dashboard/kpis', async (req, res) => {
  try {
    const kpis = await reportsService.getDashboardKPIs()
    res.json(kpis)
  } catch (error) {
    console.error('Error fetching dashboard KPIs:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard KPIs' })
  }
})

// Get appointment report
router.get('/appointments', async (req, res) => {
  try {
    const filters: ReportFilters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      doctorId: req.query.doctorId as string,
      status: req.query.status as string
    }

    const report = await reportsService.getAppointmentReport(filters)
    res.json(report)
  } catch (error) {
    console.error('Error fetching appointment report:', error)
    res.status(500).json({ error: 'Failed to fetch appointment report' })
  }
})

// Get financial report
router.get('/financial', async (req, res) => {
  try {
    const filters: ReportFilters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      groupBy: (req.query.groupBy as 'day' | 'week' | 'month') || 'month'
    }

    const report = await reportsService.getFinancialReport(filters)
    res.json(report)
  } catch (error) {
    console.error('Error fetching financial report:', error)
    res.status(500).json({ error: 'Failed to fetch financial report' })
  }
})

// Get doctor performance report
router.get('/doctors/performance', async (req, res) => {
  try {
    const filters: ReportFilters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      doctorId: req.query.doctorId as string
    }

    const report = await reportsService.getDoctorPerformanceReport(filters)
    res.json(report)
  } catch (error) {
    console.error('Error fetching doctor performance report:', error)
    res.status(500).json({ error: 'Failed to fetch doctor performance report' })
  }
})

// Get consultation types report
router.get('/consultations/types', async (req, res) => {
  try {
    const filters: ReportFilters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    }

    const report = await reportsService.getConsultationTypesReport(filters)
    res.json(report)
  } catch (error) {
    console.error('Error fetching consultation types report:', error)
    res.status(500).json({ error: 'Failed to fetch consultation types report' })
  }
})

// Get appointment statistics
router.get('/stats/appointments', async (req, res) => {
  try {
    const filters: ReportFilters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      doctorId: req.query.doctorId as string
    }

    const stats = await reportsService.getAppointmentStats(filters)
    res.json(stats)
  } catch (error) {
    console.error('Error fetching appointment stats:', error)
    res.status(500).json({ error: 'Failed to fetch appointment statistics' })
  }
})

// Get financial summary
router.get('/stats/financial', async (req, res) => {
  try {
    const filters: ReportFilters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    }

    const summary = await reportsService.getFinancialSummary(filters)
    res.json(summary)
  } catch (error) {
    console.error('Error fetching financial summary:', error)
    res.status(500).json({ error: 'Failed to fetch financial summary' })
  }
})

// Get monthly KPIs
router.get('/stats/monthly', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 12
    const kpis = await reportsService.getMonthlyKPIs(limit)
    res.json(kpis)
  } catch (error) {
    console.error('Error fetching monthly KPIs:', error)
    res.status(500).json({ error: 'Failed to fetch monthly KPIs' })
  }
})

// Get available doctors for filtering
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await reportsService.getDoctors()
    res.json(doctors)
  } catch (error) {
    console.error('Error fetching doctors:', error)
    res.status(500).json({ error: 'Failed to fetch doctors' })
  }
})

// Export appointment report as CSV
router.get('/appointments/export', async (req, res) => {
  try {
    const filters: ReportFilters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      doctorId: req.query.doctorId as string,
      status: req.query.status as string
    }

    const report = await reportsService.getAppointmentReport(filters)
    const csv = reportsService.exportToCSV(report, 'appointment-report')
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio-consultas.csv"')
    res.send(csv)
  } catch (error) {
    console.error('Error exporting appointment report:', error)
    res.status(500).json({ error: 'Failed to export appointment report' })
  }
})

// Export financial report as CSV
router.get('/financial/export', async (req, res) => {
  try {
    const filters: ReportFilters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      groupBy: (req.query.groupBy as 'day' | 'week' | 'month') || 'month'
    }

    const report = await reportsService.getFinancialReport(filters)
    const csv = reportsService.exportToCSV(report, 'financial-report')
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio-financeiro.csv"')
    res.send(csv)
  } catch (error) {
    console.error('Error exporting financial report:', error)
    res.status(500).json({ error: 'Failed to export financial report' })
  }
})

// Export doctor performance report as CSV
router.get('/doctors/performance/export', async (req, res) => {
  try {
    const filters: ReportFilters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      doctorId: req.query.doctorId as string
    }

    const report = await reportsService.getDoctorPerformanceReport(filters)
    const csv = reportsService.exportToCSV(report, 'doctor-performance-report')
    
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio-desempenho-medicos.csv"')
    res.send(csv)
  } catch (error) {
    console.error('Error exporting doctor performance report:', error)
    res.status(500).json({ error: 'Failed to export doctor performance report' })
  }
})

// Get comprehensive report summary
router.get('/summary', async (req, res) => {
  try {
    const filters: ReportFilters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      doctorId: req.query.doctorId as string
    }

    const summary = await reportsService.getReportSummary(filters)
    res.json(summary)
  } catch (error) {
    console.error('Error fetching report summary:', error)
    res.status(500).json({ error: 'Failed to fetch report summary' })
  }
})

export default router