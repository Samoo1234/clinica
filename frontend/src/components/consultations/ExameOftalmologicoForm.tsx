/**
 * Formulário de Exame Oftalmológico
 * Campos específicos para consulta em clínica oftalmológica
 */

import { useState, useEffect } from 'react'
import { Eye, Save, X } from 'lucide-react'
import { ExameOftalmologico, RefractionData } from '../../types/consultations'

interface ExameOftalmologicoFormProps {
  exame?: ExameOftalmologico
  editing: boolean
  onSave: (exame: ExameOftalmologico) => void
  onCancel: () => void
  readOnly?: boolean
}

export function ExameOftalmologicoForm({
  exame,
  editing,
  onSave,
  onCancel,
  readOnly = false
}: ExameOftalmologicoFormProps) {
  const [formData, setFormData] = useState<ExameOftalmologico>(exame || {})

  useEffect(() => {
    if (exame) {
      setFormData(exame)
    }
  }, [exame])

  const handleChange = (field: keyof ExameOftalmologico, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleRefracaoChange = (
    olho: 'refracaoOD' | 'refracaoOE',
    field: keyof RefractionData,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [olho]: {
        ...prev[olho],
        [field]: value
      }
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!editing && readOnly) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        {!exame || Object.keys(exame).length === 0 ? (
          <p className="text-gray-500 italic">Nenhum exame registrado ainda</p>
        ) : (
          <div className="space-y-4">
            {/* Acuidade Visual */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Acuidade Visual
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">OD:</span>{' '}
                  <span className="font-medium">{exame.acuidadeOD || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">OE:</span>{' '}
                  <span className="font-medium">{exame.acuidadeOE || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">AO:</span>{' '}
                  <span className="font-medium">{exame.acuidadeAO || '-'}</span>
                </div>
              </div>
            </div>

            {/* Pressão Intraocular */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Pressão Intraocular (mmHg)</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">OD:</span>{' '}
                  <span className="font-medium">{exame.pressaoOD || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">OE:</span>{' '}
                  <span className="font-medium">{exame.pressaoOE || '-'}</span>
                </div>
              </div>
            </div>

            {/* Refração OD */}
            {exame.refracaoOD && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Refração OD</h4>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div><span className="text-gray-500">Esf:</span> {exame.refracaoOD.esferico || '-'}</div>
                  <div><span className="text-gray-500">Cil:</span> {exame.refracaoOD.cilindrico || '-'}</div>
                  <div><span className="text-gray-500">Eixo:</span> {exame.refracaoOD.eixo || '-'}°</div>
                  <div><span className="text-gray-500">DNP:</span> {exame.refracaoOD.dnp || '-'}mm</div>
                </div>
              </div>
            )}

            {/* Refração OE */}
            {exame.refracaoOE && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Refração OE</h4>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div><span className="text-gray-500">Esf:</span> {exame.refracaoOE.esferico || '-'}</div>
                  <div><span className="text-gray-500">Cil:</span> {exame.refracaoOE.cilindrico || '-'}</div>
                  <div><span className="text-gray-500">Eixo:</span> {exame.refracaoOE.eixo || '-'}°</div>
                  <div><span className="text-gray-500">DNP:</span> {exame.refracaoOE.dnp || '-'}mm</div>
                </div>
              </div>
            )}

            {/* Exames Complementares */}
            {exame.biomicroscopia && (
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Biomicroscopia</h4>
                <p className="text-sm text-gray-600">{exame.biomicroscopia}</p>
              </div>
            )}

            {exame.fundoscopia && (
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Fundoscopia</h4>
                <p className="text-sm text-gray-600">{exame.fundoscopia}</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 space-y-6">
      {/* Acuidade Visual */}
      <div>
        <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Acuidade Visual
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">OD (Olho Direito)</label>
            <input
              type="text"
              value={formData.acuidadeOD || ''}
              onChange={(e) => handleChange('acuidadeOD', e.target.value)}
              placeholder="20/20"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">OE (Olho Esquerdo)</label>
            <input
              type="text"
              value={formData.acuidadeOE || ''}
              onChange={(e) => handleChange('acuidadeOE', e.target.value)}
              placeholder="20/20"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">AO (Ambos)</label>
            <input
              type="text"
              value={formData.acuidadeAO || ''}
              onChange={(e) => handleChange('acuidadeAO', e.target.value)}
              placeholder="20/20"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Pressão Intraocular */}
      <div>
        <h4 className="font-medium text-gray-700 mb-3">Pressão Intraocular (Tonometria)</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">OD (mmHg)</label>
            <input
              type="number"
              value={formData.pressaoOD || ''}
              onChange={(e) => handleChange('pressaoOD', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="15"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">OE (mmHg)</label>
            <input
              type="number"
              value={formData.pressaoOE || ''}
              onChange={(e) => handleChange('pressaoOE', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="15"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Refração OD */}
      <div>
        <h4 className="font-medium text-gray-700 mb-3">Refração - Olho Direito (OD)</h4>
        <div className="grid grid-cols-5 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Esférico</label>
            <input
              type="text"
              value={formData.refracaoOD?.esferico || ''}
              onChange={(e) => handleRefracaoChange('refracaoOD', 'esferico', e.target.value)}
              placeholder="+0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Cilíndrico</label>
            <input
              type="text"
              value={formData.refracaoOD?.cilindrico || ''}
              onChange={(e) => handleRefracaoChange('refracaoOD', 'cilindrico', e.target.value)}
              placeholder="-0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Eixo (°)</label>
            <input
              type="number"
              min="0"
              max="180"
              value={formData.refracaoOD?.eixo || ''}
              onChange={(e) => handleRefracaoChange('refracaoOD', 'eixo', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="180"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Adição</label>
            <input
              type="text"
              value={formData.refracaoOD?.adicao || ''}
              onChange={(e) => handleRefracaoChange('refracaoOD', 'adicao', e.target.value)}
              placeholder="+2.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">DNP (mm)</label>
            <input
              type="number"
              value={formData.refracaoOD?.dnp || ''}
              onChange={(e) => handleRefracaoChange('refracaoOD', 'dnp', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="32"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Refração OE */}
      <div>
        <h4 className="font-medium text-gray-700 mb-3">Refração - Olho Esquerdo (OE)</h4>
        <div className="grid grid-cols-5 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Esférico</label>
            <input
              type="text"
              value={formData.refracaoOE?.esferico || ''}
              onChange={(e) => handleRefracaoChange('refracaoOE', 'esferico', e.target.value)}
              placeholder="+0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Cilíndrico</label>
            <input
              type="text"
              value={formData.refracaoOE?.cilindrico || ''}
              onChange={(e) => handleRefracaoChange('refracaoOE', 'cilindrico', e.target.value)}
              placeholder="-0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Eixo (°)</label>
            <input
              type="number"
              min="0"
              max="180"
              value={formData.refracaoOE?.eixo || ''}
              onChange={(e) => handleRefracaoChange('refracaoOE', 'eixo', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="180"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Adição</label>
            <input
              type="text"
              value={formData.refracaoOE?.adicao || ''}
              onChange={(e) => handleRefracaoChange('refracaoOE', 'adicao', e.target.value)}
              placeholder="+2.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">DNP (mm)</label>
            <input
              type="number"
              value={formData.refracaoOE?.dnp || ''}
              onChange={(e) => handleRefracaoChange('refracaoOE', 'dnp', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="32"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Exames Complementares */}
      <div>
        <h4 className="font-medium text-gray-700 mb-3">Exames Complementares</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Biomicroscopia (Lâmpada de Fenda)</label>
            <textarea
              value={formData.biomicroscopia || ''}
              onChange={(e) => handleChange('biomicroscopia', e.target.value)}
              rows={2}
              placeholder="Descreva os achados da biomicroscopia..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Fundoscopia (Fundo de Olho)</label>
            <textarea
              value={formData.fundoscopia || ''}
              onChange={(e) => handleChange('fundoscopia', e.target.value)}
              rows={2}
              placeholder="Descreva os achados da fundoscopia..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Motilidade Ocular</label>
              <input
                type="text"
                value={formData.motilidadeOcular || ''}
                onChange={(e) => handleChange('motilidadeOcular', e.target.value)}
                placeholder="Normal / Alterada"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Reflexos Pupilares</label>
              <input
                type="text"
                value={formData.reflexosPupilares || ''}
                onChange={(e) => handleChange('reflexosPupilares', e.target.value)}
                placeholder="Fotorreagentes / Isocóricas"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Botões */}
      {editing && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Salvar Exame
          </button>
        </div>
      )}
    </form>
  )
}
