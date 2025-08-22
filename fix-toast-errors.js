const fs = require('fs');
const path = require('path');

// Lista de arquivos para corrigir
const filesToFix = [
  'frontend/src/components/medical-records/AttachmentUpload.tsx',
  'frontend/src/components/medical-records/MedicalRecordForm.tsx',
  'frontend/src/components/medical-records/MedicalRecordView.tsx',
  'frontend/src/components/medical-records/PatientSelector.tsx',
  'frontend/src/pages/MedicalRecords.tsx'
];

// Mapeamento de strings para tipos corretos
const replacements = [
  { from: 'showError("Erro ao carregar anexos")', to: 'showError("Erro", "Erro ao carregar anexos")' },
  { from: 'showError("Tipo de arquivo não permitido. Use imagens, PDFs ou documentos Word.")', to: 'showError("Erro", "Tipo de arquivo não permitido. Use imagens, PDFs ou documentos Word.")' },
  { from: 'showError("Arquivo muito grande. Limite de 10MB.")', to: 'showError("Erro", "Arquivo muito grande. Limite de 10MB.")' },
  { from: 'showSuccess("Arquivo enviado com sucesso")', to: 'showSuccess("Sucesso", "Arquivo enviado com sucesso")' },
  { from: 'showError("Erro ao enviar arquivo")', to: 'showError("Erro", "Erro ao enviar arquivo")' },
  { from: 'showError("Erro ao baixar arquivo")', to: 'showError("Erro", "Erro ao baixar arquivo")' },
  { from: 'showSuccess("Anexo excluído com sucesso")', to: 'showSuccess("Sucesso", "Anexo excluído com sucesso")' },
  { from: 'showError("Erro ao excluir anexo")', to: 'showError("Erro", "Erro ao excluir anexo")' },
  { from: 'showError("Erro ao salvar prontuário")', to: 'showError("Erro", "Erro ao salvar prontuário")' },
  { from: 'showError("Erro ao buscar pacientes")', to: 'showError("Erro", "Erro ao buscar pacientes")' },
  { from: 'showError("Erro ao carregar dados do paciente")', to: 'showError("Erro", "Erro ao carregar dados do paciente")' },
  { from: 'showError("Erro ao carregar prontuário")', to: 'showError("Erro", "Erro ao carregar prontuário")' },
  { from: 'showError("Erro ao carregar prontuários")', to: 'showError("Erro", "Erro ao carregar prontuários")' },
  { from: 'showSuccess("Prontuário salvo com sucesso")', to: 'showSuccess("Sucesso", "Prontuário salvo com sucesso")' }
];

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    replacements.forEach(replacement => {
      if (content.includes(replacement.from)) {
        content = content.replace(new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.to);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
    }
  }
});

console.log('Toast errors fixed!');