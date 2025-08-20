import { supabase, supabaseAdmin } from '../config/supabase'
import { User, UserRole } from '../types/database'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  role?: UserRole
}

export interface AuthResponse {
  user: User | null
  session: any
  error?: string
}

export class AuthService {
  /**
   * Sign in user with email and password
   */
  static async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (error) {
        return { user: null, session: null, error: error.message }
      }

      if (!data.user) {
        return { user: null, session: null, error: 'No user returned' }
      }

      // Get user profile from our users table
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError || !userProfile) {
        return { user: null, session: null, error: 'User profile not found' }
      }

      return {
        user: userProfile,
        session: data.session
      }
    } catch (error: any) {
      return { user: null, session: null, error: error.message }
    }
  }

  /**
   * Sign up new user
   */
  static async signUp(userData: RegisterData): Promise<AuthResponse> {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: {
          name: userData.name,
          role: userData.role || 'receptionist'
        },
        email_confirm: true
      })

      if (error) {
        return { user: null, session: null, error: error.message }
      }

      if (!data.user) {
        return { user: null, session: null, error: 'No user created' }
      }

      // The user profile will be created automatically by the trigger
      // Wait a moment and then fetch it
      await new Promise(resolve => setTimeout(resolve, 100))

      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError || !userProfile) {
        return { user: null, session: null, error: 'User profile creation failed' }
      }

      return {
        user: userProfile,
        session: null // Admin created users don't get a session
      }
    } catch (error: any) {
      return { user: null, session: null, error: error.message }
    }
  }

  /**
   * Sign out user
   */
  static async signOut(): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        return { error: error.message }
      }
      return {}
    } catch (error: any) {
      return { error: error.message }
    }
  }

  /**
   * Get current user from session
   */
  static async getCurrentUser(accessToken: string): Promise<{ user: User | null, error?: string }> {
    try {
      const { data, error } = await supabase.auth.getUser(accessToken)

      if (error || !data.user) {
        return { user: null, error: error?.message || 'No user found' }
      }

      // Get user profile from our users table
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError || !userProfile) {
        return { user: null, error: 'User profile not found' }
      }

      return { user: userProfile }
    } catch (error: any) {
      return { user: null, error: error.message }
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      })

      if (error || !data.session) {
        return { user: null, session: null, error: error?.message || 'Token refresh failed' }
      }

      // Get user profile
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', data.session.user.id)
        .single()

      if (profileError || !userProfile) {
        return { user: null, session: null, error: 'User profile not found' }
      }

      return {
        user: userProfile,
        session: data.session
      }
    } catch (error: any) {
      return { user: null, session: null, error: error.message }
    }
  }

  /**
   * Update user role (admin only)
   */
  static async updateUserRole(userId: string, role: UserRole): Promise<{ error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ role })
        .eq('id', userId)

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error: any) {
      return { error: error.message }
    }
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(): Promise<{ users: User[], error?: string }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        return { users: [], error: error.message }
      }

      return { users: data || [] }
    } catch (error: any) {
      return { users: [], error: error.message }
    }
  }
}