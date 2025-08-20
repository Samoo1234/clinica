import { Router } from 'express'
import { z } from 'zod'
import { AuthService } from '../services/auth'
import { authMiddleware, requireRole } from '../middleware/auth'

const router = Router()

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
})

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  role: z.enum(['admin', 'doctor', 'receptionist']).optional()
})

const updateRoleSchema = z.object({
  userId: z.string().uuid('ID de usuário inválido'),
  role: z.enum(['admin', 'doctor', 'receptionist'])
})

/**
 * POST /api/auth/login
 * Sign in user with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const result = await AuthService.signIn({ email, password })

    if (result.error) {
      return res.status(401).json({
        success: false,
        message: result.error
      })
    }

    res.json({
      success: true,
      data: {
        user: result.user,
        session: result.session
      }
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      })
    }

    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    })
  }
})

/**
 * POST /api/auth/register
 * Register new user (admin only)
 */
router.post('/register', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const userData = registerSchema.parse(req.body)

    const result = await AuthService.signUp(userData)

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error
      })
    }

    res.status(201).json({
      success: true,
      data: {
        user: result.user
      }
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      })
    }

    console.error('Register error:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    })
  }
})

/**
 * POST /api/auth/logout
 * Sign out current user
 */
router.post('/logout', async (req, res) => {
  try {
    const result = await AuthService.signOut()

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error
      })
    }

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    })
  } catch (error: any) {
    console.error('Logout error:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    })
  }
})

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  })
})

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token é obrigatório'
      })
    }

    const result = await AuthService.refreshToken(refreshToken)

    if (result.error) {
      return res.status(401).json({
        success: false,
        message: result.error
      })
    }

    res.json({
      success: true,
      data: {
        user: result.user,
        session: result.session
      }
    })
  } catch (error: any) {
    console.error('Refresh token error:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    })
  }
})

/**
 * PUT /api/auth/users/:userId/role
 * Update user role (admin only)
 */
router.put('/users/:userId/role', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params
    const { role } = updateRoleSchema.parse({ userId, ...req.body })

    const result = await AuthService.updateUserRole(userId, role)

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error
      })
    }

    res.json({
      success: true,
      message: 'Role do usuário atualizada com sucesso'
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      })
    }

    console.error('Update role error:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    })
  }
})

/**
 * GET /api/auth/users
 * Get all users (admin only)
 */
router.get('/users', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const result = await AuthService.getAllUsers()

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error
      })
    }

    res.json({
      success: true,
      data: {
        users: result.users
      }
    })
  } catch (error: any) {
    console.error('Get users error:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    })
  }
})

export default router