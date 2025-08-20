# Reports API Documentation

## Overview

The Reports API provides comprehensive reporting and analytics functionality for the VisionCare clinic management system. It includes dashboard KPIs, appointment reports, financial reports, doctor performance metrics, and consultation type analysis.

## Base URL

```
/api/reports
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Dashboard KPIs

#### GET /dashboard/kpis

Returns key performance indicators for the dashboard.

**Response:**
```json
{
  "total_patients": 150,
  "new_patients_this_month": 12,
  "total_appointments_this_month": 85,
  "completed_appointments_this_month": 78,
  "completion_rate": 91.8,
  "total_revenue_this_month": 12750.00,
  "pending_revenue": 1250.00,
  "average_consultation_value": 150.00,
  "active_doctors": 3,
  "medical_records_this_month": 78
}
```

### Appointment Reports

#### GET /appointments

Returns detailed appointment report with optional filters.

**Query Parameters:**
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)
- `doctorId` (optional): Filter by specific doctor
- `status` (optional): Filter by appointment status

**Response:**
```json
[
  {
    "appointment_id": "uuid",
    "patient_name": "João Silva",
    "patient_cpf": "123.456.789-00",
    "doctor_name": "Dr. Maria Santos",
    "scheduled_at": "2024-01-15T10:00:00Z",
    "status": "completed",
    "value": 150.00,
    "payment_status": "paid",
    "consultation_date": "2024-01-15",
    "diagnosis": "Miopia"
  }
]
```

#### GET /appointments/export

Exports appointment report as CSV file.

**Query Parameters:** Same as GET /appointments

**Response:** CSV file download

### Financial Reports

#### GET /financial

Returns financial report data grouped by period.

**Query Parameters:**
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)
- `groupBy` (optional): Grouping period ('day', 'week', 'month') - default: 'month'

**Response:**
```json
[
  {
    "period": "2024-01",
    "total_appointments": 85,
    "completed_appointments": 78,
    "total_revenue": 12750.00,
    "paid_revenue": 11500.00,
    "pending_revenue": 1250.00,
    "completion_rate": 91.8,
    "payment_rate": 90.2
  }
]
```

#### GET /financial/export

Exports financial report as CSV file.

**Query Parameters:** Same as GET /financial

**Response:** CSV file download

### Doctor Performance

#### GET /doctors/performance

Returns performance metrics for doctors.

**Query Parameters:**
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)
- `doctorId` (optional): Filter by specific doctor

**Response:**
```json
[
  {
    "doctor_id": "uuid",
    "doctor_name": "Dr. Maria Santos",
    "total_appointments": 45,
    "completed_appointments": 42,
    "cancelled_appointments": 2,
    "no_show_appointments": 1,
    "total_revenue": 6750.00,
    "average_consultation_value": 150.00,
    "completion_rate": 93.3,
    "medical_records_count": 42
  }
]
```

#### GET /doctors/performance/export

Exports doctor performance report as CSV file.

**Query Parameters:** Same as GET /doctors/performance

**Response:** CSV file download

### Consultation Types

#### GET /consultations/types

Returns analysis of consultation types by diagnosis.

**Query Parameters:**
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)

**Response:**
```json
[
  {
    "diagnosis_category": "Miopia",
    "consultation_count": 25,
    "unique_patients": 20,
    "percentage": 35.7
  },
  {
    "diagnosis_category": "Hipermetropia",
    "consultation_count": 18,
    "unique_patients": 15,
    "percentage": 25.7
  }
]
```

### Statistics Views

#### GET /stats/appointments

Returns appointment statistics from the database view.

**Query Parameters:**
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)
- `doctorId` (optional): Filter by specific doctor

**Response:**
```json
[
  {
    "month": "2024-01-01T00:00:00Z",
    "week": "2024-01-01T00:00:00Z",
    "day": "2024-01-15T00:00:00Z",
    "doctor_id": "uuid",
    "doctor_name": "Dr. Maria Santos",
    "status": "completed",
    "payment_status": "paid",
    "appointment_count": 5,
    "total_value": 750.00,
    "average_value": 150.00
  }
]
```

#### GET /stats/financial

Returns financial summary from the database view.

**Query Parameters:**
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)

**Response:**
```json
[
  {
    "month": "2024-01-01T00:00:00Z",
    "day": "2024-01-15T00:00:00Z",
    "total_appointments": 5,
    "paid_appointments": 4,
    "pending_appointments": 1,
    "total_revenue": 750.00,
    "received_revenue": 600.00,
    "pending_revenue": 150.00
  }
]
```

#### GET /stats/monthly

Returns monthly KPIs from the database view.

**Query Parameters:**
- `limit` (optional): Number of months to return (default: 12)

**Response:**
```json
[
  {
    "month": "2024-01-01T00:00:00Z",
    "total_patients": 150,
    "new_patients_this_month": 12,
    "total_appointments": 85,
    "completed_appointments": 78,
    "missed_appointments": 7,
    "completion_rate": 91.76,
    "total_revenue": 12750.00,
    "collected_revenue": 11500.00,
    "medical_records_created": 78
  }
]
```

### Utility Endpoints

#### GET /doctors

Returns list of available doctors for filtering.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Dr. Maria Santos",
    "email": "maria@clinic.com"
  }
]
```

#### GET /summary

Returns comprehensive report summary with all key metrics.

**Query Parameters:**
- `startDate` (optional): Start date filter (YYYY-MM-DD)
- `endDate` (optional): End date filter (YYYY-MM-DD)
- `doctorId` (optional): Filter by specific doctor

**Response:**
```json
{
  "appointmentStats": [...],
  "financialSummary": [...],
  "consultationTypes": [...],
  "kpis": {...}
}
```

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (invalid or missing token)
- `403`: Forbidden (insufficient permissions)
- `500`: Internal Server Error

## Database Functions

The Reports API uses several Supabase database functions:

### Functions
- `get_appointment_report(start_date, end_date, doctor_id_filter, status_filter)`
- `get_financial_report(start_date, end_date, group_by_period)`
- `get_doctor_performance_report(start_date, end_date, doctor_id_filter)`
- `get_consultation_types_report(start_date, end_date)`
- `get_dashboard_kpis(period_months)`

### Views
- `appointment_stats`: Aggregated appointment statistics
- `patient_demographics`: Patient demographic analysis
- `financial_summary`: Financial summary by period
- `doctor_performance`: Doctor performance metrics
- `consultation_analysis`: Consultation type analysis
- `monthly_kpis`: Monthly key performance indicators

## Usage Examples

### Get Dashboard KPIs
```javascript
const response = await fetch('/api/reports/dashboard/kpis', {
  headers: { 'Authorization': `Bearer ${token}` }
})
const kpis = await response.json()
```

### Get Filtered Appointment Report
```javascript
const params = new URLSearchParams({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  doctorId: 'doctor-uuid',
  status: 'completed'
})

const response = await fetch(`/api/reports/appointments?${params}`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
const appointments = await response.json()
```

### Export Financial Report
```javascript
const params = new URLSearchParams({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  groupBy: 'month'
})

const response = await fetch(`/api/reports/financial/export?${params}`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
const blob = await response.blob()
// Handle file download
```