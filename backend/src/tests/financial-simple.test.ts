import { describe, it, expect } from '@jest/globals';
import { financialService } from '../services/financial';

describe('Financial Service - Simple Tests', () => {
  it('should be defined', () => {
    expect(financialService).toBeDefined();
  });

  it('should have required methods', () => {
    expect(typeof financialService.createPayment).toBe('function');
    expect(typeof financialService.getPayment).toBe('function');
    expect(typeof financialService.updatePayment).toBe('function');
    expect(typeof financialService.getServicePrices).toBe('function');
    expect(typeof financialService.getAccountsReceivable).toBe('function');
    expect(typeof financialService.getFinancialSummary).toBe('function');
  });

  it('should format currency correctly', () => {
    expect(financialService.formatCurrency(150.00)).toBe('R$ 150,00');
    expect(financialService.formatCurrency(1250.50)).toBe('R$ 1.250,50');
  });

  it('should get payment method labels', () => {
    expect(financialService.getPaymentMethodLabel('cash')).toBe('Dinheiro');
    expect(financialService.getPaymentMethodLabel('credit_card')).toBe('Cartão de Crédito');
    expect(financialService.getPaymentMethodLabel('pix')).toBe('PIX');
  });

  it('should get payment status labels', () => {
    expect(financialService.getPaymentStatusLabel('pending')).toBe('Pendente');
    expect(financialService.getPaymentStatusLabel('paid')).toBe('Pago');
    expect(financialService.getPaymentStatusLabel('pending', '2024-01-01')).toBe('Em Atraso'); // overdue payment
  });

  it('should get payment status colors', () => {
    expect(financialService.getPaymentStatusColor('pending')).toContain('yellow');
    expect(financialService.getPaymentStatusColor('paid')).toContain('green');
    expect(financialService.getPaymentStatusColor('pending', '2024-01-01')).toContain('red'); // overdue payment
  });
});