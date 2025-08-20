import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ModuleConfig, DEFAULT_MODULE_CONFIG } from '../types/modules'

interface ModuleContextType {
  moduleConfig: ModuleConfig
  isModuleEnabled: (module: keyof ModuleConfig) => boolean
  updateModuleConfig: (config: Partial<ModuleConfig>) => void
  loading: boolean
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined)

interface ModuleProviderProps {
  children: ReactNode
}

export function ModuleProvider({ children }: ModuleProviderProps) {
  const [moduleConfig, setModuleConfig] = useState<ModuleConfig>(DEFAULT_MODULE_CONFIG)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadModuleConfig()
  }, [])

  const loadModuleConfig = async () => {
    try {
      // Tenta carregar do localStorage primeiro
      const savedConfig = localStorage.getItem('moduleConfig')
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig)
        setModuleConfig({ ...DEFAULT_MODULE_CONFIG, ...parsed })
      }
      
      // TODO: Futuramente carregar do backend
      // const response = await api.get('/modules/config')
      // setModuleConfig(response.data)
    } catch (error) {
      console.error('Erro ao carregar configuração de módulos:', error)
      // Usa configuração padrão em caso de erro
      setModuleConfig(DEFAULT_MODULE_CONFIG)
    } finally {
      setLoading(false)
    }
  }

  const isModuleEnabled = (module: keyof ModuleConfig): boolean => {
    // Módulos core sempre habilitados
    if (module === 'patients' || module === 'consultations' || module === 'medicalRecords') {
      return true
    }
    return moduleConfig[module]
  }

  const updateModuleConfig = (config: Partial<ModuleConfig>) => {
    const newConfig = { ...moduleConfig, ...config }
    setModuleConfig(newConfig)
    
    // Salva no localStorage
    localStorage.setItem('moduleConfig', JSON.stringify(newConfig))
    
    // TODO: Futuramente salvar no backend
    // api.put('/modules/config', newConfig)
  }

  return (
    <ModuleContext.Provider value={{
      moduleConfig,
      isModuleEnabled,
      updateModuleConfig,
      loading
    }}>
      {children}
    </ModuleContext.Provider>
  )
}

export function useModules() {
  const context = useContext(ModuleContext)
  if (context === undefined) {
    throw new Error('useModules must be used within a ModuleProvider')
  }
  return context
}