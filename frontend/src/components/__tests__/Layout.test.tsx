import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../../contexts/AuthContext'
import { Layout } from '../layout/Layout'

// Mock the auth context to provide a test user
const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin' as const,
  active: true,
  created_at: '2024-01-01',
  updated_at: '2024-01-01'
}

// Mock the useAuth hook
vi.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: mockUser,
    loading: false,
    signOut: vi.fn()
  })
}))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
})

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('Layout Component', () => {
  it('renders the layout with header and sidebar', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </TestWrapper>
    )

    // Check if VisionCare title is present
    expect(screen.getByText('VisionCare')).toBeInTheDocument()
    
    // Check if user name is displayed
    expect(screen.getByText('Test User')).toBeInTheDocument()
    
    // Check if test content is rendered
    expect(screen.getByText('Test Content')).toBeInTheDocument()
    
    // Check if navigation items are present
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Pacientes')).toBeInTheDocument()
    expect(screen.getByText('Agendamentos')).toBeInTheDocument()
  })
})