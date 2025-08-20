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