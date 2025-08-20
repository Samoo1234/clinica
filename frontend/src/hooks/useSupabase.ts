import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useSupabase() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // Test Supabase connection
    const testConnection = async () => {
      try {
        const { error } = await supabase
          .from('users')
          .select('count')
          .limit(1)
        
        if (!error) {
          setConnected(true)
        }
      } catch (error) {
        console.error('Supabase connection test failed:', error)
        setConnected(false)
      }
    }

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    testConnection()
    getInitialSession()

    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    loading,
    connected,
    supabase
  }
}