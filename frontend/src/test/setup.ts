import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
vi.mock('../config/supabase', () => ({
  supabaseUrl: 'http://localhost:54321',
  supabaseAnonKey: 'test-key'
}))

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithPassword: vi.fn(),
      signOut: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}))