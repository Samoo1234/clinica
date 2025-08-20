import { useState } from 'react'
import { useModules } from '../contexts/ModuleContext'
import { MODULE_DESCRIPTIONS, ModuleConfig } from '../types/modules'
import { Settings, Check, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

export default function ModuleSettings() {
  const { moduleConfig, updateModuleConfig } = useModules()
  const { showSuccess } = useToast()
  const [localConfig, setLocalConfig] = useState<ModuleConfig>(moduleConfig)

  const handleToggleModule = (module: keyof ModuleConfig) => {
    // Não permite desabilitar módulos core
    if (module === 'patients' || module === 'consultations' || module === 'medicalRecords') {
      return
    }

    setLocalConfig(prev => ({
      ...prev,
      [module]: !prev[module]
    }))
  }

  const handleSave = () => {
    updateModuleConfig(localConfig)
    showSuccess('Configuração de módulos salva com sucesso!')
  }

  const isCoreModule = (module: keyof ModuleConfig) => {
    return module === 'patients' || module === 'consultations' || module === 'medicalRecords'
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Settings className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Configuração de Módulos</h1>
        </div>
        <p className="text-gray-600">
          Configure quais funcionalidades estarão disponíveis no sistema.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Módulos Disponíveis</h2>
          
          <div className="space-y-4">
            {Object.entries(MODULE_DESCRIPTIONS).map(([module, description]) => {
              const isCore = isCoreModule(module as keyof ModuleConfig)
              const isEnabled = localConfig[module as keyof ModuleConfig]
              
              return (
                <div
                  key={module}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    isCore ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">{description}</h3>
                      {isCore && (
                        <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                          CORE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {isCore ? 'Módulo essencial - sempre ativo' : 'Módulo opcional'}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleToggleModule(module as keyof ModuleConfig)}
                      disabled={isCore}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isEnabled
                          ? 'bg-blue-600'
                          : 'bg-gray-200'
                      } ${isCore ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    
                    <div className="flex items-center">
                      {isEnabled ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setLocalConfig(moduleConfig)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvar Configuração
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 text-yellow-600 mt-0.5">
            ⚠️
          </div>
          <div>
            <h3 className="font-medium text-yellow-800">Importante</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Módulos CORE (Pacientes, Consultas, Prontuários) são essenciais para o funcionamento 
              do sistema e não podem ser desabilitados. As alterações são salvas localmente e 
              aplicadas imediatamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}