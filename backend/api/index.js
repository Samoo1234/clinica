// Vercel Serverless Function Entry Point
// Este arquivo faz o Express funcionar na Vercel

const app = require('../dist/index.js').default;

// Export como serverless function para Vercel
module.exports = app;

