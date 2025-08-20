# Digital Signature API Documentation

## Overview

The Digital Signature API provides endpoints for integrating with digital signature providers to sign medical documents such as prescriptions, reports, and certificates. This API supports the complete signature workflow from document creation to signed document retrieval.

## Base URL

```
/api/digital-signature
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Create Signature Request

Creates a new digital signature request and sends the document to the signature provider.

**Endpoint:** `POST /create`

**Request Body:**
```json
{
  "recordId": "uuid",
  "documentType": "prescription|report|certificate",
  "documentContent": "string",
  "signerEmail": "email@domain.com",
  "signerName": "Full Name"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "record_id": "uuid",
    "document_type": "prescription",
    "document_content": "string",
    "signature_provider": "mock",
    "external_signature_id": "external_id",
    "signature_url": "https://signature-provider.com/sign/external_id",
    "status": "sent",
    "signer_email": "email@domain.com",
    "signer_name": "Full Name",
    "sent_at": "2024-01-15T10:30:00Z",
    "expires_at": "2024-01-22T10:30:00Z",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Status Codes:**
- `201` - Signature request created successfully
- `400` - Invalid request data
- `401` - Unauthorized
- `500` - Internal server error

---

### Get Signature Status

Retrieves the current status of a signature request and updates it from the external provider if needed.

**Endpoint:** `GET /:id/status`

**Parameters:**
- `id` (path) - Signature ID (UUID)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "record_id": "uuid",
    "document_type": "prescription",
    "status": "signed",
    "signature_url": "https://signature-provider.com/sign/external_id",
    "signed_at": "2024-01-15T14:30:00Z",
    "expires_at": "2024-01-22T10:30:00Z",
    "signer_email": "email@domain.com",
    "signer_name": "Full Name",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T14:30:00Z"
  }
}
```

**Status Codes:**
- `200` - Status retrieved successfully
- `404` - Signature not found
- `401` - Unauthorized
- `500` - Internal server error

---

### Download Signed Document

Downloads the signed document as a PDF file.

**Endpoint:** `GET /:id/download`

**Parameters:**
- `id` (path) - Signature ID (UUID)

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="signed-document-{id}.pdf"`
- Binary PDF data

**Status Codes:**
- `200` - Document downloaded successfully
- `400` - Document not signed yet
- `404` - Signature not found
- `401` - Unauthorized
- `500` - Internal server error

---

### Get Signatures by Record

Retrieves all signature requests for a specific medical record.

**Endpoint:** `GET /record/:recordId`

**Parameters:**
- `recordId` (path) - Medical record ID (UUID)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "record_id": "uuid",
      "document_type": "prescription",
      "status": "signed",
      "signature_url": "https://signature-provider.com/sign/external_id",
      "signed_at": "2024-01-15T14:30:00Z",
      "signer_email": "email@domain.com",
      "signer_name": "Full Name",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Signatures retrieved successfully
- `401` - Unauthorized
- `500` - Internal server error

---

### Cancel Signature Request

Cancels a pending signature request.

**Endpoint:** `PUT /:id/cancel`

**Parameters:**
- `id` (path) - Signature ID (UUID)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "cancelled",
    "updated_at": "2024-01-15T15:00:00Z"
  }
}
```

**Status Codes:**
- `200` - Signature cancelled successfully
- `404` - Signature not found
- `401` - Unauthorized
- `500` - Internal server error

---

### Webhook Endpoint

Receives status updates from the signature provider.

**Endpoint:** `POST /webhook`

**Request Body:**
```json
{
  "externalId": "external_signature_id",
  "status": "signed|failed|cancelled",
  "signedAt": "2024-01-15T14:30:00Z",
  "signedDocumentUrl": "https://signature-provider.com/document/external_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

**Status Codes:**
- `200` - Webhook processed successfully
- `400` - Invalid webhook data
- `500` - Internal server error

## Data Models

### Signature Status

The signature status can be one of the following values:

- `pending` - Signature request created but not yet sent
- `sent` - Document sent to signature provider
- `signed` - Document successfully signed
- `failed` - Signature process failed
- `cancelled` - Signature request cancelled

### Document Types

Supported document types:

- `prescription` - Medical prescriptions
- `report` - Medical reports and exam results
- `certificate` - Medical certificates

### Error Responses

All endpoints return error responses in the following format:

```json
{
  "error": "Error message",
  "details": "Additional error details (in development mode)"
}
```

## Integration with Signature Providers

### Mock Provider (Development)

For development and testing, a mock signature provider is used that simulates the signature process:

- Generates mock external IDs and signature URLs
- Simulates random signature statuses for testing
- Returns mock PDF content for signed documents

### DocuSign Integration (Production)

For production use, integration with DocuSign or other signature providers can be configured:

```env
SIGNATURE_PROVIDER=docusign
DOCUSIGN_API_KEY=your_api_key
DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi
```

## Security Considerations

1. **Authentication**: All endpoints require valid JWT authentication
2. **Authorization**: Users can only access signatures for records they have permission to view
3. **Data Encryption**: All sensitive data is encrypted in transit and at rest
4. **Webhook Security**: Webhook endpoints should verify signature provider signatures (to be implemented)
5. **Audit Logging**: All operations are logged for audit purposes

## Rate Limiting

API endpoints are subject to rate limiting:
- 100 requests per 15-minute window per IP address
- Additional rate limiting may apply to signature provider APIs

## Examples

### Creating a Prescription Signature

```javascript
const response = await fetch('/api/digital-signature/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    recordId: 'patient-record-uuid',
    documentType: 'prescription',
    documentContent: 'Prescription content here...',
    signerEmail: 'doctor@clinic.com',
    signerName: 'Dr. John Smith'
  })
});

const result = await response.json();
console.log('Signature URL:', result.data.signature_url);
```

### Checking Signature Status

```javascript
const response = await fetch(`/api/digital-signature/${signatureId}/status`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();
console.log('Status:', result.data.status);
```

### Downloading Signed Document

```javascript
const response = await fetch(`/api/digital-signature/${signatureId}/download`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (response.ok) {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `signed-document-${signatureId}.pdf`;
  a.click();
}
```