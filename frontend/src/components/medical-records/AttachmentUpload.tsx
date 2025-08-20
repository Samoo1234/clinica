import React, { useState, useEffect, useRef } from 'react'
import { Attachment } from '../../types/database'
import { medicalRecordsService } from '../../services/medical-records'
import { useToast } from '../../contexts/ToastContext'
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  Download, 
  Trash2, 
  X,
  Eye,
  AlertCircle
} from 'lucide-react'

interface AttachmentUploadProps {
  recordId: string
}

export function AttachmentUpload({ recordId }: AttachmentUploadProps) {
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    loadAttachments()
  }, [recordId])

  const loadAttachments = async () => {
    try {
      setLoading(true)
      const attachmentList = await medicalRecordsService.getAttachmentsByRecordId(recordId)
      setAttachments(attachmentList)
    } catch (error) {
      console.error('Error loading attachments:', error)
      showToast('Erro ao carregar anexos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    
    Array.from(files).forEach(file => {
      uploadFile(file)
    })
  }

  const uploadFile = async (file: File) => {
    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      showToast('Tipo de arquivo não permitido. Use imagens, PDFs ou documentos Word.', 'error')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      showToast('Arquivo muito grande. Limite de 10MB.', 'error')
      return
    }

    try {
      setUploading(true)
      const attachment = await medicalRecordsService.uploadAttachment(recordId, file)
      setAttachments(prev => [attachment, ...prev])
      showToast('Arquivo enviado com sucesso', 'success')
    } catch (error) {
      console.error('Error uploading file:', error)
      showToast('Erro ao enviar arquivo', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (attachment: Attachment) => {
    try {
      const { downloadUrl, filename } = await medicalRecordsService.getAttachmentDownloadUrl(attachment.id)
      
      // Create temporary link and trigger download
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error('Error downloading file:', error)
      showToast('Erro ao baixar arquivo', 'error')
    }
  }

  const handleDelete = async (attachment: Attachment) => {
    if (!confirm('Tem certeza que deseja excluir este anexo?')) return

    try {
      await medicalRecordsService.deleteAttachment(attachment.id)
      setAttachments(prev => prev.filter(a => a.id !== attachment.id))
      showToast('Anexo excluído com sucesso', 'success')
    } catch (error) {
      console.error('Error deleting attachment:', error)
      showToast('Erro ao excluir anexo', 'error')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />
    } else if (mimeType === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />
    } else {
      return <File className="w-5 h-5 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number): string => {
    return medicalRecordsService.formatFileSize(bytes)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Carregando anexos...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver 
            ? 'border-primary-400 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <div className="space-y-2">
          <Upload className="mx-auto h-8 w-8 text-gray-400" />
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
            >
              Clique para enviar arquivos
            </button>
            <span className="text-gray-600"> ou arraste e solte aqui</span>
          </div>
          <p className="text-xs text-gray-500">
            Imagens, PDFs e documentos Word até 10MB
          </p>
        </div>
        
        {uploading && (
          <div className="mt-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-sm text-gray-600">Enviando...</span>
          </div>
        )}
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-medium text-gray-900">
              Anexos ({attachments.length})
            </h4>
          </div>
          
          <div className="divide-y divide-gray-200">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(attachment.mime_type)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.filename}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{formatFileSize(attachment.file_size)}</span>
                      <span>•</span>
                      <span>{formatDate(attachment.created_at)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownload(attachment)}
                    className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                    title="Baixar arquivo"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(attachment)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Excluir arquivo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Attachments Message */}
      {attachments.length === 0 && !uploading && (
        <div className="text-center py-4 text-gray-500 text-sm">
          Nenhum anexo adicionado ainda
        </div>
      )}
    </div>
  )
}