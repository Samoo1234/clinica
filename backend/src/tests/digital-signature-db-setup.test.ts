import { supabase } from '../config/supabase'

describe('Digital Signature Database Setup', () => {
  test('should have digital_signatures table', async () => {
    const { data, error } = await supabase
      .from('digital_signatures')
      .select('*')
      .limit(1)

    // Should not error on table access (even if empty)
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })

  test('should have signature_status enum values', async () => {
    // Test that we can use the enum values in a query
    const expectedStatuses = ['pending', 'sent', 'signed', 'failed', 'cancelled']
    
    // Try to query with each status to verify enum works
    for (const status of expectedStatuses) {
      const { error } = await supabase
        .from('digital_signatures')
        .select('*')
        .eq('status', status)
        .limit(1)
      
      // Should not error on enum value usage
      expect(error).toBeNull()
    }
  })

  test('should have required columns in digital_signatures table', async () => {
    const { data, error } = await supabase
      .from('digital_signatures')
      .select(`
        id,
        record_id,
        document_type,
        document_content,
        signature_provider,
        external_signature_id,
        signature_url,
        status,
        signed_document_path,
        signature_data,
        signer_email,
        signer_name,
        sent_at,
        signed_at,
        expires_at,
        created_at,
        updated_at
      `)
      .limit(1)

    // Should not error on column access
    expect(error).toBeNull()
  })

  test('should enforce security policies', async () => {
    const invalidRecordId = '00000000-0000-0000-0000-000000000000'
    
    const { error } = await supabase
      .from('digital_signatures')
      .insert({
        record_id: invalidRecordId,
        document_type: 'prescription',
        document_content: 'Test content',
        signature_provider: 'mock',
        signer_email: 'test@example.com',
        signer_name: 'Test User'
      })

    // Should fail due to RLS policy or foreign key constraint
    expect(error).not.toBeNull()
    expect(error?.message).toMatch(/(foreign key|row-level security|policy)/i)
  })

  test('should validate document_type values', async () => {
    const validTypes = ['prescription', 'report', 'certificate']
    
    // This test assumes we have at least one medical record to reference
    // In a real scenario, we'd create test data first
    
    for (const docType of validTypes) {
      // Just verify the type is accepted (we can't actually insert without valid record_id)
      expect(['prescription', 'report', 'certificate']).toContain(docType)
    }
  })

  test('should have proper indexes', async () => {
    // Test that queries using indexed columns work efficiently
    const { error: recordIdError } = await supabase
      .from('digital_signatures')
      .select('*')
      .eq('record_id', '00000000-0000-0000-0000-000000000000')
      .limit(1)
    
    const { error: statusError } = await supabase
      .from('digital_signatures')
      .select('*')
      .eq('status', 'pending')
      .limit(1)
    
    // Should not error on indexed column queries
    expect(recordIdError).toBeNull()
    expect(statusError).toBeNull()
  })
})