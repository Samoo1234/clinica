import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { EncryptionService } from '../services/encryption'
import { AuditService } from '../services/audit'
import { SecurityMonitoringService } from '../services/security-monitoring'
import { LGPDComplianceService } from '../services/lgpd-compliance'
import { BackupService } from '../services/backup'
import { supabaseAdmin } from '../config/supabase'
import { User } from '../types/database'

// Mock user for testing
const mockUser: User = {
  id: 'test-user-id',
  email: 'test@visioncare.com',
  name: 'Test User',
  role: 'admin',
  active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// Mock patient for testing
const mockPatient = {
  id: 'test-patient-id',
  cpf: '12345678901',
  name: 'Test Patient',
  birth_date: '1990-01-01',
  phone: '11999999999',
  email: 'patient@test.com'
}

describe('Security Services', () => {
  beforeAll(async () => {
    // Set up test environment
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters-long'
  })

  afterAll(async () => {
    // Clean up test data
    try {
      await supabaseAdmin.from('audit_logs').delete().ilike('user_email', '%test%')
      await supabaseAdmin.from('security_alerts').delete().ilike('title', '%test%')
      await supabaseAdmin.from('data_subject_requests').delete().eq('requested_by', 'test@example.com')
      await supabaseAdmin.from('backup_logs').delete().ilike('metadata->user_id', '%test%')
    } catch (error) {
      console.log('Cleanup error (expected in test environment):', error)
    }
  })

  describe('EncryptionService', () => {
    it('should encrypt and decrypt data correctly', () => {
      const originalData = 'sensitive patient information'
      
      const encrypted = EncryptionService.encrypt(originalData)
      expect(encrypted).toBeDefined()
      expect(encrypted).not.toBe(originalData)
      
      const decrypted = EncryptionService.decrypt(encrypted)
      expect(decrypted).toBe(originalData)
    })

    it('should encrypt and decrypt CPF correctly', () => {
      const cpf = '123.456.789-01'
      
      const encrypted = EncryptionService.encryptCPF(cpf)
      expect(encrypted).toBeDefined()
      expect(encrypted).not.toBe(cpf)
      
      const decrypted = EncryptionService.decryptCPF(encrypted)
      expect(decrypted).toBe(cpf)
    })

    it('should encrypt and decrypt phone numbers correctly', () => {
      const phone = '(11) 99999-9999'
      
      const encrypted = EncryptionService.encryptPhone(phone)
      expect(encrypted).toBeDefined()
      expect(encrypted).not.toBe(phone)
      
      const decrypted = EncryptionService.decryptPhone(encrypted)
      expect(decrypted).toBe(phone)
    })

    it('should hash and verify passwords correctly', () => {
      const password = 'secure-password-123'
      
      const hashed = EncryptionService.hash(password)
      expect(hashed).toBeDefined()
      expect(hashed).not.toBe(password)
      expect(hashed).toContain(':')
      
      const isValid = EncryptionService.verifyHash(password, hashed)
      expect(isValid).toBe(true)
      
      const isInvalid = EncryptionService.verifyHash('wrong-password', hashed)
      expect(isInvalid).toBe(false)
    })

    it('should generate secure tokens', () => {
      const token1 = EncryptionService.generateToken()
      const token2 = EncryptionService.generateToken()
      
      expect(token1).toBeDefined()
      expect(token2).toBeDefined()
      expect(token1).not.toBe(token2)
      expect(token1.length).toBe(64) // 32 bytes = 64 hex chars
      
      const shortToken = EncryptionService.generateToken(16)
      expect(shortToken.length).toBe(32) // 16 bytes = 32 hex chars
    })

    it('should handle encryption errors gracefully', () => {
      // Test with invalid encryption key
      const originalKey = process.env.ENCRYPTION_KEY
      delete process.env.ENCRYPTION_KEY
      
      expect(() => {
        EncryptionService.encrypt('test')
      }).toThrow('ENCRYPTION_KEY environment variable is required')
      
      process.env.ENCRYPTION_KEY = originalKey
    })
  })

  describe('AuditService', () => {
    it('should log audit events successfully', async () => {
      const result = await AuditService.log({
        user: mockUser,
        action: 'CREATE',
        resourceType: 'PATIENT',
        resourceId: 'test-patient-123',
        newValues: { name: 'Test Patient' },
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser'
      })

      // Should not throw error
      expect(result).toBeUndefined()
    })

    it('should log authentication events', async () => {
      await AuditService.logAuth({
        email: 'test@visioncare.com',
        action: 'LOGIN',
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser',
        sessionId: 'test-session-123'
      })

      await AuditService.logAuth({
        email: 'hacker@evil.com',
        action: 'LOGIN_FAILED',
        ipAddress: '192.168.1.100',
        userAgent: 'Evil Browser',
        errorMessage: 'Invalid credentials'
      })

      // Should not throw errors
    })

    it('should log sensitive data access', async () => {
      await AuditService.logSensitiveDataAccess({
        user: mockUser,
        resourceType: 'PATIENT',
        resourceId: 'test-patient-123',
        dataFields: ['cpf', 'medical_history'],
        ipAddress: '192.168.1.1',
        purpose: 'Medical consultation'
      })

      // Should not throw error
    })

    it('should retrieve audit logs with filtering', async () => {
      const result = await AuditService.getAuditLogs({
        userId: mockUser.id,
        action: 'CREATE',
        limit: 10
      })

      expect(result).toBeDefined()
      expect(result.logs).toBeDefined()
      expect(result.total).toBeDefined()
      expect(Array.isArray(result.logs)).toBe(true)
    })
  })

  describe('SecurityMonitoringService', () => {
    it('should get security metrics', async () => {
      const result = await SecurityMonitoringService.getSecurityMetrics()

      expect(result).toBeDefined()
      expect(result.metrics).toBeDefined()
      expect(typeof result.metrics.failed_logins_24h).toBe('number')
      expect(typeof result.metrics.successful_logins_24h).toBe('number')
      expect(typeof result.metrics.sensitive_data_access_24h).toBe('number')
      expect(typeof result.metrics.unusual_activity_score).toBe('number')
    })

    it('should monitor security and generate alerts', async () => {
      const result = await SecurityMonitoringService.monitorSecurity()

      expect(result).toBeDefined()
      expect(result.alerts).toBeDefined()
      expect(Array.isArray(result.alerts)).toBe(true)
    })

    it('should retrieve security alerts', async () => {
      const result = await SecurityMonitoringService.getSecurityAlerts({
        status: 'ACTIVE',
        limit: 10
      })

      expect(result).toBeDefined()
      expect(result.alerts).toBeDefined()
      expect(result.total).toBeDefined()
      expect(Array.isArray(result.alerts)).toBe(true)
    })

    it('should resolve security alerts', async () => {
      // First create a test alert
      const testAlert = {
        alert_type: 'TEST_ALERT',
        severity: 'LOW' as const,
        title: 'Test Security Alert',
        description: 'This is a test alert for unit testing',
        status: 'ACTIVE' as const,
        created_at: new Date().toISOString()
      }

      const { data: createdAlert } = await supabaseAdmin
        .from('security_alerts')
        .insert([testAlert])
        .select()
        .single()

      if (createdAlert) {
        const result = await SecurityMonitoringService.resolveAlert(
          createdAlert.id,
          mockUser.id,
          'Resolved during unit testing',
          'RESOLVED'
        )

        expect(result.success).toBe(true)
      }
    })
  })

  describe('LGPDComplianceService', () => {
    it('should apply retention policies', async () => {
      const result = await LGPDComplianceService.applyRetentionPolicies(mockUser)

      expect(result).toBeDefined()
      expect(typeof result.processed).toBe('number')
      expect(typeof result.anonymized).toBe('number')
      expect(typeof result.deleted).toBe('number')
    })

    it('should handle data access requests', async () => {
      // First create a test patient
      const { data: patient } = await supabaseAdmin
        .from('patients')
        .insert([mockPatient])
        .select()
        .single()

      if (patient) {
        const result = await LGPDComplianceService.handleAccessRequest(
          patient.id,
          'test@example.com',
          mockUser
        )

        expect(result).toBeDefined()
        if (result.data) {
          expect(result.data.personal_data).toBeDefined()
          expect(result.data.medical_records).toBeDefined()
          expect(result.data.appointments).toBeDefined()
        }

        // Clean up
        await supabaseAdmin.from('patients').delete().eq('id', patient.id)
      }
    })

    it('should retrieve data subject requests', async () => {
      const result = await LGPDComplianceService.getDataSubjectRequests({
        limit: 10
      })

      expect(result).toBeDefined()
      expect(result.requests).toBeDefined()
      expect(result.total).toBeDefined()
      expect(Array.isArray(result.requests)).toBe(true)
    })
  })

  describe('BackupService', () => {
    it('should get backup history', async () => {
      const result = await BackupService.getBackupHistory({
        limit: 10
      })

      expect(result).toBeDefined()
      expect(result.backups).toBeDefined()
      expect(result.total).toBeDefined()
      expect(Array.isArray(result.backups)).toBe(true)
    })

    it('should create full backup', async () => {
      const result = await BackupService.createFullBackup(mockUser, {
        compression: false,
        encryption: false,
        retention_days: 1,
        storage_path: './test-backups'
      })

      expect(result).toBeDefined()
      expect(result.result).toBeDefined()
      expect(result.result.backup_type).toBe('FULL')
      
      // Note: In a real test environment, you might want to verify the backup file exists
      // and clean it up afterwards
    })

    it('should create incremental backup', async () => {
      const result = await BackupService.createIncrementalBackup(mockUser, {
        compression: false,
        encryption: false,
        retention_days: 1,
        storage_path: './test-backups'
      })

      expect(result).toBeDefined()
      expect(result.result).toBeDefined()
      // Could be INCREMENTAL or FULL if no previous backup exists
      expect(['INCREMENTAL', 'FULL']).toContain(result.result.backup_type)
    })

    it('should handle backup errors gracefully', async () => {
      const result = await BackupService.createFullBackup(mockUser, {
        storage_path: '/invalid/path/that/does/not/exist'
      })

      expect(result).toBeDefined()
      expect(result.result.status).toBe('FAILED')
      expect(result.error).toBeDefined()
    })
  })

  describe('Integration Tests', () => {
    it('should create audit log when encryption is used', async () => {
      const sensitiveData = 'patient medical record'
      
      // Encrypt data
      const encrypted = EncryptionService.encrypt(sensitiveData)
      
      // Log the encryption
      await AuditService.log({
        user: mockUser,
        action: 'SYSTEM',
        resourceType: 'SYSTEM',
        metadata: {
          operation: 'DATA_ENCRYPTION',
          data_type: 'medical_record'
        }
      })

      // Verify audit log was created
      const auditResult = await AuditService.getAuditLogs({
        userId: mockUser.id,
        action: 'SYSTEM',
        limit: 1
      })

      expect(auditResult.logs.length).toBeGreaterThan(0)
    })

    it('should trigger security alert for suspicious activity', async () => {
      // Simulate multiple failed logins
      for (let i = 0; i < 6; i++) {
        await AuditService.logAuth({
          email: 'suspicious@test.com',
          action: 'LOGIN_FAILED',
          ipAddress: '192.168.1.200',
          userAgent: 'Suspicious Browser',
          errorMessage: 'Invalid credentials'
        })
      }

      // Run security monitoring
      const monitorResult = await SecurityMonitoringService.monitorSecurity()
      
      // Should detect the suspicious activity
      expect(monitorResult.alerts.length).toBeGreaterThan(0)
      
      const suspiciousAlert = monitorResult.alerts.find(alert => 
        alert.alert_type === 'MULTIPLE_FAILED_LOGINS_IP'
      )
      
      if (suspiciousAlert) {
        expect(suspiciousAlert.severity).toBe('HIGH')
        expect(suspiciousAlert.ip_address).toBe('192.168.1.200')
      }
    })

    it('should handle complete LGPD workflow', async () => {
      // Create test patient
      const { data: patient } = await supabaseAdmin
        .from('patients')
        .insert([{
          ...mockPatient,
          id: 'lgpd-test-patient'
        }])
        .select()
        .single()

      if (patient) {
        // Handle access request
        const accessResult = await LGPDComplianceService.handleAccessRequest(
          patient.id,
          'patient@test.com',
          mockUser
        )
        expect(accessResult.data).toBeDefined()

        // Handle erasure request
        const erasureResult = await LGPDComplianceService.handleErasureRequest(
          patient.id,
          'patient@test.com',
          mockUser,
          'Patient requested data deletion'
        )
        expect(erasureResult.success).toBe(true)
      }
    })
  })
})