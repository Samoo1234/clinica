import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../config/supabase'
import { UserRole } from '../types/database'

interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  active: boolean
}

interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Get user profile from our users table
  const getUserProfile = async (userId: string): Promise<AuthUser | null> => {
    try {
      console.log('Fetching user profile for:', userId)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      if (!data) {
        console.warn('No user profile found for:', userId)
        return null
      }

      console.log('User profile found:', data)
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        active: data.active
      }
    } catch (error) {
      console.error('Exception fetching user profile:', error)
      return null
    }
  }

  // Sign in function
  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      setLoading(true)
      console.log('Attempting sign in for:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Sign in error:', error)
        return { error: error.message }
      }

      if (data.user && data.session) {
        console.log('Sign in successful, fetching profile...')
        const userProfile = await getUserProfile(data.user.id)
        if (userProfile) {
          setUser(userProfile)
          setSession(data.session)
          console.log('User profile set successfully')
        } else {
          console.error('User profile not found after sign in')
          return { error: 'Perfil de usuário não encontrado' }
        }
      }

      return {}
    } catch (error: any) {
      console.error('Sign in exception:', error)
      return { error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true)
      console.log('Signing out...')
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      console.log('Sign out successful')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  // Refresh session function
  const refreshSession = async () => {
    try {
      console.log('Refreshing session...')
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error('Error refreshing session:', error)
        return
      }

      if (data.session && data.user) {
        const userProfile = await getUserProfile(data.user.id)
        if (userProfile) {
          setUser(userProfile)
          setSession(data.session)
          console.log('Session refreshed successfully')
        }
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
    }
  }

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          return
        }

        console.log('Initial session:', session ? 'found' : 'not found')

        if (session && session.user && mounted) {
          console.log('Session found, getting user profile...')
          const userProfile = await getUserProfile(session.user.id)
          if (userProfile && mounted) {
            setUser(userProfile)
            setSession(session)
            console.log('Initial auth setup complete')
          } else {
            console.warn('User profile not found for existing session, signing out...')
            await supabase.auth.signOut()
          }
        } else {
          console.log('No active session found')
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        if (mounted) {
          console.log('Setting loading to false')
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state changed:', event, session?.user?.id)

        try {
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('Processing SIGNED_IN event...')
            const userProfile = await getUserProfile(session.user.id)
            if (userProfile && mounted) {
              setUser(userProfile)
              setSession(session)
              console.log('User signed in successfully')
            } else {
              console.warn('User profile not found on sign in')
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('Processing SIGNED_OUT event...')
            if (mounted) {
              setUser(null)
              setSession(null)
              console.log('User signed out')
            }
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log('Processing TOKEN_REFRESHED event...')
            const userProfile = await getUserProfile(session.user.id)
            if (userProfile && mounted) {
              setUser(userProfile)
              setSession(session)
              console.log('Token refreshed successfully')
            }
          }
        } catch (error) {
          console.error('Error in auth state change handler:', error)
        } finally {
          if (mounted) {
            setLoading(false)
          }
        }
      }
    )

    return () => {
      console.log('Cleaning up auth context')
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signOut,
    refreshSession
  }

  console.log('AuthProvider render - Loading:', loading, 'User:', user ? user.name : 'null')

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}