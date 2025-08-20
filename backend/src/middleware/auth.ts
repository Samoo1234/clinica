import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth'
import { User, UserRole } from '../types/database'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and adds user to request
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido'
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Handle mock tokens in development - CHECK THIS FIRST!
    if (token.startsWith('mock-jwt-token-')) {
      const mockUser: User = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'admin@visioncare.com',
        name: 'Dr. Admin',
        role: 'admin',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      req.user = mockUser
      return next()
    }

    // Only call AuthService for real JWT tokens
    const { user, error } = await AuthService.getCurrentUser(token)

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: error || 'Token inválido'
      })
    }

    // Check if user is active
    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Usuário inativo'
      })
    }

    req.user = user
    next()
  } catch (error: any) {
    console.error('Auth middleware error:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    })
  }
}

/**
 * Role-based authorization middleware
 * Requires specific roles to access the route
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissões insuficientes.'
      })
    }

    next()
  }
}

/**
 * Admin only middleware
 */
export const requireAdmin = requireRole(['admin'])

/**
 * Doctor or admin middleware
 */
export const requireDoctorOrAdmin = requireRole(['doctor', 'admin'])

/**
 * Any authenticated user middleware (already covered by authMiddleware)
 */
export const requireAuthenticated = authMiddleware