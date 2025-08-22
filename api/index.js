// Vercel serverless function para o backend
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('../backend/src/routes/auth');
const patientsRoutes = require('../backend/src/routes/patients');
const appointmentsRoutes = require('../backend/src/routes/appointments');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/appointments', appointmentsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

module.exports = app;