import rateLimit from 'express-rate-limit'
import { Request, Response } from 'express'

// Rate limiter para rotas de API em geral
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // Limite de 100 requisições por minuto por IP
  message: {
    success: false,
    error: 'Muitas requisições. Por favor, tente novamente em alguns instantes.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Muitas requisições. Por favor, tente novamente em alguns instantes.',
      retryAfter: 60
    })
  }
})

// Rate limiter mais restritivo para buscas
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // Limite de 30 buscas por minuto por IP
  message: {
    success: false,
    error: 'Muitas buscas realizadas. Por favor, aguarde alguns instantes.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
})

// Rate limiter para autenticação
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Limite de 5 tentativas de login por 15 minutos
  message: {
    success: false,
    error: 'Muitas tentativas de login. Por favor, tente novamente mais tarde.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
})
