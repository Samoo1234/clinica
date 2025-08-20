import { supabaseAdmin } from '../config/supabase'
import { AuditService } from './audit'
import { User } from '../types/database'

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

/**
 * Security monitoring service for threat detection and alerting
 */
export class SecurityMonitoringService {
  private static readonly ALERT_THRESHOLDS = {
    FAILED_LOGINS_PER_IP: 5,
    FAILED_LOGINS_PER_USER: 3,
    SENSITIVE_DATA_ACCESS_PER_USER: 50,
    API_CALLS_PER_USER: 1000,
    DATA_EXPORTS_PER_USER: 5,
    UNUSUAL_LOGIN_HOURS: [22, 23, 0, 1, 2, 3, 4, 5], // 10 PM to 5 AM
    MAX_SESSION_DURATION: 8 * 60 * 60 * 1000 // 8 hours
  }

  /**
   * Monitor and generate security alerts
   */
  static async monitorSecurity(): Promise<{ alerts: SecurityAlert[], error?: string }> {
    try {
      const alerts: SecurityAlert[] = []
      const now = new Date()
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      // Check for multiple failed logins from same IP
      const ipFailedLogins = await this.checkFailedLoginsByIP(last24Hours)
      alerts.push(...ipFailedLogins)

      // Check for multiple failed logins for same user
      const userFailedLogins = await this.checkFailedLoginsByUser(last24Hours)
      alerts.push(...userFailedLogins)

      // Check for unusual data access patterns
      const unusualDataAccess = await this.checkUnusualDataAccess(last24Hours)
      alerts.push(...unusualDataAccess)

      // Check for unusual login times
      const unusualLogins = await this.checkUnusualLoginTimes(last24Hours)
      alerts.push(...unusualLogins)

      // Check for excessive API usage
      const excessiveAPI = await this.checkExcessiveAPIUsage(last24Hours)
      alerts.push(...excessiveAPI)

      // Check for multiple data exports
      const excessiveExports = await this.checkExcessiveDataExports(last24Hours)
      alerts.push(...excessiveExports)

      // Save new alerts to database
      for (const alert of alerts) {
        await this.saveAlert(alert)
      }

      return { alerts }
    } catch (error: any) {
      return { alerts: [], error: error.message }
    }
  }

