# Appointments API Documentation

## Overview

The Appointments API provides comprehensive functionality for managing medical appointments in the VisionCare system. It includes CRUD operations, conflict detection, availability checking, and real-time updates.

## Base URL

```
/api/appointments
```

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get Appointments

**GET** `/api/appointments`

Retrieve appointments with optional filtering and pagination.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `doctorId` | string | Filter by doctor ID |
| `patientId` | string | Filter by patient ID |
| `date` | string | Filter by specific date (YYYY-MM-DD) |
| `status` | string | Filter by appointment status |
| `limit` | number | Number of results to return (default: 10) |
| `offset` | number | Number of results to skip (default: 0) |

#### Response

```json
{
  "appointments": [
    {
      "id": "uuid",
      "patient_id": "uuid",
      "doctor_id": "uuid",
      "scheduled_at": "2024-01-15T10:00:00Z",
      "duration_minutes": 30,
      "status": "scheduled",
      "notes": "Regular checkup",
      "value": 150.00,
      "payment_status": "pending",
      "created_at": "2024-01-10T08:00:00Z",
      "updated_at": "2024-01-10T08:00:00Z",
      "patient": {
        "id": "uuid",
        "name": "John Doe",
        "cpf": "12345678901",
        "phone": "(11) 99999-9999"
      },
      "doctor": {
        "id": "uuid",
        "name": "Dr. Smith",
        "email": "dr.smith@visioncare.com"
      }
    }
  ],
  "total": 25
}
```

### 2. Get Appointment by ID

**GET** `/api/appointments/:id`

Retrieve a specific appointment by its ID.

#### Response

```json
{
  "id": "uuid",
  "patient_id": "uuid",
  "doctor_id": "uuid",
  "scheduled_at": "2024-01-15T10:00:00Z",
  "duration_minutes": 30,
  "status": "scheduled",
  "notes": "Regular checkup",
  "value": 150.00,
  "payment_status": "pending",
  "created_at": "2024-01-10T08:00:00Z",
  "updated_at": "2024-01-10T08:00:00Z",
  "patient": {
    "id": "uuid",
    "name": "John Doe",
    "cpf": "12345678901",
    "phone": "(11) 99999-9999",
    "email": "john@email.com"
  },
  "doctor": {
    "id": "uuid",
    "name": "Dr. Smith",
    "email": "dr.smith@visioncare.com"
  }
}
```

### 3. Create Appointment

**POST** `/api/appointments`

Create a new appointment with automatic conflict detection.

#### Request Body

```json
{
  "patient_id": "uuid",
  "doctor_id": "uuid",
  "scheduled_at": "2024-01-15T10:00:00Z",
  "duration_minutes": 30,
  "status": "scheduled",
  "notes": "Regular checkup",
  "value": 150.00,
  "payment_status": "pending"
}
```

#### Required Fields

- `patient_id`
- `doctor_id`
- `scheduled_at`

#### Response

Returns the created appointment with patient and doctor details (same format as GET by ID).

#### Error Responses

- `400 Bad Request`: Missing required fields
- `409 Conflict`: Time conflict detected
- `500 Internal Server Error`: Server error

### 4. Update Appointment

**PUT** `/api/appointments/:id`

Update an existing appointment with conflict checking for time changes.

#### Request Body

```json
{
  "scheduled_at": "2024-01-15T11:00:00Z",
  "duration_minutes": 45,
  "status": "confirmed",
  "notes": "Updated appointment notes",
  "value": 200.00,
  "payment_status": "paid"
}
```

#### Response

Returns the updated appointment with patient and doctor details.

#### Error Responses

- `404 Not Found`: Appointment not found
- `409 Conflict`: Time conflict detected
- `500 Internal Server Error`: Server error

### 5. Update Appointment Status

**PATCH** `/api/appointments/:id/status`

Update only the status of an appointment.

#### Request Body

```json
{
  "status": "confirmed"
}
```

#### Valid Status Values

- `scheduled`
- `confirmed`
- `in_progress`
- `completed`
- `cancelled`
- `no_show`

#### Response

Returns the updated appointment with patient and doctor details.

### 6. Delete Appointment

**DELETE** `/api/appointments/:id`

Delete an appointment. Note: Completed appointments and appointments with associated medical records cannot be deleted.

#### Response

```json
{
  "success": true
}
```

#### Error Responses

- `400 Bad Request`: Cannot delete completed appointments or appointments with medical records
- `404 Not Found`: Appointment not found
- `500 Internal Server Error`: Server error

### 7. Get Available Time Slots

