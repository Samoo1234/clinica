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
const financialRoutes = require('../backend/src/routes/financial');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/financial', financialRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

module.exports = app;