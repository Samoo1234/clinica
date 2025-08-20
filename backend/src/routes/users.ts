import { Router } from 'express'
import { supabaseAdmin } from '../config/supabase'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Apply authentication middleware to all routes
router.use(authMiddleware)

// GET /users/doctors - Get all doctors
router.get('/doctors', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role')
      .eq('role', 'doctor')
      .eq('active', true)
      .order('name')

    if (error) {
      throw new Error(`Error fetching doctors: ${error.message}`)
    }

    res.json(data || [])
  } catch (error) {
    console.error('Error fetching doctors:', error)
    res.status(500).json({ 
      error: 'Failed to fetch doctors',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// GET /users - Get all users
router.get('/', async (req, res) => {
  try {
    const { role } = req.query

    let query = supabaseAdmin
      .from('users')
      .select('id, name, email, role, active, created_at')
      .order('name')

    if (role) {
      query = query.eq('role', role)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error fetching users: ${error.message}`)
    }

    res.json(data || [])
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ 
      error: 'Failed to fetch users',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router