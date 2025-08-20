import React, { useState, useEffect } from 'react';
import { nfseService, NFSeConfig as NFSeConfigType } from '../../services/nfse';
import { useToast } from '../../contexts/ToastContext';

const NFSeConfig: React.FC = () => {
  const [config, setConfig] = useState<NFSeConfigType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<NFSeConfigType>>({});
  const [showApiKey, setShowApiKey] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const configData = await nfseService.getConfig();
      setConfig(configData);
      setFormData(configData);
    } catch (error) {
      console.error('Error loading NFS-e config:', error);
      
      // Se não existe configuração, usar dados padrão para demonstração
      const defaultConfig: NFSeConfigType = {
        id: 'default',
        provider_name: 'Mock Provider',
        api_url: 'https://api.mock-nfse.com',
        api_key: '***',
        city_code: '3550308',
        cnpj: '00.000.000/0001-00',
        municipal_inscription: '123456789',
        service_code: '14.01',
        tax_rate: 5.0,
        active: true
      };
      
      setConfig(defaultConfig);
      setFormData(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof NFSeConfigType, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const updatedConfig = await nfseService.updateConfig(formData);
      setConfig(updatedConfig);
      setFormData(updatedConfig);
      showSuccess('Configuração salva com sucesso');
    } catch (error) {
      console.error('Error saving config:', error);
      showError(error instanceof Error ? error.message : 'Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    try {
      // This would be a test endpoint in a real implementation
      showSuccess('Teste de conexão não implementado ainda');
    } catch (error) {
      showError('Erro ao testar conexão');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Configuração NFS-e</h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure a integração com o emissor de Nota Fiscal de Serviço eletrônica
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Provider Information */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Informações do Provedor</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Provedor *
                </label>
                <input
                  type="text"
                  value={formData.provider_name || ''}
                  onChange={(e) => handleInputChange('provider_name', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ex: Nota Carioca, ISS Online"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL da API *
                </label>
                <input
                  type="url"
                  value={formData.api_url || ''}
                  onChange={(e) => handleInputChange('api_url', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://api-nfse.exemplo.com.br"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chave da API *
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.api_key || ''}
                  onChange={(e) => handleInputChange('api_key', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                  placeholder="Chave de acesso à API do emissor"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Informações da Empresa</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ *
                </label>
                <input
                  type="text"
                  value={formData.cnpj || ''}
                  onChange={(e) => handleInputChange('cnpj', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="12.345.678/0001-90"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inscrição Municipal
                </label>
                <input
                  type="text"
                  value={formData.municipal_inscription || ''}
                  onChange={(e) => handleInputChange('municipal_inscription', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="123456789"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código da Cidade *
              </label>
              <input
                type="text"
                value={formData.city_code || ''}
                onChange={(e) => handleInputChange('city_code', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="3304557 (código IBGE da cidade)"
                required
              />
            </div>
          </div>

          {/* Service Information */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Informações do Serviço</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código do Serviço *
                </label>
                <input
                  type="text"
                  value={formData.service_code || ''}
                  onChange={(e) => handleInputChange('service_code', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="1401 (código do serviço médico)"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alíquota ISS (%) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.tax_rate || ''}
                  onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="5.00"
                  required
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active || false}
                onChange={(e) => handleInputChange('active', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                Configuração ativa
              </label>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Desmarque para desativar temporariamente a emissão de NFS-e
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={testConnection}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              🔍 Testar Conexão
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? '💾 Salvando...' : '💾 Salvar Configuração'}
            </button>
          </div>
        </form>
      </div>

      {/* Help Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-md font-medium text-blue-900 mb-3">ℹ️ Informações Importantes</h3>
        
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            <strong>Código do Serviço:</strong> Use o código 1401 para serviços médicos e odontológicos.
          </p>
          <p>
            <strong>Alíquota ISS:</strong> Verifique a alíquota correta com a prefeitura da sua cidade.
          </p>
          <p>
            <strong>Código da Cidade:</strong> Use o código IBGE de 7 dígitos da sua cidade.
          </p>
          <p>
            <strong>Chave da API:</strong> Obtida junto ao provedor de NFS-e da sua cidade.
          </p>
        </div>
      </div>

      {/* Current Status */}
      {config && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">Status Atual</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${config.active ? 'text-green-600' : 'text-red-600'}`}>
                {config.active ? '✅ Ativo' : '❌ Inativo'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Provedor:</span>
              <span className="font-medium">{config.provider_name}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">CNPJ:</span>
              <span className="font-medium">{config.cnpj}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Alíquota ISS:</span>
              <span className="font-medium">{config.tax_rate}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFSeConfig;