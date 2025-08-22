import { useState, useEffect } from 'react'

interface DebugInfo {
  environment: 'development' | 'production'
  frontendVars: {
    VITE_SUPABASE_URL: boolean
    VITE_SUPABASE_ANON_KEY: boolean
  }
  backendStatus: 'unknown' | 'working' | 'error'
  backendError?: string
}

export const VercelDebugPanel = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    environment: import.meta.env.DEV ? 'development' : 'production',
    frontendVars: {
      VITE_SUPABASE_URL: !!import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY
    },
    backendStatus: 'unknown'
  })

  useEffect(() => {
    // Testar backend
    const testBackend = async () => {
      try {
        const response = await fetch('/api/health')
        if (response.ok) {
          setDebugInfo(prev => ({ ...prev, backendStatus: 'working' }))
        } else {
          setDebugInfo(prev => ({ 
            ...prev, 
            backendStatus: 'error',
            backendError: `HTTP ${response.status}: ${response.statusText}`
          }))
        }
      } catch (error) {
        setDebugInfo(prev => ({ 
          ...prev, 
          backendStatus: 'error',
          backendError: error instanceof Error ? error.message : 'Unknown error'
        }))
      }
    }

    testBackend()
  }, [])

  // Só mostrar em produção se houver problemas
  if (debugInfo.environment === 'development') {
    return null
  }

  const hasProblems = !debugInfo.frontendVars.VITE_SUPABASE_URL || 
                     !debugInfo.frontendVars.VITE_SUPABASE_ANON_KEY || 
                     debugInfo.backendStatus === 'error'

  if (!hasProblems) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-4 z-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">🚨 Vercel Deploy Issues Detected</h3>
            <div className="mt-2 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Frontend Variables */}
                <div>
                  <h4 className="font-semibold">Frontend Variables:</h4>
                  <ul className="text-xs mt-1">
                    <li className={debugInfo.frontendVars.VITE_SUPABASE_URL ? 'text-green-200' : 'text-red-200'}>
                      {debugInfo.frontendVars.VITE_SUPABASE_URL ? '✅' : '❌'} VITE_SUPABASE_URL
                    </li>
                    <li className={debugInfo.frontendVars.VITE_SUPABASE_ANON_KEY ? 'text-green-200' : 'text-red-200'}>
                      {debugInfo.frontendVars.VITE_SUPABASE_ANON_KEY ? '✅' : '❌'} VITE_SUPABASE_ANON_KEY
                    </li>
                  </ul>
                </div>

                {/* Backend Status */}
                <div>
                  <h4 className="font-semibold">Backend Status:</h4>
                  <div className="text-xs mt-1">
                    {debugInfo.backendStatus === 'working' && <span className="text-green-200">✅ Working</span>}
                    {debugInfo.backendStatus === 'error' && (
                      <div className="text-red-200">
                        <div>❌ Error</div>
                        <div className="mt-1">{debugInfo.backendError}</div>
                      </div>
                    )}
                    {debugInfo.backendStatus === 'unknown' && <span className="text-yellow-200">⏳ Testing...</span>}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <h4 className="font-semibold">Fix Instructions:</h4>
                  <ol className="text-xs mt-1 list-decimal list-inside">
                    <li>Go to Vercel Dashboard</li>
                    <li>Settings → Environment Variables</li>
                    <li>Add missing VITE_ variables</li>
                    <li>Redeploy</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-xs">
            Environment: <span className="font-mono bg-red-700 px-2 py-1 rounded">
              {debugInfo.environment}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}