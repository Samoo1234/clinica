import { supabaseAdmin } from '../config/supabase'
import { User } from '../types/database'

export interface AuditLog {
  id?: string
  user_id: string
  user_email: string
  user_name: string
  action: string
  resource_type: string
  resource_id?: string
  old_values?: any
  new_values?: any
  ip_address?: string
  user_agent?: string
  session_id?: string
  timestamp: string
  success: boolean
  error_message?: string
  metadata?: any
}

export type AuditAction = 
  | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED'
  | 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
  | 'EXPORT' | 'IMPORT' | 'BACKUP' | 'RESTORE'
  | 'PERMISSION_CHANGE' | 'PASSWORD_CHANGE'
  | 'DATA_ACCESS' | 'SENSITIVE_DATA_ACCESS'
  | 'INTEGRATION_CALL' | 'API_ACCESS'
  | 'FILE_UPLOAD' | 'FILE_DOWNLOAD' | 'FILE_DELETE'
  | 'SYSTEM'

export type ResourceType = 
  | 'USER' | 'PATIENT' | 'MEDICAL_RECORD' | 'APPOINTMENT'
  | 'ATTACHMENT' | 'INVOICE' | 'INTEGRATION_LOG'
  | 'SYSTEM' | 'AUTH' | 'API' | 'FILE'

/**
 * Audit service for comprehensive system logging
 */
export class AuditService {
  /**
   * Log an audit event
   */
  static async log(params: {
    user: User
    action: AuditAction
    resourceType: ResourceType
    resourceId?: string
    oldValues?: any
    newValues?: any
    ipAddress?: string
    userAgent?: string
    sessionId?: string
    success?: boolean
    errorMessage?: string
    metadata?: any
  }): Promise<void> {
    try {
      const auditLog: Omit<AuditLog, 'id'> = {
        user_id: params.user.id,
        user_email: params.user.email,
        user_name: params.user.name,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        old_values: params.oldValues,
        new_values: params.newValues,
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
        session_id: params.sessionId,
        timestamp: new Date().toISOString(),
        success: params.success ?? true,
        error_message: params.errorMessage,
        metadata: params.metadata
      }

      const { error } = await supabaseAdmin
        .from('audit_logs')
        .insert([auditLog])

      if (error) {
        console.error('Failed to log audit event:', error)
        // Don't throw error to avoid breaking the main operation
      }
    } catch (error) {
      console.error('Audit logging error:', error)
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Log authentication events
   */
  static async logAuth(params: {
    email: string
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED'
    ipAddress?: string
    userAgent?: string
    sessionId?: string
    errorMessage?: string
    metadata?: any
  }): Promise<void> {
    try {
      const auditLog: Omit<AuditLog, 'id'> = {
        user_id: '', // Will be empty for failed logins
        user_email: params.email,
        user_name: '',
        action: params.action,
        resource_type: 'AUTH',
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
        session_id: params.sessionId,
        timestamp: new Date().toISOString(),
        success: params.action !== 'LOGIN_FAILED',
        error_message: params.errorMessage,
        metadata: params.metadata
      }

      const { error } = await supabaseAdmin
        .from('audit_logs')
        .insert([auditLog])

      if (error) {
        console.error('Failed to log auth event:', error)
      }
    } catch (error) {
      console.error('Auth audit logging error:', error)
    }
  }

  /**
   * Log sensitive data access
   */
  static async logSensitiveDataAccess(params: {
    user: User
    resourceType: ResourceType
    resourceId: string
    dataFields: string[]
    ipAddress?: string
    userAgent?: string
    purpose?: string
  }): Promise<void> {
    await this.log({
      user: params.user,
      action: 'SENSITIVE_DATA_ACCESS',
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        accessed_fields: params.dataFields,
        purpose: params.purpose,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Log data export events
   */
  static async logDataExport(params: {
    user: User
    exportType: string
    recordCount: number
    filters?: any
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    await this.log({
      user: params.user,
      action: 'EXPORT',
      resourceType: 'SYSTEM',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        export_type: params.exportType,
        record_count: params.recordCount,
        filters: params.filters,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Get audit logs with filtering
   */
  static async getAuditLogs(params: {
    userId?: string
    action?: AuditAction
    resourceType?: ResourceType
    resourceId?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }): Promise<{ logs: AuditLog[], total: number, error?: string }> {
    try {
      let query = supabaseAdmin
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false })

      if (params.userId) {
        query = query.eq('user_id', params.userId)
      }

      if (params.action) {
        query = query.eq('action', params.action)
      }

      if (params.resourceType) {
        query = query.eq('resource_type', params.resourceType)
      }

      if (params.resourceId) {
        query = query.eq('resource_id', params.resourceId)
      }

      if (params.startDate) {
        query = query.gte('timestamp', params.startDate)
      }

      if (params.endDate) {
        query = query.lte('timestamp', params.endDate)
      }

      if (params.limit) {
        query = query.limit(params.limit)
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 50) - 1)
      }

      const { data, error, count } = await query

      if (error) {
        return { logs: [], total: 0, error: error.message }
      }

      return { logs: data || [], total: count || 0 }
    } catch (error: any) {
      return { logs: [], total: 0, error: error.message }
    }
  }

  /**
   * Get security alerts based on audit logs
   */
  static async getSecurityAlerts(params: {
    hours?: number
    limit?: number
  }): Promise<{ alerts: any[], error?: string }> {
    try {
      const hoursAgo = new Date()
      hoursAgo.setHours(hoursAgo.getHours() - (params.hours || 24))

      // Get failed login attempts
      const { data: failedLogins, error: failedError } = await supabaseAdmin
        .from('audit_logs')
        .select('user_email, ip_address')
        .eq('action', 'LOGIN_FAILED')
        .gte('timestamp', hoursAgo.toISOString())
        .limit(params.limit || 50)

      // Get unusual data access patterns
      const { data: dataAccess, error: accessError } = await supabaseAdmin
        .from('audit_logs')
        .select('user_id, user_name, user_email')
        .eq('action', 'SENSITIVE_DATA_ACCESS')
        .gte('timestamp', hoursAgo.toISOString())
        .limit(params.limit || 50)

      const alerts = []

      if (failedLogins && failedLogins.length > 5) {
        alerts.push({
          type: 'MULTIPLE_FAILED_LOGINS',
          severity: 'HIGH',
          description: 'Multiple failed login attempts detected',
          data: failedLogins,
          timestamp: new Date().toISOString()
        })
      }

      if (dataAccess && dataAccess.length > 50) {
        alerts.push({
          type: 'UNUSUAL_DATA_ACCESS',
          severity: 'MEDIUM',
          description: 'Unusual data access patterns detected',
          data: dataAccess,
          timestamp: new Date().toISOString()
        })
      }

      return { alerts }
    } catch (error: any) {
      return { alerts: [], error: error.message }
    }
  }

  /**
   * Clean old audit logs (for LGPD compliance)
   */
  static async cleanOldLogs(retentionDays: number = 2555): Promise<{ deleted: number, error?: string }> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString())
        .select('id')

      if (error) {
        return { deleted: 0, error: error.message }
      }

      return { deleted: data?.length || 0 }
    } catch (error: any) {
      return { deleted: 0, error: error.message }
    }
  }
}