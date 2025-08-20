import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { AuditService } from '../services/audit'
import { SecurityMonitoringService } from '../services/security-monitoring'
import { LGPDComplianceService } from '../services/lgpd-compliance'
import { BackupService } from '../services/backup'
import { EncryptionService } from '../services/encryption'

const router = Router()

// Apply authentication middleware to all routes
router.use(authMiddleware)

// Audit logs endpoints
router.get('/audit-logs', async (req, res) => {
  try {
    const {
      userId,
      action,
      resourceType,
      resourceId,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = req.query

    const result = await AuditService.getAuditLogs({
      userId: userId as string,
      action: action as any,
      resourceType: resourceType as any,
      resourceId: resourceId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    })

    if (result.error) {
      return res.status(400).json({ error: result.error })
    }

    res.json({
      logs: result.logs,
      total: result.total,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: result.total > parseInt(offset as string) + parseInt(limit as string)
      }
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Security monitoring endpoints
router.get('/security-metrics', async (req, res) => {
  try {
    // Only admins can view security metrics
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    const result = await SecurityMonitoringService.getSecurityMetrics()
    
    if (result.error) {
      return res.status(400).json({ error: result.error })
    }

    res.json({ metrics: result.metrics })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/security-alerts', async (req, res) => {
  try {
    // Only admins can view security alerts
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    const {
      status,
      severity,
      alertType,
      limit = 50,
      offset = 0
    } = req.query

    const result = await SecurityMonitoringService.getSecurityAlerts({
      status: status as string,
      severity: severity as any,
      alertType: alertType as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    })

    if (result.error) {
      return res.status(400).json({ error: result.error })
    }

    res.json({
      alerts: result.alerts,
      total: result.total,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: result.total > parseInt(offset as string) + parseInt(limit as string)
      }
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/security-alerts/:id/resolve', async (req, res) => {
  try {
    // Only admins can resolve security alerts
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    const { id } = req.params
    const { resolutionNotes, status = 'RESOLVED' } = req.body

    if (!resolutionNotes) {
      return res.status(400).json({ error: 'Resolution notes are required' })
    }

    const result = await SecurityMonitoringService.resolveAlert(
      id,
      req.user.id,
      resolutionNotes,
      status
    )

    if (!result.success) {
      return res.status(400).json({ error: result.error })
    }

    // Log the resolution
    await AuditService.log({
      user: req.user,
      action: 'UPDATE',
      resourceType: 'SYSTEM',
      resourceId: id,
      metadata: {
        operation: 'RESOLVE_SECURITY_ALERT',
        status,
        resolution_notes: resolutionNotes
      }
    })

    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/monitor-security', async (req, res) => {
  try {
    // Only admins can trigger security monitoring
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    const result = await SecurityMonitoringService.monitorSecurity()
    
    if (result.error) {
      return res.status(400).json({ error: result.error })
    }

    res.json({ 
      alerts: result.alerts,
      message: `Security monitoring completed. Found ${result.alerts.length} new alerts.`
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// LGPD compliance endpoints
router.get('/data-subject-requests', async (req, res) => {
  try {
    // Only admins can view data subject requests
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    const {
      patientId,
      requestType,
      status,
      limit = 50,
      offset = 0
    } = req.query

    const result = await LGPDComplianceService.getDataSubjectRequests({
      patientId: patientId as string,
      requestType: requestType as string,
      status: status as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    })

    if (result.error) {
      return res.status(400).json({ error: result.error })
    }

    res.json({
      requests: result.requests,
      total: result.total,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: result.total > parseInt(offset as string) + parseInt(limit as string)
      }
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/data-subject-requests/access', async (req, res) => {
  try {
    // Only admins can handle data subject requests
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    const { patientId, requestedBy } = req.body

    if (!patientId || !requestedBy) {
      return res.status(400).json({ error: 'Patient ID and requester information are required' })
    }

    const result = await LGPDComplianceService.handleAccessRequest(
      patientId,
      requestedBy,
      req.user
    )

    if (result.error) {
      return res.status(400).json({ error: result.error })
    }

    res.json({ 
      data: result.data,
      message: 'Data access request processed successfully'
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/data-subject-requests/erasure', async (req, res) => {
  try {
    // Only admins can handle erasure requests
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    const { patientId, requestedBy, justification } = req.body

    if (!patientId || !requestedBy) {
      return res.status(400).json({ error: 'Patient ID and requester information are required' })
    }

    const result = await LGPDComplianceService.handleErasureRequest(
      patientId,
      requestedBy,
      req.user,
      justification
    )

    if (!result.success) {
      return res.status(400).json({ error: result.error })
    }

    res.json({ 
      success: true,
      message: 'Data erasure request processed successfully'
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/apply-retention-policies', async (req, res) => {
  try {
    // Only admins can apply retention policies
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    const result = await LGPDComplianceService.applyRetentionPolicies(req.user)

    if (result.error) {
      return res.status(400).json({ error: result.error })
    }

    res.json({
      processed: result.processed,
      anonymized: result.anonymized,
      deleted: result.deleted,
      message: 'Data retention policies applied successfully'
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Backup endpoints
router.get('/backups', async (req, res) => {
  try {
    // Only admins can view backups
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    const {
      status,
      backupType,
      limit = 50,
      offset = 0
    } = req.query

    const result = await BackupService.getBackupHistory({
      status: status as string,
      backupType: backupType as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    })

    if (result.error) {
      return res.status(400).json({ error: result.error })
    }

    res.json({
      backups: result.backups,
      total: result.total,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: result.total > parseInt(offset as string) + parseInt(limit as string)
      }
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/backups/full', async (req, res) => {
  try {
    // Only admins can create backups
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    const { compression = true, encryption = true, retention_days = 30 } = req.body

    const result = await BackupService.createFullBackup(req.user, {
      compression,
      encryption,
      retention_days
    })

    if (result.error) {
      return res.status(400).json({ error: result.error })
    }

    res.json({
      backup: result.result,
      message: 'Full backup created successfully'
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/backups/incremental', async (req, res) => {
  try {
    // Only admins can create backups
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    const { compression = true, encryption = true, retention_days = 30 } = req.body

    const result = await BackupService.createIncrementalBackup(req.user, {
      compression,
      encryption,
      retention_days
    })

    if (result.error) {
      return res.status(400).json({ error: result.error })
    }

    res.json({
      backup: result.result,
      message: 'Incremental backup created successfully'
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/backups/:id/restore', async (req, res) => {
  try {
    // Only admins can restore backups
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    const { id } = req.params
    const { tables, confirmDestruction = false } = req.body

    if (!confirmDestruction) {
      return res.status(400).json({ 
        error: 'Restore operation requires explicit confirmation as it will overwrite existing data',
        requiresConfirmation: true
      })
    }

    const result = await BackupService.restoreFromBackup(id, req.user, {
      tables,
      confirmDestruction
    })

    if (!result.success) {
      return res.status(400).json({ error: result.error })
    }

    res.json({
      success: true,
      message: 'Backup restored successfully'
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Encryption utilities
router.post('/encrypt-data', async (req, res) => {
  try {
    // Only admins can use encryption utilities
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    const { data, type = 'general' } = req.body

    if (!data) {
      return res.status(400).json({ error: 'Data to encrypt is required' })
    }

    let encrypted: string

    switch (type) {
      case 'cpf':
        encrypted = EncryptionService.encryptCPF(data)
        break
      case 'phone':
        encrypted = EncryptionService.encryptPhone(data)
        break
      default:
        encrypted = EncryptionService.encrypt(data)
    }

    // Log encryption operation
    await AuditService.log({
      user: req.user,
      action: 'SYSTEM',
      resourceType: 'SYSTEM',
      metadata: {
        operation: 'DATA_ENCRYPTION',
        data_type: type,
        data_length: data.length
      }
    })

    res.json({ encrypted })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/decrypt-data', async (req, res) => {
  try {
    // Only admins can use decryption utilities
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    const { encryptedData, type = 'general' } = req.body

    if (!encryptedData) {
      return res.status(400).json({ error: 'Encrypted data is required' })
    }

    let decrypted: string

    switch (type) {
      case 'cpf':
        decrypted = EncryptionService.decryptCPF(encryptedData)
        break
      case 'phone':
        decrypted = EncryptionService.decryptPhone(encryptedData)
        break
      default:
        decrypted = EncryptionService.decrypt(encryptedData)
    }

    // Log decryption operation
    await AuditService.log({
      user: req.user,
      action: 'SYSTEM',
      resourceType: 'SYSTEM',
      metadata: {
        operation: 'DATA_DECRYPTION',
        data_type: type
      }
    })

    res.json({ decrypted })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router