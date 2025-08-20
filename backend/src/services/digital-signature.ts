import { supabase } from '../config/supabase';
import { Database } from '../types/database';

type DigitalSignature = Database['public']['Tables']['digital_signatures']['Row'];
type DigitalSignatureInsert = Database['public']['Tables']['digital_signatures']['Insert'];
type DigitalSignatureUpdate = Database['public']['Tables']['digital_signatures']['Update'];

export interface SignatureRequest {
  recordId: string;
  documentType: 'prescription' | 'report' | 'certificate';
  documentContent: string;
  signerEmail: string;
  signerName: string;
}

export interface SignatureProvider {
  name: string;
  sendForSignature(request: SignatureRequest): Promise<{
    externalId: string;
    signatureUrl: string;
    expiresAt: Date;
  }>;
  getSignatureStatus(externalId: string): Promise<{
    status: 'pending' | 'signed' | 'failed' | 'cancelled';
    signedDocumentUrl?: string;
    signedAt?: Date;
  }>;
  downloadSignedDocument(externalId: string): Promise<Buffer>;
}

// Mock signature provider for development/testing
class MockSignatureProvider implements SignatureProvider {
  name = 'mock';

  async sendForSignature(request: SignatureRequest) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const externalId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const signatureUrl = `https://mock-signature.com/sign/${externalId}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return {
      externalId,
      signatureUrl,
      expiresAt
    };
  }

  async getSignatureStatus(externalId: string) {
    // Simulate random status for testing
    const statuses = ['pending', 'signed', 'failed'] as const;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      status,
      signedDocumentUrl: status === 'signed' ? `https://mock-signature.com/document/${externalId}` : undefined,
      signedAt: status === 'signed' ? new Date() : undefined
    };
  }

  async downloadSignedDocument(externalId: string): Promise<Buffer> {
    // Return mock PDF content
    return Buffer.from(`Mock signed document for ${externalId}`, 'utf-8');
  }
}

// DocuSign provider (placeholder for real implementation)
class DocuSignProvider implements SignatureProvider {
  name = 'docusign';
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://demo.docusign.net/restapi') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async sendForSignature(request: SignatureRequest): Promise<{
    externalId: string;
    signatureUrl: string;
    expiresAt: Date;
  }> {
    // TODO: Implement real DocuSign integration
    throw new Error('DocuSign integration not implemented yet');
  }

  async getSignatureStatus(externalId: string): Promise<{
    status: 'pending' | 'signed' | 'failed' | 'cancelled';
    signedDocumentUrl?: string;
    signedAt?: Date;
  }> {
    // TODO: Implement real DocuSign status check
    throw new Error('DocuSign integration not implemented yet');
  }

  async downloadSignedDocument(externalId: string): Promise<Buffer> {
    // TODO: Implement real DocuSign document download
    throw new Error('DocuSign integration not implemented yet');
  }
}

class DigitalSignatureService {
  private provider: SignatureProvider;

  constructor() {
    // Use mock provider for development, can be configured via environment
    const providerType = process.env.SIGNATURE_PROVIDER || 'mock';
    
    switch (providerType) {
      case 'docusign':
        this.provider = new DocuSignProvider(
          process.env.DOCUSIGN_API_KEY || '',
          process.env.DOCUSIGN_BASE_URL
        );
        break;
      default:
        this.provider = new MockSignatureProvider();
    }
  }

  async createSignatureRequest(request: SignatureRequest): Promise<DigitalSignature> {
    try {
      // Send document to signature provider
      const providerResponse = await this.provider.sendForSignature(request);

      // Create signature record in database
      const signatureData: DigitalSignatureInsert = {
        record_id: request.recordId,
        document_type: request.documentType,
        document_content: request.documentContent,
        signature_provider: this.provider.name,
        external_signature_id: providerResponse.externalId,
        signature_url: providerResponse.signatureUrl,
        status: 'sent',
        signer_email: request.signerEmail,
        signer_name: request.signerName,
        sent_at: new Date().toISOString(),
        expires_at: providerResponse.expiresAt.toISOString()
      };

      const { data, error } = await supabase
        .from('digital_signatures')
        .insert(signatureData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create signature record: ${error.message}`);
      }

      // Log the operation
      await this.logOperation('create_signature', {
        signatureId: data.id,
        recordId: request.recordId,
        provider: this.provider.name
      }, 'success');

      return data;
    } catch (error) {
      // Log the error
      await this.logOperation('create_signature', {
        recordId: request.recordId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'error', error instanceof Error ? error.message : 'Unknown error');

      throw error;
    }
  }

  async getSignatureStatus(signatureId: string): Promise<DigitalSignature> {
    const { data: signature, error } = await supabase
      .from('digital_signatures')
      .select('*')
      .eq('id', signatureId)
      .single();

    if (error || !signature) {
      throw new Error('Signature not found');
    }

    // If signature is still pending or sent, check with provider
    if (signature.status === 'pending' || signature.status === 'sent') {
      try {
        const providerStatus = await this.provider.getSignatureStatus(
          signature.external_signature_id!
        );

        // Update status if changed
        if (providerStatus.status !== signature.status) {
          const updateData: DigitalSignatureUpdate = {
            status: providerStatus.status,
            signed_at: providerStatus.signedAt?.toISOString()
          };

          const { data: updatedSignature, error: updateError } = await supabase
            .from('digital_signatures')
            .update(updateData)
            .eq('id', signatureId)
            .select()
            .single();

          if (updateError) {
            throw new Error(`Failed to update signature status: ${updateError.message}`);
          }

          return updatedSignature;
        }
      } catch (error) {
        // Log error but don't throw - return current status
        await this.logOperation('check_signature_status', {
          signatureId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }, 'error', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    return signature;
  }

  async downloadSignedDocument(signatureId: string): Promise<Buffer> {
    const signature = await this.getSignatureStatus(signatureId);

    if (signature.status !== 'signed') {
      throw new Error('Document is not signed yet');
    }

    if (!signature.external_signature_id) {
      throw new Error('No external signature ID found');
    }

    try {
      const documentBuffer = await this.provider.downloadSignedDocument(
        signature.external_signature_id
      );

      // TODO: Store signed document in Supabase Storage
      // For now, just return the buffer

      await this.logOperation('download_signed_document', {
        signatureId,
        documentSize: documentBuffer.length
      }, 'success');

      return documentBuffer;
    } catch (error) {
      await this.logOperation('download_signed_document', {
        signatureId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'error', error instanceof Error ? error.message : 'Unknown error');

      throw error;
    }
  }

  async getSignaturesByRecord(recordId: string): Promise<DigitalSignature[]> {
    const { data, error } = await supabase
      .from('digital_signatures')
      .select('*')
      .eq('record_id', recordId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch signatures: ${error.message}`);
    }

    return data || [];
  }

  async cancelSignature(signatureId: string): Promise<DigitalSignature> {
    const { data, error } = await supabase
      .from('digital_signatures')
      .update({
        status: 'cancelled'
      })
      .eq('id', signatureId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to cancel signature: ${error.message}`);
    }

    await this.logOperation('cancel_signature', {
      signatureId
    }, 'success');

    return data;
  }

  private async logOperation(
    operation: string,
    requestData: any,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase
        .from('integration_logs')
        .insert({
          service_name: 'digital_signature',
          operation,
          request_data: requestData,
          status,
          error_message: errorMessage
        });
    } catch (error) {
      // Don't throw on logging errors
      console.error('Failed to log operation:', error);
    }
  }
}

export const digitalSignatureService = new DigitalSignatureService();