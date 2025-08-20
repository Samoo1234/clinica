import { Router } from 'express';
import { financialService } from '../services/financial';
import { authMiddleware } from '../middleware/auth';
import { supabaseAdmin as supabase } from '../config/supabase';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Payment routes
router.post('/payments', async (req, res) => {
  try {
    const payment = await financialService.createPayment(req.body);
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

router.get('/payments/:id', async (req, res) => {
  try {
    const payment = await financialService.getPayment(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

router.put('/payments/:id', async (req, res) => {
  try {
    const payment = await financialService.updatePayment(req.params.id, req.body);
    res.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

router.get('/appointments/:appointmentId/payments', async (req, res) => {
  try {
    const payments = await financialService.getPaymentsByAppointment(req.params.appointmentId);
    res.json(payments);
  } catch (error) {
    console.error('Error fetching appointment payments:', error);
    res.status(500).json({ error: 'Failed to fetch appointment payments' });
  }
});

router.get('/patients/:patientId/payments', async (req, res) => {
  try {
    const payments = await financialService.getPaymentsByPatient(req.params.patientId);
    res.json(payments);
  } catch (error) {
    console.error('Error fetching patient payments:', error);
    res.status(500).json({ error: 'Failed to fetch patient payments' });
  }
});

// Process payment
router.post('/payments/:id/process', async (req, res) => {
  try {
    const { payment_method, transaction_id, notes } = req.body;
    
    const { data, error } = await supabase
      .rpc('process_payment', {
        payment_uuid: req.params.id,
        payment_method_param: payment_method,
        transaction_id_param: transaction_id,
        notes_param: notes
      });

    if (error) {
      throw error;
    }

    const result = data[0];
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json({ message: result.message, payment_id: result.payment_id });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Payment installments
router.post('/payments/:id/installments', async (req, res) => {
  try {
    const { installments, total_amount } = req.body;
    const installmentData = await financialService.createPaymentInstallments(
      req.params.id,
      installments,
      total_amount
    );
    res.status(201).json(installmentData);
  } catch (error) {
    console.error('Error creating payment installments:', error);
    res.status(500).json({ error: 'Failed to create payment installments' });
  }
});

// Service prices
router.get('/service-prices', async (req, res) => {
  try {
    const servicePrices = await financialService.getServicePrices();
    res.json(servicePrices);
  } catch (error) {
    console.error('Error fetching service prices:', error);
    res.status(500).json({ error: 'Failed to fetch service prices' });
  }
});

router.post('/service-prices', async (req, res) => {
  try {
    const servicePrice = await financialService.createServicePrice(req.body);
    res.status(201).json(servicePrice);
  } catch (error) {
    console.error('Error creating service price:', error);
    res.status(500).json({ error: 'Failed to create service price' });
  }
});

router.put('/service-prices/:id', async (req, res) => {
  try {
    const servicePrice = await financialService.updateServicePrice(req.params.id, req.body);
    res.json(servicePrice);
  } catch (error) {
    console.error('Error updating service price:', error);
    res.status(500).json({ error: 'Failed to update service price' });
  }
});

// Financial reports
router.get('/reports/accounts-receivable', async (req, res) => {
  try {
    const accountsReceivable = await financialService.getAccountsReceivable();
    res.json(accountsReceivable);
  } catch (error) {
    console.error('Error fetching accounts receivable:', error);
    res.status(500).json({ error: 'Failed to fetch accounts receivable' });
  }
});

router.get('/reports/overdue-payments', async (req, res) => {
  try {
    const overduePayments = await financialService.getOverduePayments();
    res.json(overduePayments);
  } catch (error) {
    console.error('Error fetching overdue payments:', error);
    res.status(500).json({ error: 'Failed to fetch overdue payments' });
  }
});

router.get('/reports/financial-summary', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }

    const summary = await financialService.getFinancialSummary(
      start_date as string,
      end_date as string
    );
    res.json(summary);
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ error: 'Failed to fetch financial summary' });
  }
});

// Financial dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const { data, error } = await supabase
      .rpc('get_financial_dashboard', {
        start_date: start_date as string || undefined,
        end_date: end_date as string || undefined
      });

    if (error) {
      throw error;
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Error fetching financial dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch financial dashboard' });
  }
});

// Payment alerts
router.get('/alerts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .rpc('get_payment_alerts');

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching payment alerts:', error);
    res.status(500).json({ error: 'Failed to fetch payment alerts' });
  }
});

// Patient financial summary
router.get('/patients/:patientId/summary', async (req, res) => {
  try {
    const { data, error } = await supabase
      .rpc('get_patient_financial_summary', {
        patient_uuid: req.params.patientId
      });

    if (error) {
      throw error;
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Error fetching patient financial summary:', error);
    res.status(500).json({ error: 'Failed to fetch patient financial summary' });
  }
});

// Calculate revenue for period
router.get('/reports/revenue', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }

    const { data, error } = await supabase
      .rpc('calculate_revenue', {
        start_date: start_date as string,
        end_date: end_date as string
      });

    if (error) {
      throw error;
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Error calculating revenue:', error);
    res.status(500).json({ error: 'Failed to calculate revenue' });
  }
});

// Count overdue payments (admin only)
router.get('/admin/overdue-count', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data, error } = await supabase
      .rpc('count_overdue_payments');

    if (error) {
      throw error;
    }

    res.json({ message: `Found ${data} overdue payments`, count: data });
  } catch (error) {
    console.error('Error counting overdue payments:', error);
    res.status(500).json({ error: 'Failed to count overdue payments' });
  }
});

// Financial transactions
router.get('/transactions', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const transactions = await financialService.getFinancialTransactions(
      start_date as string,
      end_date as string
    );
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching financial transactions:', error);
    res.status(500).json({ error: 'Failed to fetch financial transactions' });
  }
});

router.post('/transactions', async (req, res) => {
  try {
    const transaction = await financialService.createFinancialTransaction(req.body);
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating financial transaction:', error);
    res.status(500).json({ error: 'Failed to create financial transaction' });
  }
});

export default router;