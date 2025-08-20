import { ReactNode } from 'react'
import { useModules } from '../contexts/ModuleContext'
import { ModuleConfig } from '../types/modules'
import { Lock, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'

interface ModuleGuardProps {
  module: keyof ModuleConfig
  children: ReactNode
  fallback?: ReactNode
}

export function ModuleGuard({ module, children, fallback }: ModuleGuardProps) {
  const { isModuleEnabled } = useModules()

  if (!isModuleEnabled(module)) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Módulo Desabilitado</h3>
          <p className="text-gray-600 mb-6">
            Este módulo está desabilitado. Para acessar esta funcionalidade, 
            você precisa habilitá-lo nas configurações.
          </p>
          <Link
            to="/settings/modules"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Configurar Módulos</span>
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}