  /**
   * Check for failed logins from same IP
   */
  private static async checkFailedLoginsByIP(since: Date): Promise<SecurityAlert[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .select('ip_address')
        .eq('action', 'LOGIN_FAILED')
        .gte('timestamp', since.toISOString())
        .not('ip_address', 'is', null)

      if (error || !data) return []

      // Group by IP address manually
      const ipCounts: Record<string, number> = {}
      data.forEach((item: any) => {
        if (item.ip_address) {
          ipCounts[item.ip_address] = (ipCounts[item.ip_address] || 0) + 1
        }
      })

      const alerts: SecurityAlert[] = []
      Object.entries(ipCounts).forEach(([ip, count]) => {
        if (count >= this.ALERT_THRESHOLDS.FAILED_LOGINS_PER_IP) {
          alerts.push({
            alert_type: 'MULTIPLE_FAILED_LOGINS_IP',
            severity: 'HIGH' as const,
            title: 'Multiple Failed Login Attempts from IP',
            description: `${count} failed login attempts from IP ${ip} in the last 24 hours`,
            ip_address: ip,
            metadata: { failed_attempts: count, threshold: this.ALERT_THRESHOLDS.FAILED_LOGINS_PER_IP },
            status: 'ACTIVE' as const,
            created_at: new Date().toISOString()
          })
        }
      })

      return alerts
    } catch (error) {
      console.error('Error checking failed logins by IP:', error)
      return []
    }
  }

  /**
   * Check for failed logins for same user
   */
  private static async checkFailedLoginsByUser(since: Date): Promise<SecurityAlert[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .select('user_email')
        .eq('action', 'LOGIN_FAILED')
        .gte('timestamp', since.toISOString())
        .not('user_email', 'is', null)

      if (error || !data) return []

      // Group by user email manually
      const userCounts: Record<string, number> = {}
      data.forEach((item: any) => {
        if (item.user_email) {
          userCounts[item.user_email] = (userCounts[item.user_email] || 0) + 1
        }
      })

      const alerts: SecurityAlert[] = []
      Object.entries(userCounts).forEach(([email, count]) => {
        if (count >= this.ALERT_THRESHOLDS.FAILED_LOGINS_PER_USER) {
          alerts.push({
            alert_type: 'MULTIPLE_FAILED_LOGINS_USER',
            severity: 'MEDIUM' as const,
            title: 'Multiple Failed Login Attempts for User',
            description: `${count} failed login attempts for user ${email} in the last 24 hours`,
            metadata: { 
              user_email: email, 
              failed_attempts: count, 
              threshold: this.ALERT_THRESHOLDS.FAILED_LOGINS_PER_USER 
            },
            status: 'ACTIVE' as const,
            created_at: new Date().toISOString()
          })
        }
      })

      return alerts
    } catch (error) {
      console.error('Error checking failed logins by user:', error)
      return []
    }
  }

  /**
   * Check for unusual data access patterns
   */
  private static async checkUnusualDataAccess(since: Date): Promise<SecurityAlert[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .select('user_id, user_name, user_email')
        .eq('action', 'SENSITIVE_DATA_ACCESS')
        .gte('timestamp', since.toISOString())
        .not('user_id', 'is', null)

      if (error || !data) return []

      // Group by user manually
      const userCounts: Record<string, { count: number, user_name: string, user_email: string }> = {}
      data.forEach((item: any) => {
        if (item.user_id) {
          if (!userCounts[item.user_id]) {
            userCounts[item.user_id] = { count: 0, user_name: item.user_name, user_email: item.user_email }
          }
          userCounts[item.user_id].count++
        }
      })

      const alerts: SecurityAlert[] = []
      Object.entries(userCounts).forEach(([userId, userData]) => {
        if (userData.count >= this.ALERT_THRESHOLDS.SENSITIVE_DATA_ACCESS_PER_USER) {
          alerts.push({
            alert_type: 'UNUSUAL_DATA_ACCESS',
            severity: 'MEDIUM' as const,
            title: 'Unusual Data Access Pattern',
            description: `User ${userData.user_name} (${userData.user_email}) accessed sensitive data ${userData.count} times in the last 24 hours`,
            user_id: userId,
            metadata: { 
              access_count: userData.count, 
              threshold: this.ALERT_THRESHOLDS.SENSITIVE_DATA_ACCESS_PER_USER 
            },
            status: 'ACTIVE' as const,
            created_at: new Date().toISOString()
          })
        }
      })

      return alerts
    } catch (error) {
      console.error('Error checking unusual data access:', error)
      return []
    }
  }

  /**
   * Check for logins at unusual hours
   */
  private static async checkUnusualLoginTimes(since: Date): Promise<SecurityAlert[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .select('user_id, user_name, user_email, timestamp, ip_address')
        .eq('action', 'LOGIN')
        .gte('timestamp', since.toISOString())
        .not('user_id', 'is', null)

      if (error || !data) return []

      const unusualLogins = data.filter(login => {
        const hour = new Date(login.timestamp).getHours()
        return this.ALERT_THRESHOLDS.UNUSUAL_LOGIN_HOURS.includes(hour)
      })

      if (unusualLogins.length === 0) return []

      // Group by user
      const userLogins = unusualLogins.reduce((acc, login) => {
        const key = login.user_id
        if (!acc[key]) {
          acc[key] = {
            user_id: login.user_id,
            user_name: login.user_name,
            user_email: login.user_email,
            logins: []
          }
        }
        acc[key].logins.push({
          timestamp: login.timestamp,
          ip_address: login.ip_address
        })
        return acc
      }, {} as any)

      return Object.values(userLogins).map((user: any) => ({
        alert_type: 'UNUSUAL_LOGIN_TIME',
        severity: 'LOW' as const,
        title: 'Login at Unusual Hours',
        description: `User ${user.user_name} (${user.user_email}) logged in ${user.logins.length} times during unusual hours (10 PM - 5 AM)`,
        user_id: user.user_id,
        metadata: { unusual_logins: user.logins },
        status: 'ACTIVE' as const,
        created_at: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error checking unusual login times:', error)
      return []
    }
  }

  /**
   * Check for excessive API usage
   */
  private static async checkExcessiveAPIUsage(since: Date): Promise<SecurityAlert[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .select('user_id, user_name, user_email')
        .eq('action', 'API_ACCESS')
        .gte('timestamp', since.toISOString())
        .not('user_id', 'is', null)

      if (error || !data) return []

      // Group by user manually
      const userCounts: Record<string, { count: number, user_name: string, user_email: string }> = {}
      data.forEach((item: any) => {
        if (item.user_id) {
          if (!userCounts[item.user_id]) {
            userCounts[item.user_id] = { count: 0, user_name: item.user_name, user_email: item.user_email }
          }
          userCounts[item.user_id].count++
        }
      })

      const alerts: SecurityAlert[] = []
      Object.entries(userCounts).forEach(([userId, userData]) => {
        if (userData.count >= this.ALERT_THRESHOLDS.API_CALLS_PER_USER) {
          alerts.push({
            alert_type: 'EXCESSIVE_API_USAGE',
            severity: 'MEDIUM' as const,
            title: 'Excessive API Usage',
            description: `User ${userData.user_name} (${userData.user_email}) made ${userData.count} API calls in the last 24 hours`,
            user_id: userId,
            metadata: { 
              api_calls: userData.count, 
              threshold: this.ALERT_THRESHOLDS.API_CALLS_PER_USER 
            },
            status: 'ACTIVE' as const,
            created_at: new Date().toISOString()
          })
        }
      })

      return alerts
    } catch (error) {
      console.error('Error checking excessive API usage:', error)
      return []
    }
  }

  /**
   * Check for excessive data exports
   */
  private static async checkExcessiveDataExports(since: Date): Promise<SecurityAlert[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .select('user_id, user_name, user_email')
        .eq('action', 'EXPORT')
        .gte('timestamp', since.toISOString())
        .not('user_id', 'is', null)

      if (error || !data) return []

      // Group by user manually
      const userCounts: Record<string, { count: number, user_name: string, user_email: string }> = {}
      data.forEach((item: any) => {
        if (item.user_id) {
          if (!userCounts[item.user_id]) {
            userCounts[item.user_id] = { count: 0, user_name: item.user_name, user_email: item.user_email }
          }
          userCounts[item.user_id].count++
        }
      })

      const alerts: SecurityAlert[] = []
      Object.entries(userCounts).forEach(([userId, userData]) => {
        if (userData.count >= this.ALERT_THRESHOLDS.DATA_EXPORTS_PER_USER) {
          alerts.push({
            alert_type: 'EXCESSIVE_DATA_EXPORTS',
            severity: 'HIGH' as const,
            title: 'Excessive Data Exports',
            description: `User ${userData.user_name} (${userData.user_email}) exported data ${userData.count} times in the last 24 hours`,
            user_id: userId,
            metadata: { 
              export_count: userData.count, 
              threshold: this.ALERT_THRESHOLDS.DATA_EXPORTS_PER_USER 
            },
            status: 'ACTIVE' as const,
            created_at: new Date().toISOString()
          })
        }
      })

      return alerts
    } catch (error) {
      console.error('Error checking excessive data exports:', error)
      return []
    }
  }

  /**
   * Save security alert to database
   */
  private static async saveAlert(alert: SecurityAlert): Promise<void> {
    try {
      // Check if similar alert already exists and is active
      const { data: existingAlert } = await supabaseAdmin
        .from('security_alerts')
        .select('id')
        .eq('alert_type', alert.alert_type)
        .eq('status', 'ACTIVE')
        .eq('user_id', alert.user_id || '')
        .eq('ip_address', alert.ip_address || '')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .single()

      if (existingAlert) {
        // Don't create duplicate alert
        return
      }

      await supabaseAdmin
        .from('security_alerts')
        .insert([alert])
    } catch (error) {
      console.error('Error saving security alert:', error)
    }
  }

  /**
   * Get security metrics
   */
  static async getSecurityMetrics(): Promise<{ metrics: SecurityMetrics, error?: string }> {
    try {
      const now = new Date()
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      // Get various metrics in parallel
      const [
        failedLogins,
        successfulLogins,
        sensitiveDataAccess,
        apiCalls,
        uniqueUsers,
        activeAlerts,
        dataExports
      ] = await Promise.all([
        this.getMetricCount('LOGIN_FAILED', last24Hours),
        this.getMetricCount('LOGIN', last24Hours),
        this.getMetricCount('SENSITIVE_DATA_ACCESS', last24Hours),
        this.getMetricCount('API_ACCESS', last24Hours),
        this.getUniqueUsersCount(last24Hours),
        this.getActiveAlertsCount(),
        this.getMetricCount('EXPORT', last24Hours)
      ])

      // Calculate unusual activity score (0-100)
      const unusualActivityScore = this.calculateUnusualActivityScore({
        failedLogins,
        sensitiveDataAccess,
        apiCalls,
        dataExports,
        activeAlerts
      })

      const metrics: SecurityMetrics = {
        failed_logins_24h: failedLogins,
        successful_logins_24h: successfulLogins,
        sensitive_data_access_24h: sensitiveDataAccess,
        api_calls_24h: apiCalls,
        unique_users_24h: uniqueUsers,
        security_alerts_active: activeAlerts,
        data_exports_24h: dataExports,
        unusual_activity_score: unusualActivityScore
      }

      return { metrics }
    } catch (error: any) {
      return { 
        metrics: {
          failed_logins_24h: 0,
          successful_logins_24h: 0,
          sensitive_data_access_24h: 0,
          api_calls_24h: 0,
          unique_users_24h: 0,
          security_alerts_active: 0,
          data_exports_24h: 0,
          unusual_activity_score: 0
        }, 
        error: error.message 
      }
    }
  }

  /**
   * Get count for specific metric
   */
  private static async getMetricCount(action: string, since: Date): Promise<number> {
    try {
      const { count, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action', action)
        .gte('timestamp', since.toISOString())

      return error ? 0 : (count || 0)
    } catch (error) {
      return 0
    }
  }

  /**
   * Get unique users count
   */
  private static async getUniqueUsersCount(since: Date): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .select('user_id')
        .gte('timestamp', since.toISOString())
        .not('user_id', 'is', null)

      if (error || !data) return 0

      const uniqueUsers = new Set(data.map(item => item.user_id))
      return uniqueUsers.size
    } catch (error) {
      return 0
    }
  }

  /**
   * Get active alerts count
   */
  private static async getActiveAlertsCount(): Promise<number> {
    try {
      const { count, error } = await supabaseAdmin
        .from('security_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE')

      return error ? 0 : (count || 0)
    } catch (error) {
      return 0
    }
  }

  /**
   * Calculate unusual activity score
   */
  private static calculateUnusualActivityScore(metrics: {
    failedLogins: number
    sensitiveDataAccess: number
    apiCalls: number
    dataExports: number
    activeAlerts: number
  }): number {
    let score = 0

    // Failed logins (0-30 points)
    score += Math.min(30, (metrics.failedLogins / 10) * 30)

    // Sensitive data access (0-25 points)
    score += Math.min(25, (metrics.sensitiveDataAccess / 100) * 25)

    // API calls (0-20 points)
    score += Math.min(20, (metrics.apiCalls / 1000) * 20)

    // Data exports (0-15 points)
    score += Math.min(15, (metrics.dataExports / 5) * 15)

    // Active alerts (0-10 points)
    score += Math.min(10, metrics.activeAlerts * 2)

    return Math.round(score)
  }

  /**
   * Get security alerts
   */
  static async getSecurityAlerts(params: {
    status?: string
    severity?: string
    alertType?: string
    limit?: number
    offset?: number
  }): Promise<{ alerts: SecurityAlert[], total: number, error?: string }> {
    try {
      let query = supabaseAdmin
        .from('security_alerts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (params.status) {
        query = query.eq('status', params.status)
      }

      if (params.severity) {
        query = query.eq('severity', params.severity)
      }

      if (params.alertType) {
        query = query.eq('alert_type', params.alertType)
      }

      if (params.limit) {
        query = query.limit(params.limit)
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 50) - 1)
      }

      const { data, error, count } = await query

      if (error) {
        return { alerts: [], total: 0, error: error.message }
      }

      return { alerts: data || [], total: count || 0 }
    } catch (error: any) {
      return { alerts: [], total: 0, error: error.message }
    }
  }

  /**
   * Resolve security alert
   */
  static async resolveAlert(
    alertId: string, 
    resolvedBy: string, 
    resolutionNotes: string,
    status: 'RESOLVED' | 'FALSE_POSITIVE' = 'RESOLVED'
  ): Promise<{ success: boolean, error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('security_alerts')
        .update({
          status,
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy,
          resolution_notes: resolutionNotes
        })
        .eq('id', alertId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}