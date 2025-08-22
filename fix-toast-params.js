const fs = require('fs');

// Lista de arquivos para corrigir
const filesToFix = [
  'frontend/src/components/medical-records/AttachmentUpload.tsx',
  'frontend/src/components/medical-records/MedicalRecordForm.tsx',
  'frontend/src/components/medical-records/MedicalRecordView.tsx',
  'frontend/src/components/medical-records/PatientSelector.tsx',
  'frontend/src/pages/MedicalRecords.tsx'
];

// Mapeamento de correções
const replacements = [
  { from: "showToast('Erro ao carregar anexos', 'error')", to: "showToast('error', 'Erro ao carregar anexos')" },
  { from: "showToast('Tipo de arquivo não permitido. Use imagens, PDFs ou documentos Word.', 'error')", to: "showToast('error', 'Tipo de arquivo não permitido', 'Use imagens, PDFs ou documentos Word.')" },
  { from: "showToast('Arquivo muito grande. Limite de 10MB.', 'error')", to: "showToast('error', 'Arquivo muito grande', 'Limite de 10MB.')" },
  { from: "showToast('Arquivo enviado com sucesso', 'success')", to: "showToast('success', 'Arquivo enviado com sucesso')" },
  { from: "showToast('Erro ao enviar arquivo', 'error')", to: "showToast('error', 'Erro ao enviar arquivo')" },
  { from: "showToast('Erro ao baixar arquivo', 'error')", to: "showToast('error', 'Erro ao baixar arquivo')" },
  { from: "showToast('Anexo excluído com sucesso', 'success')", to: "showToast('success', 'Anexo excluído com sucesso')" },
  { from: "showToast('Erro ao excluir anexo', 'error')", to: "showToast('error', 'Erro ao excluir anexo')" },
  { from: "showToast('Erro ao salvar prontuário', 'error')", to: "showToast('error', 'Erro ao salvar prontuário')" },
  { from: "showToast('Erro ao buscar pacientes', 'error')", to: "showToast('error', 'Erro ao buscar pacientes')" },
  { from: "showToast('Erro ao carregar dados do paciente', 'error')", to: "showToast('error', 'Erro ao carregar dados do paciente')" },
  { from: "showToast('Erro ao carregar prontuário', 'error')", to: "showToast('error', 'Erro ao carregar prontuário')" },
  { from: "showToast('Erro ao carregar prontuários', 'error')", to: "showToast('error', 'Erro ao carregar prontuários')" },
  { from: "showToast('Prontuário salvo com sucesso', 'success')", to: "showToast('success', 'Prontuário salvo com sucesso')" }
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

console.log('Toast parameters fixed!');