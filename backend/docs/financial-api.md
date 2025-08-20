# Financial Management API Documentation

## Overview

The Financial Management API provides comprehensive functionality for managing payments, service prices, financial reports, and payment alerts in the VisionCare system. This API supports the requirements for basic financial management as specified in Requirement 7.

## Base URL

```
/api/financial
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Payment Management

#### Create Payment
```http
POST /payments
```

**Request Body:**
```json
{
  "appointment_id": "uuid",
  "amount": 150.00,
  "payment_method": "cash|credit_card|debit_card|pix|bank_transfer|check|insurance",
  "status": "pending|paid|cancelled|refunded",
  "installments": 1,
  "installment_number": 1,
  "due_date": "2024-01-15",
  "notes": "Optional payment notes",
  "transaction_id": "Optional transaction ID"
}
```

**Response:**
```json
{
  "id": "uuid",
  "appointment_id": "uuid",
  "amount": 150.00,
  "payment_method": "cash",
  "status": "pending",
  "installments": 1,
  "installment_number": 1,
  "due_date": "2024-01-15",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z"
}
```

#### Get Payment
```http
GET /payments/:id
```

**Response:**
```json
{
  "id": "uuid",
  "appointment_id": "uuid",
  "amount": 150.00,
  "payment_method": "cash",
  "status": "pending",
  "appointment": {
    "id": "uuid",
    "scheduled_at": "2024-01-15T14:00:00Z",
    "patient": {
      "name": "João Silva",
      "cpf": "123.456.789-00"
    },
    "doctor": {
      "name": "Dr. Maria Santos"
    }
  }
}
```

#### Update Payment
```http
PUT /payments/:id
```

**Request Body:**
```json
{
  "status": "paid",
  "payment_date": "2024-01-15T10:00:00Z",
  "notes": "Payment received"
}
```

#### Process Payment
```http
POST /payments/:id/process
```

**Request Body:**
```json
{
  "payment_method": "credit_card",
  "transaction_id": "TXN123456",
  "notes": "Payment processed successfully"
}
```

**Response:**
```json
{
  "message": "Payment processed successfully",
  "payment_id": "uuid"
}
```

#### Get Payments by Appointment
```http
GET /appointments/:appointmentId/payments
```

#### Get Payments by Patient
```http
GET /patients/:patientId/payments
```

### Service Price Management

#### Get Service Prices
```http
GET /service-prices
```

**Response:**
```json
[
  {
    "id": "uuid",
    "service_name": "Consulta Oftalmológica",
    "description": "Consulta de rotina com oftalmologista",
    "base_price": 150.00,
    "insurance_price": 120.00,
    "active": true,
    "created_at": "2024-01-01T10:00:00Z"
  }
]
```

#### Create Service Price
```http
POST /service-prices
```

**Request Body:**
```json
{
  "service_name": "Exame de Refração",
  "description": "Exame para correção visual",
  "base_price": 80.00,
  "insurance_price": 60.00,
  "active": true
}
```

#### Update Service Price
```http
PUT /service-prices/:id
```

### Financial Reports

#### Get Accounts Receivable
```http
GET /reports/accounts-receivable
```

**Response:**
```json
[
  {
    "id": "uuid",
    "appointment_id": "uuid",
    "amount": 150.00,
    "status": "pending",
    "due_date": "2024-01-15",
    "patient_name": "João Silva",
    "patient_cpf": "123.456.789-00",
    "patient_phone": "(11) 99999-9999",
    "doctor_name": "Dr. Maria Santos",
    "payment_status_extended": "overdue",
    "days_overdue": 5
  }
]
```

#### Get Overdue Payments
```http
GET /reports/overdue-payments
```

#### Get Financial Summary
```http
GET /reports/financial-summary?start_date=2024-01-01&end_date=2024-01-31
```

**Response:**
```json
{
  "totalIncome": 15000.00,
  "totalExpenses": 5000.00,
  "netIncome": 10000.00,
  "totalPending": 3000.00,
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }
}
```

#### Calculate Revenue
```http
GET /reports/revenue?start_date=2024-01-01&end_date=2024-01-31
```

**Response:**
```json
{
  "total_revenue": 15000.00,
  "paid_revenue": 12000.00,
  "pending_revenue": 2000.00,
  "overdue_revenue": 1000.00
}
```

### Financial Dashboard

#### Get Dashboard Data
```http
GET /dashboard?start_date=2024-01-01&end_date=2024-01-31
```

**Response:**
```json
{
  "total_revenue": 15000.00,
  "paid_revenue": 12000.00,
  "pending_revenue": 2000.00,
  "overdue_revenue": 1000.00,
  "total_appointments": 100,
  "paid_appointments": 80,
  "pending_appointments": 15,
  "overdue_appointments": 5,
  "average_appointment_value": 150.00,
  "payment_rate_percentage": 80.0
}
```

### Payment Alerts

#### Get Payment Alerts
```http
GET /alerts
```

**Response:**
```json
[
  {
    "alert_type": "overdue",
    "alert_message": "Payment overdue by 5 days",
    "patient_name": "João Silva",
    "patient_phone": "(11) 99999-9999",
    "amount": 150.00,
    "due_date": "2024-01-10",
    "days_overdue": 5,
    "priority": "high"
  }
]
```

### Patient Financial Summary

#### Get Patient Financial Summary
```http
GET /patients/:patientId/summary
```

**Response:**
```json
{
  "patient_id": "uuid",
  "patient_name": "João Silva",
  "total_appointments": 5,
  "total_amount": 750.00,
  "paid_amount": 600.00,
  "pending_amount": 150.00,
  "overdue_amount": 0.00,
  "last_payment_date": "2024-01-10T10:00:00Z",
  "next_due_date": "2024-01-20"
}
```

### Payment Installments

#### Create Payment Installments
```http
POST /payments/:id/installments
```

**Request Body:**
```json
{
  "installments": 3,
  "total_amount": 450.00
}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "payment_id": "uuid",
    "installment_number": 1,
    "amount": 150.00,
    "due_date": "2024-01-15",
    "status": "pending"
  },
  {
    "id": "uuid",
    "payment_id": "uuid",
    "installment_number": 2,
    "amount": 150.00,
    "due_date": "2024-02-15",
    "status": "pending"
  },
  {
    "id": "uuid",
    "payment_id": "uuid",
    "installment_number": 3,
    "amount": 150.00,
    "due_date": "2024-03-15",
    "status": "pending"
  }
]
```

### Financial Transactions

#### Get Financial Transactions
```http
GET /transactions?start_date=2024-01-01&end_date=2024-01-31
```

#### Create Financial Transaction
```http
POST /transactions
```

**Request Body:**
```json
{
  "payment_id": "uuid",
  "transaction_type": "income|expense|refund",
  "amount": 150.00,
  "description": "Payment received for consultation",
  "category": "consultation",
  "transaction_date": "2024-01-15"
}
```

### Admin Functions

#### Count Overdue Payments
```http
GET /admin/overdue-count
```

**Note:** Requires admin role.

**Response:**
```json
{
  "message": "Found 5 overdue payments",
  "count": 5
}
```

## Database Functions

The API utilizes several Supabase database functions for complex calculations:

### calculate_revenue(start_date, end_date)
Calculates total, paid, pending, and overdue revenue for a given period.

### get_patient_financial_summary(patient_uuid)
Returns comprehensive financial summary for a specific patient.

### get_financial_dashboard(start_date, end_date)
Returns dashboard data with key financial metrics.

### process_payment(payment_uuid, payment_method, transaction_id, notes)
Processes a payment and updates related records atomically.

### mark_overdue_payments()
Marks payments as overdue based on due date.

### get_payment_alerts()
Returns payment alerts with priority levels.

## Database Views

The system includes several views for reporting:

- `accounts_receivable`: Pending payments with patient details
- `payment_history`: Complete payment history with details
- `overdue_payments`: Overdue payments with severity levels
- `monthly_financial_performance`: Monthly financial metrics
- `patient_payment_summary`: Patient-level payment summaries
- `service_performance`: Service-level performance metrics

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

Error responses include a descriptive message:

```json
{
  "error": "Payment not found"
}
```

## Requirements Compliance

This API fulfills the requirements specified in Requirement 7 - Basic Financial Management:

1. **7.1**: Allows defining procedure values when scheduling appointments
2. **7.2**: Records payment method and status when payment is made
3. **7.3**: Displays accounts receivable report for open consultations
4. **7.4**: Shows patient payment history when searching financial information
5. **7.5**: Visually highlights overdue payments in the pending list

## Usage Examples

### Creating a Payment for an Appointment

```javascript
const payment = await fetch('/api/financial/payments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    appointment_id: 'appointment-uuid',
    amount: 150.00,
    payment_method: 'credit_card',
    status: 'pending',
    installments: 1,
    installment_number: 1,
    due_date: '2024-01-15'
  })
});
```

### Processing a Payment

```javascript
const result = await fetch(`/api/financial/payments/${paymentId}/process`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    payment_method: 'credit_card',
    transaction_id: 'TXN123456',
    notes: 'Payment processed successfully'
  })
});
```

### Getting Financial Dashboard

```javascript
const dashboard = await fetch('/api/financial/dashboard?start_date=2024-01-01&end_date=2024-01-31', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```