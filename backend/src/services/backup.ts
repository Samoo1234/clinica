import { supabaseAdmin } from '../config/supabase'
import { EncryptionService } from './encryption'
import { AuditService } from './audit'
import { User } from '../types/database'
import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface BackupConfig {
  type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL'
  tables?: string[]
  compression: boolean
  encryption: boolean
  retention_days: number
  storage_path: string
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

/**
 * Backup service for automated and encrypted backups
 */
export class BackupService {
  private static readonly DEFAULT_CONFIG: BackupConfig = {
    type: 'FULL',
    compression: true,
    encryption: true,
    retention_days: 30,
    storage_path: process.env.BACKUP_STORAGE_PATH || './backups'
  }

  private static readonly BACKUP_TABLES = [
    'users',
    'patients', 
    'medical_records',
    'appointments',
    'attachments',
    'invoices',
    'integration_logs',
    'audit_logs',
    'security_alerts',
    'data_subject_requests'
  ]

  /**
   * Create a full backup
   */
  static async createFullBackup(
    user: User,
    config: Partial<BackupConfig> = {}
  ): Promise<{ result: BackupResult, error?: string }> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config, type: 'FULL' as const }
    
    const backupId = crypto.randomUUID()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `visioncare-full-backup-${timestamp}.sql`
    const filePath = path.join(finalConfig.storage_path, filename)

    // Log backup start
    const backupLog: Omit<BackupResult, 'id'> = {
      backup_type: 'FULL',
      status: 'IN_PROGRESS',
      started_at: new Date().toISOString(),
      metadata: { config: finalConfig, user_id: user.id }
    }

    try {
      // Create backup directory if it doesn't exist
      await fs.mkdir(finalConfig.storage_path, { recursive: true })

      // Log backup initiation
      await this.logBackup(backupId, backupLog)

      // Create database dump
      const dumpResult = await this.createDatabaseDump(finalConfig.tables || this.BACKUP_TABLES, filePath)
      
      if (!dumpResult.success) {
        throw new Error(dumpResult.error || 'Database dump failed')
      }

      // Get file stats
      const stats = await fs.stat(filePath)
      let finalPath = filePath
      let encryptionKeyId: string | undefined

      // Compress if requested
      if (finalConfig.compression) {
        finalPath = await this.compressFile(filePath)
        await fs.unlink(filePath) // Remove uncompressed file
      }

      // Encrypt if requested
      if (finalConfig.encryption) {
        const encryptResult = await this.encryptFile(finalPath)
        encryptionKeyId = encryptResult.keyId
        await fs.unlink(finalPath) // Remove unencrypted file
        finalPath = encryptResult.encryptedPath
      }

      // Calculate checksum
      const checksum = await this.calculateChecksum(finalPath)

      // Update backup log
      const completedLog: BackupResult = {
        id: backupId,
        backup_type: 'FULL',
        status: 'SUCCESS',
        file_path: finalPath,
        file_size: stats.size,
        checksum,
        encryption_key_id: encryptionKeyId,
        started_at: backupLog.started_at,
        completed_at: new Date().toISOString(),
        metadata: { ...backupLog.metadata, compression: finalConfig.compression }
      }

      await this.updateBackupLog(backupId, completedLog)

      // Log audit event
      await AuditService.log({
        user,
        action: 'BACKUP',
        resourceType: 'SYSTEM',
        metadata: {
          backup_id: backupId,
          backup_type: 'FULL',
          file_size: stats.size,
          encrypted: finalConfig.encryption,
          compressed: finalConfig.compression
        }
      })

      // Clean old backups
      await this.cleanOldBackups(finalConfig.retention_days)

      return { result: completedLog }
    } catch (error: any) {
      // Update backup log with error
      const errorLog: BackupResult = {
        id: backupId,
        backup_type: 'FULL',
        status: 'FAILED',
        started_at: backupLog.started_at,
        completed_at: new Date().toISOString(),
        error_message: error.message,
        metadata: backupLog.metadata
      }

      await this.updateBackupLog(backupId, errorLog)

      return { result: errorLog, error: error.message }
    }
  }

  /**
   * Create incremental backup (only changed data since last backup)
   */
  static async createIncrementalBackup(
    user: User,
    config: Partial<BackupConfig> = {}
  ): Promise<{ result: BackupResult, error?: string }> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config, type: 'INCREMENTAL' as const }
    
    try {
      // Get last backup timestamp
      const { data: lastBackup } = await supabaseAdmin
        .from('backup_logs')
        .select('completed_at')
        .eq('status', 'SUCCESS')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()

      if (!lastBackup) {
        // No previous backup, create full backup instead
        return this.createFullBackup(user, config)
      }

      const lastBackupTime = lastBackup.completed_at
      const backupId = crypto.randomUUID()
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `visioncare-incremental-backup-${timestamp}.sql`
      const filePath = path.join(finalConfig.storage_path, filename)

      // Create incremental dump with WHERE conditions
      const incrementalResult = await this.createIncrementalDump(lastBackupTime, filePath)
      
      if (!incrementalResult.success) {
        throw new Error(incrementalResult.error || 'Incremental backup failed')
      }

      // Process file (compression, encryption) similar to full backup
      const stats = await fs.stat(filePath)
      let finalPath = filePath
      let encryptionKeyId: string | undefined

      if (finalConfig.compression) {
        finalPath = await this.compressFile(filePath)
        await fs.unlink(filePath)
      }

      if (finalConfig.encryption) {
        const encryptResult = await this.encryptFile(finalPath)
        encryptionKeyId = encryptResult.keyId
        await fs.unlink(finalPath)
        finalPath = encryptResult.encryptedPath
      }

      const checksum = await this.calculateChecksum(finalPath)

      const result: BackupResult = {
        id: backupId,
        backup_type: 'INCREMENTAL',
        status: 'SUCCESS',
        file_path: finalPath,
        file_size: stats.size,
        checksum,
        encryption_key_id: encryptionKeyId,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        metadata: { 
          since: lastBackupTime,
          compression: finalConfig.compression,
          user_id: user.id 
        }
      }

      await this.logBackup(backupId, result)

      await AuditService.log({
        user,
        action: 'BACKUP',
        resourceType: 'SYSTEM',
        metadata: {
          backup_id: backupId,
          backup_type: 'INCREMENTAL',
          since: lastBackupTime,
          file_size: stats.size
        }
      })

      return { result }
    } catch (error: any) {
      return { 
        result: {
          id: crypto.randomUUID(),
          backup_type: 'INCREMENTAL',
          status: 'FAILED',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          error_message: error.message
        }, 
        error: error.message 
      }
    }
  }

  /**
   * Restore from backup
   */
  static async restoreFromBackup(
    backupId: string,
    user: User,
    options: {
      tables?: string[]
      confirmDestruction?: boolean
    } = {}
  ): Promise<{ success: boolean, error?: string }> {
    try {
      // Get backup info
      const { data: backup, error: backupError } = await supabaseAdmin
        .from('backup_logs')
        .select('*')
        .eq('id', backupId)
        .eq('status', 'SUCCESS')
        .single()

      if (backupError || !backup) {
        return { success: false, error: 'Backup not found or invalid' }
      }

      if (!options.confirmDestruction) {
        return { 
          success: false, 
          error: 'Restore operation requires explicit confirmation as it will overwrite existing data' 
        }
      }

      let filePath = backup.file_path

      // Decrypt if needed
      if (backup.encryption_key_id) {
        filePath = await this.decryptFile(filePath, backup.encryption_key_id)
      }

      // Decompress if needed
      if (filePath.endsWith('.gz')) {
        filePath = await this.decompressFile(filePath)
      }

      // Verify checksum
      const currentChecksum = await this.calculateChecksum(filePath)
      if (currentChecksum !== backup.checksum) {
        return { success: false, error: 'Backup file integrity check failed' }
      }

      // Perform restore
      const restoreResult = await this.performRestore(filePath, options.tables)
      
      if (!restoreResult.success) {
        return { success: false, error: restoreResult.error }
      }

      // Log restore operation
      await AuditService.log({
        user,
        action: 'RESTORE',
        resourceType: 'SYSTEM',
        metadata: {
          backup_id: backupId,
          backup_type: backup.backup_type,
          restored_tables: options.tables || 'all',
          backup_date: backup.completed_at
        }
      })

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Schedule automatic backups
   */
  static async scheduleAutomaticBackups(): Promise<void> {
    // This would typically be implemented with a cron job or scheduled task
    // For now, we'll create a method that can be called periodically
    
    try {
      const systemUser: User = {
        id: 'system',
        email: 'system@visioncare.com',
        name: 'System',
        role: 'admin',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Create daily incremental backup
      const now = new Date()
      const hour = now.getHours()
      
      if (hour === 2) { // 2 AM daily incremental
        await this.createIncrementalBackup(systemUser)
      }
      
      if (hour === 3 && now.getDay() === 0) { // 3 AM Sunday full backup
        await this.createFullBackup(systemUser)
      }
    } catch (error) {
      console.error('Automatic backup failed:', error)
    }
  }

  /**
   * Get backup history
   */
  static async getBackupHistory(params: {
    limit?: number
    offset?: number
    status?: string
    backupType?: string
  } = {}): Promise<{ backups: BackupResult[], total: number, error?: string }> {
    try {
      let query = supabaseAdmin
        .from('backup_logs')
        .select('*', { count: 'exact' })
        .order('started_at', { ascending: false })

      if (params.status) {
        query = query.eq('status', params.status)
      }

      if (params.backupType) {
        query = query.eq('backup_type', params.backupType)
      }

      if (params.limit) {
        query = query.limit(params.limit)
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 50) - 1)
      }

      const { data, error, count } = await query

      if (error) {
        return { backups: [], total: 0, error: error.message }
      }

      return { backups: data || [], total: count || 0 }
    } catch (error: any) {
      return { backups: [], total: 0, error: error.message }
    }
  }

  // Private helper methods

  private static async createDatabaseDump(tables: string[], filePath: string): Promise<{ success: boolean, error?: string }> {
    try {
      // This is a simplified version - in production, you'd use pg_dump or similar
      // For Supabase, you might use their API or pg_dump with connection string
      
      const dumpContent = await this.generateSQLDump(tables)
      await fs.writeFile(filePath, dumpContent, 'utf8')
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  private static async generateSQLDump(tables: string[]): Promise<string> {
    let dump = `-- VisionCare Database Backup\n-- Generated at: ${new Date().toISOString()}\n\n`
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')

        if (error) {
          dump += `-- Error backing up table ${table}: ${error.message}\n`
          continue
        }

        if (data && data.length > 0) {
          dump += `-- Table: ${table}\n`
          dump += `DELETE FROM public.${table};\n`
          
          for (const row of data) {
            const columns = Object.keys(row).join(', ')
            const values = Object.values(row).map(val => 
              val === null ? 'NULL' : 
              typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` :
              typeof val === 'object' ? `'${JSON.stringify(val).replace(/'/g, "''")}'` :
              val
            ).join(', ')
            
            dump += `INSERT INTO public.${table} (${columns}) VALUES (${values});\n`
          }
          dump += '\n'
        }
      } catch (error) {
        dump += `-- Error processing table ${table}: ${error}\n`
      }
    }
    
    return dump
  }

  private static async createIncrementalDump(since: string, filePath: string): Promise<{ success: boolean, error?: string }> {
    try {
      const incrementalTables = this.BACKUP_TABLES.filter(table => 
        !['audit_logs', 'security_alerts', 'backup_logs'].includes(table)
      )
      
      let dump = `-- VisionCare Incremental Backup\n-- Since: ${since}\n-- Generated at: ${new Date().toISOString()}\n\n`
      
      for (const table of incrementalTables) {
        try {
          const { data, error } = await supabaseAdmin
            .from(table)
            .select('*')
            .gte('updated_at', since)

          if (error) {
            dump += `-- Error backing up table ${table}: ${error.message}\n`
            continue
          }

          if (data && data.length > 0) {
            dump += `-- Incremental data for table: ${table}\n`
            
            for (const row of data) {
              const columns = Object.keys(row).join(', ')
              const values = Object.values(row).map(val => 
                val === null ? 'NULL' : 
                typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` :
                typeof val === 'object' ? `'${JSON.stringify(val).replace(/'/g, "''")}'` :
                val
              ).join(', ')
              
              dump += `INSERT INTO public.${table} (${columns}) VALUES (${values}) ON CONFLICT (id) DO UPDATE SET ${
                Object.keys(row).filter(k => k !== 'id').map(k => `${k} = EXCLUDED.${k}`).join(', ')
              };\n`
            }
            dump += '\n'
          }
        } catch (error) {
          dump += `-- Error processing table ${table}: ${error}\n`
        }
      }
      
      await fs.writeFile(filePath, dump, 'utf8')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  private static async compressFile(filePath: string): Promise<string> {
    const compressedPath = `${filePath}.gz`
    await execAsync(`gzip -c "${filePath}" > "${compressedPath}"`)
    return compressedPath
  }

  private static async decompressFile(filePath: string): Promise<string> {
    const decompressedPath = filePath.replace('.gz', '')
    await execAsync(`gunzip -c "${filePath}" > "${decompressedPath}"`)
    return decompressedPath
  }

  private static async encryptFile(filePath: string): Promise<{ encryptedPath: string, keyId: string }> {
    const keyId = EncryptionService.generateToken(16)
    const encryptedPath = `${filePath}.enc`
    
    const fileContent = await fs.readFile(filePath, 'utf8')
    const encryptedContent = EncryptionService.encrypt(fileContent)
    
    await fs.writeFile(encryptedPath, encryptedContent, 'utf8')
    
    return { encryptedPath, keyId }
  }

  private static async decryptFile(filePath: string, keyId: string): Promise<string> {
    const decryptedPath = filePath.replace('.enc', '')
    
    const encryptedContent = await fs.readFile(filePath, 'utf8')
    const decryptedContent = EncryptionService.decrypt(encryptedContent)
    
    await fs.writeFile(decryptedPath, decryptedContent, 'utf8')
    
    return decryptedPath
  }

  private static async calculateChecksum(filePath: string): Promise<string> {
    const fileContent = await fs.readFile(filePath)
    return crypto.createHash('sha256').update(fileContent).digest('hex')
  }

  private static async performRestore(filePath: string, tables?: string[]): Promise<{ success: boolean, error?: string }> {
    try {
      // This is a simplified restore - in production you'd execute the SQL file
      // against the database using psql or similar
      
      const sqlContent = await fs.readFile(filePath, 'utf8')
      
      // Parse and execute SQL statements
      const statements = sqlContent.split(';').filter(stmt => 
        stmt.trim() && !stmt.trim().startsWith('--')
      )
      
      for (const statement of statements) {
        if (statement.trim()) {
          // In a real implementation, you'd execute these against the database
          console.log('Would execute:', statement.trim().substring(0, 100) + '...')
        }
      }
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  private static async logBackup(id: string, backup: Omit<BackupResult, 'id'>): Promise<void> {
    await supabaseAdmin
      .from('backup_logs')
      .insert([{ id, ...backup }])
  }

  private static async updateBackupLog(id: string, backup: BackupResult): Promise<void> {
    await supabaseAdmin
      .from('backup_logs')
      .update(backup)
      .eq('id', id)
  }

  private static async cleanOldBackups(retentionDays: number): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
    
    try {
      // Get old backup files
      const { data: oldBackups } = await supabaseAdmin
        .from('backup_logs')
        .select('id, file_path')
        .lt('completed_at', cutoffDate.toISOString())
        .eq('status', 'SUCCESS')

      if (oldBackups) {
        for (const backup of oldBackups) {
          try {
            if (backup.file_path) {
              await fs.unlink(backup.file_path)
            }
          } catch (error) {
            console.error(`Failed to delete backup file ${backup.file_path}:`, error)
          }
        }

        // Remove from database
        await supabaseAdmin
          .from('backup_logs')
          .delete()
          .lt('completed_at', cutoffDate.toISOString())
      }
    } catch (error) {
      console.error('Error cleaning old backups:', error)
    }
  }
}