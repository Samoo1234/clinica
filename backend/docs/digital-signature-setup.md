# Digital Signature Setup Guide

This guide explains how to set up the digital signature functionality in the VisionCare system.

## Prerequisites

1. Main database schema must be created first (`schema.sql`)
2. Supabase project must be configured
3. Environment variables must be set

## Database Setup

### Step 1: Execute Main Schema
First, ensure the main database schema is created:

```sql
-- Execute backend/database/schema.sql in Supabase SQL Editor
```

### Step 2: Execute Digital Signature Schema
Then, execute the digital signature setup:

```sql
-- Execute backend/database/setup-digital-signature.sql in Supabase SQL Editor
```

This will create:
- `signature_status` enum type
- `digital_signatures` table
- Required indexes
- Row Level Security policies
- Triggers for `updated_at`

## Environment Configuration

Add the following environment variables to your `.env` file:

```env
# Digital Signature Provider (default: mock)
SIGNATURE_PROVIDER=mock

# DocuSign Configuration (if using DocuSign)
DOCUSIGN_API_KEY=your_api_key_here
DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi

# Other signature providers can be added here
```

## API Endpoints

The digital signature API provides the following endpoints:

- `POST /api/digital-signature/create` - Create signature request
- `GET /api/digital-signature/:id/status` - Get signature status
- `GET /api/digital-signature/:id/download` - Download signed document
- `GET /api/digital-signature/record/:recordId` - Get signatures by record
- `PUT /api/digital-signature/:id/cancel` - Cancel signature request
- `POST /api/digital-signature/webhook` - Webhook for provider callbacks

## Frontend Integration

The digital signature interface is automatically integrated into:

1. **Medical Record Form** - Shows when a record has prescription content
2. **Medical Record View** - Displays signature history and management

### Components

- `DigitalSignatureInterface` - Main interface component
- `SignatureRequestForm` - Form for creating signature requests
- `SignatureHistory` - Display signature history
- `SignatureStatusIndicator` - Visual status indicators

## Testing

Run the digital signature tests:

```bash
# Backend tests
npm test -- src/tests/digital-signature-simple.test.ts
npm test -- src/tests/digital-signature-db-setup.test.ts

# Integration tests (requires database setup)
npm test -- src/tests/digital-signature.test.ts
```

## Signature Providers

### Mock Provider (Development)
The mock provider simulates the signature process for development and testing:
- Generates random external IDs
- Simulates signature status changes
- Returns mock PDF content

### DocuSign Integration (Production)
For production use with DocuSign:
1. Set `SIGNATURE_PROVIDER=docusign`
2. Configure DocuSign API credentials
3. Implement webhook signature verification

### Adding New Providers
To add a new signature provider:
1. Implement the `SignatureProvider` interface
2. Add provider configuration to `DigitalSignatureService`
3. Update environment variables

## Security Considerations

1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Users can only access signatures for their own records
3. **Data Encryption**: All sensitive data is encrypted in transit and at rest
4. **Webhook Security**: Implement signature verification for production webhooks
5. **Audit Logging**: All operations are logged for audit purposes

## Troubleshooting

### Common Issues

1. **Table doesn't exist error**
   - Ensure main schema is created first
   - Check database connection

2. **Foreign key constraint errors**
   - Verify medical_records table exists
   - Check record IDs are valid

3. **Permission denied errors**
   - Verify RLS policies are correctly set
   - Check user authentication

4. **Provider integration errors**
   - Verify API credentials
   - Check network connectivity
   - Review provider documentation

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=digital-signature:*
```

## Monitoring

Monitor digital signature operations through:
1. Integration logs table
2. Application logs
3. Provider dashboards
4. Database metrics

## Backup and Recovery

Ensure regular backups include:
- `digital_signatures` table
- Signed document storage
- Integration logs
- Provider configuration

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check integration logs
4. Contact system administrator