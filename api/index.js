// Vercel serverless function para o backend
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

// Simple financial dashboard endpoint for testing
app.get('/api/financial/dashboard', (req, res) => {
  // Return mock data for now since we can't import TypeScript directly
  res.json({
    total_revenue: 0,
    paid_revenue: 0,
    pending_revenue: 0,
    overdue_revenue: 0,
    total_appointments: 0,
    paid_appointments: 0,
    pending_appointments: 0,
    overdue_appointments: 0,
    average_appointment_value: 0,
    payment_rate_percentage: 0
  });
});

// Simple auth endpoint
app.post('/api/auth/login', (req, res) => {
  // Mock login for demo
  res.json({
    user: { id: '1', name: 'Dr. Admin', email: 'admin@clinica.com', role: 'admin' },
    token: 'mock-token-' + Date.now()
  });
});

// Simple patients endpoint
app.get('/api/patients', (req, res) => {
  // Return empty array for now
  res.json([]);
});

// Simple appointments endpoint
app.get('/api/appointments', (req, res) => {
  // Return empty array for now
  res.json([]);
});

module.exports = app;