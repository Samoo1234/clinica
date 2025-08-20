import { useState } from 'react'
import { Save, X } from 'lucide-react'

interface VitalSigns {
  bloodPressure?: string
  heartRate?: number
  temperature?: number
  weight?: number
  height?: number
}

interface VitalSignsFormProps {
  vitalSigns?: VitalSigns
  editing: boolean
  onSave: (vitalSigns: VitalSigns) => void
  onCancel: () => void
  readOnly: boolean
}

export function VitalSignsForm({
  vitalSigns = {},
  editing,
  onSave,
  onCancel
}: VitalSignsFormProps) {
  const [formData, setFormData] = useState<VitalSigns>(vitalSigns)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (field: keyof VitalSigns, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!editing) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        {Object.keys(vitalSigns).length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Nenhum sinal vital registrado
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vitalSigns.bloodPressure && (
              <div>
                <label className="text-sm font-medium text-gray-600">Pressão Arterial</label>
                <p className="text-gray-900">{vitalSigns.bloodPressure}</p>
              </div>
            )}
            {vitalSigns.heartRate && (
              <div>
                <label className="text-sm font-medium text-gray-600">Frequência Cardíaca</label>
                <p className="text-gray-900">{vitalSigns.heartRate} bpm</p>
              </div>
            )}
            {vitalSigns.temperature && (
              <div>
                <label className="text-sm font-medium text-gray-600">Temperatura</label>
                <p className="text-gray-900">{vitalSigns.temperature}°C</p>
              </div>
            )}
            {vitalSigns.weight && (
              <div>
                <label className="text-sm font-medium text-gray-600">Peso</label>
                <p className="text-gray-900">{vitalSigns.weight} kg</p>
              </div>
            )}
            {vitalSigns.height && (
              <div>
                <label className="text-sm font-medium text-gray-600">Altura</label>
                <p className="text-gray-900">{vitalSigns.height} cm</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pressão Arterial
          </label>
          <input
            type="text"
            placeholder="120/80"
            value={formData.bloodPressure || ''}
            onChange={(e) => handleChange('bloodPressure', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Frequência Cardíaca (bpm)
          </label>
          <input
            type="number"
            placeholder="72"
            value={formData.heartRate || ''}
            onChange={(e) => handleChange('heartRate', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Temperatura (°C)
          </label>
          <input
            type="number"
            step="0.1"
            placeholder="36.5"
            value={formData.temperature || ''}
            onChange={(e) => handleChange('temperature', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Peso (kg)
          </label>
          <input
            type="number"
            step="0.1"
            placeholder="70"
            value={formData.weight || ''}
            onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Altura (cm)
          </label>
          <input
            type="number"
            placeholder="175"
            value={formData.height || ''}
            onChange={(e) => handleChange('height', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center space-x-2 px-3 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Cancelar</span>
        </button>
        <button
          type="submit"
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Salvar</span>
        </button>
      </div>
    </form>
  )
}