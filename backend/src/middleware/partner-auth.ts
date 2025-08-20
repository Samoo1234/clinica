import { Request, Response, NextFunction } from 'express'
import { externalIntegrationService } from '../services/external-integration'
import { ExternalPartner } from '../types/database'

// Extend Request interface to include partner
declare global {
  namespace Express {
    interface Request {
      partner?: ExternalPartner
    }
  }
}

export const authenticatePartner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string
    const apiSecret = req.headers['x-api-secret'] as string

    if (!apiKey || !apiSecret) {
      res.status(401).json({
        error: 'Missing API credentials',
        message: 'Both X-API-Key and X-API-Secret headers are required'
      })
      return
    }

    const partner = await externalIntegrationService.authenticatePartner(apiKey, apiSecret)

    if (!partner) {
      // Log failed authentication attempt
      await externalIntegrationService.logPartnerAccess({
        partner_id: 'unknown',
        operation: 'authentication',
        endpoint: req.path,
        request_data: { api_key: apiKey },
        response_data: { error: 'Invalid credentials' },
        status_code: 401,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        success: false,
        error_message: 'Invalid API credentials'
      })

      res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid API key or secret'
      })
      return
    }

    // Check if partner is active
    if (partner.status !== 'active') {
      await externalIntegrationService.logPartnerAccess({
        partner_id: partner.id,
        operation: 'authentication',
        endpoint: req.path,
        request_data: { api_key: apiKey },
        response_data: { error: 'Partner inactive' },
        status_code: 403,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        success: false,
        error_message: `Partner status: ${partner.status}`
      })

      res.status(403).json({
        error: 'Partner inactive',
        message: `Partner account is ${partner.status}`
      })
      return
    }

    // Attach partner to request
    req.partner = partner
    next()
  } catch (error) {
    console.error('Partner authentication error:', error)
    res.status(500).json({
      error: 'Authentication error',
      message: 'Internal server error during authentication'
    })
  }
}

export const requirePartnerPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.partner) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Partner authentication required'
        })
        return
      }

      const hasPermission = await externalIntegrationService.validatePartnerPermission(
        req.partner.id,
        permission
      )

      if (!hasPermission) {
        await externalIntegrationService.logPartnerAccess({
          partner_id: req.partner.id,
          operation: 'permission_check',
          endpoint: req.path,
          request_data: { required_permission: permission },
          response_data: { error: 'Insufficient permissions' },
          status_code: 403,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          success: false,
          error_message: `Missing permission: ${permission}`
        })

        res.status(403).json({
          error: 'Insufficient permissions',
          message: `This operation requires the '${permission}' permission`
        })
        return
      }

      next()
    } catch (error) {
      console.error('Permission check error:', error)
      res.status(500).json({
        error: 'Permission error',
        message: 'Internal server error during permission check'
      })
    }
  }
}

export const logPartnerRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.partner) {
    next()
    return
  }

  const originalSend = res.send
  let responseData: any = {}

  // Capture response data
  res.send = function(data: any) {
    try {
      responseData = typeof data === 'string' ? JSON.parse(data) : data
    } catch {
      responseData = { response: data }
    }
    return originalSend.call(this, data)
  }

  // Log after response is sent
  res.on('finish', async () => {
    try {
      await externalIntegrationService.logPartnerAccess({
        partner_id: req.partner!.id,
        patient_id: req.params.patientId || req.body.patient_id,
        operation: `${req.method} ${req.route?.path || req.path}`,
        endpoint: req.path,
        request_data: {
          params: req.params,
          query: req.query,
          body: req.body
        },
        response_data: responseData,
        status_code: res.statusCode,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        success: res.statusCode < 400
      })
    } catch (error) {
      console.error('Failed to log partner request:', error)
    }
  })

  next()
}