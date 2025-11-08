// Vercel Serverless Function Entry Point
const express = require('express');

// Importa o app Express
let app;
try {
  app = require('../dist/index.js').default || require('../dist/index.js');
} catch (error) {
  console.error('Erro ao carregar app:', error);
  app = express();
  app.all('*', (req, res) => {
    res.status(500).json({ error: 'Failed to load application', details: error.message });
  });
}

// Export para Vercel
module.exports = app;

