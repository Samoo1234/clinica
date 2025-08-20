import { useState } from 'react'
import { Save, X } from 'lucide-react'

interface ConsultationNotesProps {
  notes: string
  editing: boolean
  onSave: (notes: string) => void
  onCancel: () => void
  readOnly: boolean
}

export function ConsultationNotes({
  notes,
  editing,
  onSave,
  onCancel
}: ConsultationNotesProps) {
  const [formData, setFormData] = useState(notes)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!editing) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        {notes ? (
          <p className="text-gray-900 whitespace-pre-wrap">{notes}</p>
        ) : (
          <p className="text-gray-500 text-center py-4">
            Nenhuma observação registrada
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4">
      <div className="mb-4">
        <textarea
          value={formData}
          onChange={(e) => setFormData(e.target.value)}
          placeholder="Digite suas observações sobre a consulta..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={6}
        />
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