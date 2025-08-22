import { useState, useEffect } from 'react'

interface ConnectivityStatus {
  frontend: {
    supabaseConfig: boolean
    supabaseConnection: boolean
  }
  backend: {
    healthCheck: boolean
    financialEndpoint: boolean
  }
  errors: string[]
}

export const ConnectivityTest = () => {
  const [status, setStatus] = useState<ConnectivityStatus>({
    frontend: {
      supabaseConfig: false,
      supabaseConnection: false
    },
    backend: {
      healthCheck: false,
      financialEndpoint: false
    },
    errors: []
  })

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const runTests = async () => {
      const errors: string[] = []
      const newStatus: ConnectivityStatus = {
        frontend: { supabaseConfig: false, supabaseConnection: false },
        backend: { healthCheck: false, financialEndpoint: false },
        errors: []
      }

      // Test 1: Frontend Supabase Config
      try {
        const hasUrl = !!import.meta.env.VITE_SUPABASE_URL
        const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY
        newStatus.frontend.supabaseConfig = hasUrl && hasKey
        
        if (!hasUrl) errors.push('VITE_SUPABASE_URL não encontrada')
        if (!hasKey) errors.push('VITE_SUPABASE_ANON_KEY não encontrada')
      } catch (error) {
        errors.push(`Erro na configuração Supabase: ${error}`)
      }

      // Test 2: Frontend Supabase Connection
      if (newStatus.frontend.supabaseConfig) {
        try {
          const { supabase } = await import('../../lib/supabase')
          const { data, error } = await supabase.from('patients').select('count').limit(1)
          newStatus.frontend.supabaseConnection = !error
          if (error) errors.push(`Erro conexão Supabase: ${error.message}`)
        } catch (error) {
          errors.push(`Erro ao testar Supabase: ${error}`)
        }
      }

      // Test 3: Backend Health Check
      try {
        const response = await fetch('/api/health')
        newStatus.backend.healthCheck = response.ok
        if (!response.ok) {
          errors.push(`Backend health check falhou: ${response.status}`)
        }
      } catch (error) {
        errors.push(`Erro no health check: ${error}`)
      }

      // Test 4: Financial Endpoint
      try {
        const response = await fetch('/api/financial/dashboard')
        newStatus.backend.financialEndpoint = response.ok || response.status === 401 // 401 é ok, significa que precisa auth
        if (!response.ok && response.status !== 401) {
          errors.push(`Endpoint financeiro falhou: ${response.status}`)
        }
      } catch (error) {
        errors.push(`Erro no endpoint financeiro: ${error}`)
      }

      newStatus.errors = errors
      setStatus(newStatus)

      // Mostrar apenas se houver problemas
      const hasProblems = errors.length > 0 || 
                         !newStatus.frontend.supabaseConfig || 
                         !newStatus.frontend.supabaseConnection ||
                         !newStatus.backend.healthCheck ||
                         !newStatus.backend.financialEndpoint

      setIsVisible(hasProblems && import.meta.env.PROD)
    }

    runTests()
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg max-w-md z-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold">🔧 Debug de Conectividade</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-gray-200"
        >
          ✕
        </button>
      </div>
      
      <div className="text-sm space-y-2">
        <div>
          <h4 className="font-semibold">Frontend:</h4>
          <div className="ml-2">
            <div className={status.frontend.supabaseConfig ? 'text-green-200' : 'text-red-200'}>
              {status.frontend.supabaseConfig ? '✅' : '❌'} Config Supabase
            </div>
            <div className={status.frontend.supabaseConnection ? 'text-green-200' : 'text-red-200'}>
              {status.frontend.supabaseConnection ? '✅' : '❌'} Conexão Supabase
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold">Backend:</h4>
          <div className="ml-2">
            <div className={status.backend.healthCheck ? 'text-green-200' : 'text-red-200'}>
              {status.backend.healthCheck ? '✅' : '❌'} Health Check
            </div>
            <div className={status.backend.financialEndpoint ? 'text-green-200' : 'text-red-200'}>
              {status.backend.financialEndpoint ? '✅' : '❌'} Endpoint Financeiro
            </div>
          </div>
        </div>

        {status.errors.length > 0 && (
          <div>
            <h4 className="font-semibold">Erros:</h4>
            <div className="ml-2 text-xs">
              {status.errors.map((error, index) => (
                <div key={index} className="text-red-200">• {error}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}