**GET** `/api/appointments/availability/:doctorId/:date`

Get available time slots for a doctor on a specific date.

#### Parameters

- `doctorId`: Doctor's UUID
- `date`: Date in YYYY-MM-DD format

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `duration` | number | Slot duration in minutes (default: 30) |

#### Response

```json
{
  "availableSlots": [
    "2024-01-15T08:00:00Z",
    "2024-01-15T08:30:00Z",
    "2024-01-15T09:00:00Z",
    "2024-01-15T09:30:00Z"
  ]
}
```

### 8. Get Appointments by Date Range

**GET** `/api/appointments/date-range`

Get appointments within a specific date range.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | Yes | Start date (ISO format) |
| `endDate` | string | Yes | End date (ISO format) |
| `doctorId` | string | No | Filter by doctor ID |

#### Response

Returns an array of appointments within the specified date range.

### 9. Get Upcoming Appointments

**GET** `/api/appointments/upcoming`

Get upcoming appointments (next 7 days) with scheduled or confirmed status.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `doctorId` | string | Filter by doctor ID |
| `limit` | number | Number of results to return (default: 10) |

#### Response

Returns an array of upcoming appointments.

## Business Rules

### Working Hours

- **Start**: 8:00 AM
- **End**: 6:00 PM
- **Lunch Break**: 12:00 PM - 1:00 PM (no appointments)

### Appointment Validation

1. **Time Conflicts**: System automatically prevents overlapping appointments for the same doctor
2. **Working Hours**: Appointments can only be scheduled within working hours
3. **Future Dates**: Appointments must be scheduled in the future
4. **Doctor Availability**: Only active doctors can have appointments scheduled
5. **Patient Existence**: Patient must exist in the system

### Status Transitions

```
scheduled → confirmed → in_progress → completed
    ↓           ↓            ↓
cancelled   cancelled   cancelled
    ↓           ↓            ↓
no_show     no_show     no_show
```

### Automatic Status Updates

- Appointments automatically change to `no_show` if they remain `scheduled` or `confirmed` 30 minutes after the scheduled time

## Real-time Updates

The system supports real-time updates for appointment changes using Supabase real-time subscriptions:

### Subscription Channels

1. **Doctor-specific**: `appointments_{doctorId}`
2. **All appointments**: `all_appointments` (admin only)
3. **Patient-specific**: `patient_appointments_{patientId}`
4. **Status changes**: `appointment_status_{appointmentId}`

### Event Types

- `INSERT`: New appointment created
- `UPDATE`: Appointment modified
- `DELETE`: Appointment deleted

## Error Handling

### Common Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Time conflict or business rule violation |
| 500 | Internal Server Error - Server error |

### Error Response Format

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Database Functions

The system includes several PostgreSQL functions for advanced operations:

### Available Functions

1. `check_appointment_conflict()` - Check for time conflicts
2. `get_available_slots()` - Get available time slots
3. `validate_appointment_rules()` - Validate business rules
4. `get_doctor_schedule()` - Get doctor's schedule
5. `get_appointment_stats()` - Get appointment statistics

### Usage Example

```sql
-- Check for conflicts
SELECT check_appointment_conflict(
  'doctor-uuid',
  '2024-01-15 10:00:00+00',
  30,
  NULL
);

-- Get available slots
SELECT * FROM get_available_slots(
  'doctor-uuid',
  '2024-01-15',
  30
);
```

## Performance Considerations

### Indexes

The system includes optimized indexes for:

- Patient ID lookups
- Doctor ID lookups
- Scheduled time queries
- Status filtering
- Date range queries

### Caching

- Available slots are cached for frequently requested dates
- Doctor schedules are cached for current and next day
- Appointment statistics are cached for dashboard views

## Security

### Data Protection

- All appointment data is encrypted in transit and at rest
- Access is controlled by role-based permissions
- Audit logs track all appointment modifications
- LGPD compliance for patient data handling

### Rate Limiting

- API endpoints are rate-limited to prevent abuse
- Real-time subscriptions have connection limits
- Bulk operations require special permissions

## Testing

### Test Coverage

- Unit tests for all service methods
- Integration tests for API endpoints
- Real-time functionality tests
- Performance and load tests
- Security and penetration tests

### Test Data

Test data is automatically created and cleaned up during test runs. No manual setup required.

## Monitoring

### Metrics

- Appointment creation/update/deletion rates
- Conflict detection accuracy
- Real-time subscription performance
- API response times
- Error rates and types

### Alerts

- High conflict rates
- Failed appointment creations
- Real-time connection issues
- Database performance problems
- Security violations