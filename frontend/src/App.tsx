import { BrowserRouter as Router } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/SimpleAuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ModuleProvider } from './contexts/ModuleContext'
import { SimpleLogin } from './components/SimpleLogin'
import { AppRoutes } from './routes/AppRoutes'
import { VercelDebugPanel } from './components/debug/VercelDebugPanel'

const queryClient = new QueryClient()

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <SimpleLogin />
  }

  return <AppRoutes />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <ModuleProvider>
            <ToastProvider>
              <VercelDebugPanel />
              <AppContent />
            </ToastProvider>
          </ModuleProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  )
}

export default App