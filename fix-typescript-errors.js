#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Lista de correções a serem aplicadas
const fixes = [
  // Remover imports React não utilizados
  {
    pattern: /import React,?\s*\{([^}]*)\}\s*from\s*['"]react['"]/g,
    replacement: 'import {$1} from \'react\'',
    files: ['**/*.tsx']
  },
  {
    pattern: /import React\s*from\s*['"]react['"]/g,
    replacement: '',
    files: ['**/*.tsx']
  },
  
  // Corrigir tipos ToastType
  {
    pattern: /showToast\(['"]([^'"]*)['"]\s*,\s*['"]error['"]\)/g,
    replacement: 'showToast(\'$1\', \'error\')',
    files: ['**/*.tsx']
  },
  {
    pattern: /showToast\(['"]([^'"]*)['"]\s*,\s*['"]success['"]\)/g,
    replacement: 'showToast(\'$1\', \'success\')',
    files: ['**/*.tsx']
  },
  {
    pattern: /showToast\(['"]([^'"]*)['"]\s*,\s*['"]warning['"]\)/g,
    replacement: 'showToast(\'$1\', \'warning\')',
    files: ['**/*.tsx']
  },
  {
    pattern: /showToast\(['"]([^'"]*)['"]\s*,\s*['"]info['"]\)/g,
    replacement: 'showToast(\'$1\', \'info\')',
    files: ['**/*.tsx']
  }
];

console.log('🔧 Iniciando correção de erros TypeScript...');

// Função para aplicar correções em um arquivo
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    fixes.forEach(fix => {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Corrigido: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Erro ao corrigir ${filePath}:`, error.message);
  }
}

// Buscar e corrigir arquivos
function findAndFixFiles(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findAndFixFiles(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fixFile(filePath);
    }
  });
}

// Executar correções
findAndFixFiles('./frontend/src');

console.log('🎉 Correções aplicadas!');