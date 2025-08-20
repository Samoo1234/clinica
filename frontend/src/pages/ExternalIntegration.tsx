import { useState } from 'react'
import { Link as LinkIcon, Settings, Activity, AlertCircle } from 'lucide-react'
import { ModuleGuard } from '../components/ModuleGuard'

export default function ExternalIntegration() {
  const [integrations] = useState([
    {
      id: 1,
      name: 'Sistema de Laboratório',
      status: 'connected',
      lastSync: '2024-01-15 10:30',
      type: 'laboratory'
    },
    {
      id: 2,
      name: 'Plano de Saúde XYZ',
      status: 'disconnected',
      lastSync: '2024-01-10 15:20',
      type: 'insurance'
    }
  ])

  return (
    <ModuleGuard module="externalIntegration">
      <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrações Externas</h1>
        <p className="text-gray-600">Gerencie conexões com sistemas externos</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Integrações Ativas</h2>
          
          <div className="space-y-4">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <LinkIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">{integration.name}</h3>
                    <p className="text-sm text-gray-600">
                      Última sincronização: {integration.lastSync}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {integration.status === 'connected' ? (
                      <>
                        <Activity className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">Conectado</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-600">Desconectado</span>
                      </>
                    )}
                  </div>
                  
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Adicionar Nova Integração
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 text-blue-600 mt-0.5">
            ℹ️
          </div>
          <div>
            <h3 className="font-medium text-blue-800">Sobre as Integrações</h3>
            <p className="text-sm text-blue-700 mt-1">
              As integrações permitem conectar o sistema com laboratórios, planos de saúde 
              e outros sistemas externos para automatizar processos e sincronizar dados.
            </p>
          </div>
        </div>
      </div>
      </div>
    </ModuleGuard>
  )
}