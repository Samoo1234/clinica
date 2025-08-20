import { api } from '../utils/api'

export interface SecurityMetrics {
  failed_logins_24h: number
  successful_logins_24h: number
  sensitive_data_access_24h: number
  api_calls_24h: number
  unique_users_24h: number
  security_alerts_active: number
  data_exports_24h: number
  unusual_activity_score: number
}

export interface SecurityAlert {
  id?: string
  alert_type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  user_id?: string
  ip_address?: string
  user_agent?: string
  metadata?: any
  status: 'ACTIVE' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE'
  created_at: string
  resolved_at?: string
  resolved_by?: string
  resolution_notes?: string
}

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

export interface BackupResult {
  id: string
  backup_type: string
  status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS'
  file_path?: string
  file_size?: number
  checksum?: string
  encryption_key_id?: string
  started_at: string
  completed_at?: string
  error_message?: string
  metadata?: any
}

export interface DataSubjectRequest {
  id?: string
  patient_id: string
  request_type: 'ACCESS' | 'RECTIFICATION' | 'ERASURE' | 'PORTABILITY' | 'RESTRICTION'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
  requested_by: string
  requested_at: string
  completed_at?: string
  notes?: string
  data_provided?: any
}

class SecurityService {
  // Security Metrics
  async getSecurityMetrics(): Promise<{ metrics: SecurityMetrics }> {
    const response = await api.get('/security/security-metrics')
    return response as { metrics: SecurityMetrics }
  }

  // Security Alerts
  async getSecurityAlerts(_params: {
    status?: string
    severity?: string
    alertType?: string
    limit?: number
    offset?: number
  } = {}): Promise<{ alerts: SecurityAlert[], total: number }> {
    const response = await api.get('/security/security-alerts')
    return response as { alerts: SecurityAlert[], total: number }
  }

  async resolveAlert(alertId: string, resolutionNotes: string, status: 'RESOLVED' | 'FALSE_POSITIVE' = 'RESOLVED'): Promise<{ success: boolean }> {
    const response = await api.post(`/security/security-alerts/${alertId}/resolve`, {
      resolutionNotes,
      status
    })
    return response as { success: boolean }
  }

  async monitorSecurity(): Promise<{ alerts: SecurityAlert[], message: string }> {
    const response = await api.post('/security/monitor-security')
    return response as { alerts: SecurityAlert[], message: string }
  }

  // Audit Logs
  async getAuditLogs(_params: {
    userId?: string
    action?: string
    resourceType?: string
    resourceId?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  } = {}): Promise<{ logs: AuditLog[], total: number }> {
    const response = await api.get('/security/audit-logs')
    return response as { logs: AuditLog[], total: number }
  }

  // LGPD Compliance
  async getDataSubjectRequests(_params: {
    patientId?: string
    requestType?: string
    status?: string
    limit?: number
    offset?: number
  } = {}): Promise<{ requests: DataSubjectRequest[], total: number }> {
    const response = await api.get('/security/data-subject-requests')
    return response as { requests: DataSubjectRequest[], total: number }
  }

  async handleAccessRequest(patientId: string, requestedBy: string): Promise<{ data: any, message: string }> {
    const response = await api.post('/security/data-subject-requests/access', {
      patientId,
      requestedBy
    })
    return response as { data: any, message: string }
  }

  async handleErasureRequest(patientId: string, requestedBy: string, justification?: string): Promise<{ success: boolean, message: string }> {
    const response = await api.post('/security/data-subject-requests/erasure', {
      patientId,
      requestedBy,
      justification
    })
    return response as { success: boolean, message: string }
  }

  async applyRetentionPolicies(): Promise<{ processed: number, anonymized: number, deleted: number, message: string }> {
    const response = await api.post('/security/apply-retention-policies')
    return response as { processed: number, anonymized: number, deleted: number, message: string }
  }

  // Backups
  async getBackupHistory(_params: {
    status?: string
    backupType?: string
    limit?: number
    offset?: number
  } = {}): Promise<{ backups: BackupResult[], total: number }> {
    const response = await api.get('/security/backups')
    return response as { backups: BackupResult[], total: number }
  }

  async createFullBackup(options: {
    compression?: boolean
    encryption?: boolean
    retention_days?: number
  } = {}): Promise<{ backup: BackupResult, message: string }> {
    const response = await api.post('/security/backups/full', options)
    return response as { backup: BackupResult, message: string }
  }

  async createIncrementalBackup(options: {
    compression?: boolean
    encryption?: boolean
    retention_days?: number
  } = {}): Promise<{ backup: BackupResult, message: string }> {
    const response = await api.post('/security/backups/incremental', options)
    return response as { backup: BackupResult, message: string }
  }

  async restoreBackup(backupId: string, options: {
    tables?: string[]
    confirmDestruction: boolean
  }): Promise<{ success: boolean, message: string }> {
    const response = await api.post(`/security/backups/${backupId}/restore`, options)
    return response as { success: boolean, message: string }
  }

  // Encryption Utilities
  async encryptData(data: string, type: 'general' | 'cpf' | 'phone' = 'general'): Promise<{ encrypted: string }> {
    const response = await api.post('/security/encrypt-data', { data, type })
    return response as { encrypted: string }
  }

  async decryptData(encryptedData: string, type: 'general' | 'cpf' | 'phone' = 'general'): Promise<{ decrypted: string }> {
    const response = await api.post('/security/decrypt-data', { encryptedData, type })
    return response as { decrypted: string }
  }
}

export const securityService = new SecurityService()