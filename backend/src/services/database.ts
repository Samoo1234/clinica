import { supabaseAdmin } from '../config/supabase'
import { handleSupabaseError } from '../utils/supabase-helpers'

export class DatabaseService {
  /**
   * Test database connection
   */
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('count')
        .limit(1)
      
      if (error) {
        handleSupabaseError(error, 'test connection')
      }
      
      return {
        success: true,
        message: 'Database connection successful'
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Database connection failed: ${error.message}`
      }
    }
  }

  /**
   * Get database health information
   */
  static async getHealthInfo(): Promise<{
    connected: boolean
    tablesCount: number
    usersCount: number
    patientsCount: number
    appointmentsCount: number
  }> {
    try {
      // Test connection and get counts
      const [usersResult, patientsResult, appointmentsResult] = await Promise.all([
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('patients').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true })
      ])

      return {
        connected: true,
        tablesCount: 7, // Total number of main tables
        usersCount: usersResult.count || 0,
        patientsCount: patientsResult.count || 0,
        appointmentsCount: appointmentsResult.count || 0
      }
    } catch (error) {
      console.error('Database health check failed:', error)
      return {
        connected: false,
        tablesCount: 0,
        usersCount: 0,
        patientsCount: 0,
        appointmentsCount: 0
      }
    }
  }

  /**
   * Initialize database with basic data if needed
   */
  static async initializeDatabase(): Promise<{ success: boolean; message: string }> {
    try {
      // Check if admin user exists
      const { data: adminUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single()

      if (!adminUser) {
        return {
          success: false,
          message: 'No admin user found. Please run the test-data.sql script or create an admin user manually.'
        }
      }

      return {
        success: true,
        message: 'Database is properly initialized'
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Database initialization check failed: ${error.message}`
      }
    }
  }
}