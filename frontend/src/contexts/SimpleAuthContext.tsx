import React, { createContext, useContext, useState } from 'react'
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
  token: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
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

// Mock user for testing
const mockUser: AuthUser = {
  id: '1',
  email: 'admin@visioncare.com',
  name: 'Administrador',
  role: 'admin',
  active: true
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Initialize user from localStorage
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [token, setToken] = useState<string | null>(() => {
    // Initialize token from localStorage
    return localStorage.getItem('token')
  })
  const [loading, setLoading] = useState(false)

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    setLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simple validation - aceita qualquer email/senha para teste
    if (email && password) {
      const mockToken = 'mock-jwt-token-' + Date.now()
      // Usando ID real de médico existente na tabela medicos
      const mockUser = {
        id: 'c398bec7-99d0-4eb0-9265-19ff998ca3ed',
        email: email,
        name: 'Dr. Sávio Carmo',
        role: 'admin' as UserRole,
        active: true
      }
      
      setUser(mockUser)
      setToken(mockToken)
      localStorage.setItem('token', mockToken) // Save token to localStorage
      localStorage.setItem('user', JSON.stringify(mockUser)) // Save user to localStorage
      setLoading(false)
      return {}
    } else {
      setLoading(false)
      return { error: 'Email e senha são obrigatórios' }
    }
  }

  const signOut = async () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token') // Remove token from localStorage
    localStorage.removeItem('user') // Remove user from localStorage
  }

  const value: AuthContextType = {
    user,
    token,
    loading,
    signIn,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}