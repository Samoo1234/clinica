// Carrega as variáveis de ambiente primeiro
import { env } from './env'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { DatabaseService } from './services/database'
import { supabaseAdmin } from './config/supabase'
import authRoutes from './routes/auth'
import patientRoutes from './routes/patients'
import medicalRecordsRoutes from './routes/medical-records'
import appointmentRoutes from './routes/appointments'
import userRoutes from './routes/users'
import financialRoutes from './routes/financial'
import reportsRoutes from './routes/reports'
import digitalSignatureRoutes from './routes/digital-signature'
import externalIntegrationRoutes from './routes/external-integration'
import nfseRoutes from './routes/nfse'
import notificationRoutes from './routes/notifications'
import securityRoutes from './routes/security'
import { consultationsRouter } from './routes/consultations'
import notificationScheduler from './services/notification-scheduler'

const app = express()
const PORT = env.PORT

// Security middleware
app.use(helmet())
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3003',
    env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// General middleware
app.use(compression())
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await DatabaseService.getHealthInfo()
    const dbTest = await DatabaseService.testConnection()
    
    res.json({ 
      status: 'OK', 
      message: 'VisionCare API is running',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbHealth.connected,
        connectionTest: dbTest,
        stats: {
          tablesCount: dbHealth.tablesCount,
          usersCount: dbHealth.usersCount,
          patientsCount: dbHealth.patientsCount,
          appointmentsCount: dbHealth.appointmentsCount
        }
      }
    })
  } catch (error: any) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Database initialization endpoint
app.get('/api/db/init', async (req, res) => {
  try {
    const result = await DatabaseService.initializeDatabase()
    res.json(result)
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: `Database initialization failed: ${error.message}`
    })
  }
})

// Setup consultations table
app.get('/api/db/setup-consultations', async (req, res) => {
  try {
    // Create consultations table using raw SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS consultations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
        start_time TIMESTAMP WITH TIME ZONE,
        end_time TIMESTAMP WITH TIME ZONE,
        vital_signs JSONB DEFAULT '{}',
        notes TEXT,
        diagnosis TEXT,
        treatment TEXT,
        prescription TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const { error: createError } = await supabaseAdmin.rpc('exec_sql', { sql: createTableSQL })
    if (createError) throw createError

    // Create indexes
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_consultations_appointment_id ON consultations(appointment_id);
      CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations(patient_id);
      CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON consultations(doctor_id);
      CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
      CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON consultations(created_at);
    `

    const { error: indexError } = await supabaseAdmin.rpc('exec_sql', { sql: indexesSQL })
    if (indexError) throw indexError

    res.json({
      success: true,
      message: 'Consultations table and indexes created successfully'
    })
  } catch (error: any) {
    console.error('Setup consultations error:', error)
    res.status(500).json({
      success: false,
      message: `Consultations setup failed: ${error.message}`
    })
  }
})

// Debug endpoint to check users
app.get('/api/debug/users', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at')

    if (error) {
      throw error
    }

    res.json({
      success: true,
      users: data,
      count: data?.length || 0
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/medical-records', medicalRecordsRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/users', userRoutes)
app.use('/api/financial', financialRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/digital-signature', digitalSignatureRoutes)
app.use('/api/external', externalIntegrationRoutes)
app.use('/api/nfse', nfseRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/security', securityRoutes)
app.use('/api/consultations', consultationsRouter)

app.get('/api', (req, res) => {
  res.json({ 
    message: 'VisionCare API v1.0.0',
    endpoints: {
      health: '/health',
      'db-init': '/api/db/init',
      auth: '/api/auth',
      patients: '/api/patients',
      'medical-records': '/api/medical-records',
      appointments: '/api/appointments',
      financial: '/api/financial',
      reports: '/api/reports',
      'digital-signature': '/api/digital-signature',
      'external-integration': '/api/external',
      'nfse': '/api/nfse',
      'notifications': '/api/notifications',
      'security': '/api/security',
      'consultations': '/api/consultations'
    }
  })
})

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`🚀 VisionCare API running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🔗 API docs: http://localhost:${PORT}/api`)
  
  // Start notification scheduler
  notificationScheduler.start()
})