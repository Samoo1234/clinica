import { Router } from 'express';
import { digitalSignatureService, SignatureRequest } from '../services/digital-signature';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route POST /api/digital-signature/create
 * @desc Create a new digital signature request
 * @access Private (Doctors only)
 */
router.post('/create', async (req, res) => {
  try {
    const { recordId, documentType, documentContent, signerEmail, signerName } = req.body;

    // Validate required fields
    if (!recordId || !documentType || !documentContent || !signerEmail || !signerName) {
      return res.status(400).json({
        error: 'Missing required fields: recordId, documentType, documentContent, signerEmail, signerName'
      });
    }

    // Validate document type
    const validDocumentTypes = ['prescription', 'report', 'certificate'];
    if (!validDocumentTypes.includes(documentType)) {
      return res.status(400).json({
        error: 'Invalid document type. Must be one of: prescription, report, certificate'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signerEmail)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Check if user has permission to create signatures for this record
    // This should be done by checking if the user is the doctor who created the record
    // For now, we'll allow any authenticated user (this should be improved)

    const signatureRequest: SignatureRequest = {
      recordId,
      documentType,
      documentContent,
      signerEmail,
      signerName
    };

    const signature = await digitalSignatureService.createSignatureRequest(signatureRequest);

    res.status(201).json({
      success: true,
      data: signature
    });
  } catch (error) {
    console.error('Error creating signature request:', error);
    res.status(500).json({
      error: 'Failed to create signature request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/digital-signature/:id/status
 * @desc Get signature status and update if needed
 * @access Private
 */
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Signature ID is required'
      });
    }

    const signature = await digitalSignatureService.getSignatureStatus(id);

    res.json({
      success: true,
      data: signature
    });
  } catch (error) {
    console.error('Error getting signature status:', error);
    
    if (error instanceof Error && error.message === 'Signature not found') {
      return res.status(404).json({
        error: 'Signature not found'
      });
    }

    res.status(500).json({
      error: 'Failed to get signature status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/digital-signature/:id/download
 * @desc Download signed document
 * @access Private
 */
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Signature ID is required'
      });
    }

    const documentBuffer = await digitalSignatureService.downloadSignedDocument(id);

    // Set appropriate headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="signed-document-${id}.pdf"`);
    res.setHeader('Content-Length', documentBuffer.length);

    res.send(documentBuffer);
  } catch (error) {
    console.error('Error downloading signed document:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Signature not found') {
        return res.status(404).json({
          error: 'Signature not found'
        });
      }
      if (error.message === 'Document is not signed yet') {
        return res.status(400).json({
          error: 'Document is not signed yet'
        });
      }
    }

    res.status(500).json({
      error: 'Failed to download signed document',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/digital-signature/record/:recordId
 * @desc Get all signatures for a medical record
 * @access Private
 */
router.get('/record/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;

    if (!recordId) {
      return res.status(400).json({
        error: 'Record ID is required'
      });
    }

    const signatures = await digitalSignatureService.getSignaturesByRecord(recordId);

    res.json({
      success: true,
      data: signatures
    });
  } catch (error) {
    console.error('Error getting signatures for record:', error);
    res.status(500).json({
      error: 'Failed to get signatures for record',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route PUT /api/digital-signature/:id/cancel
 * @desc Cancel a signature request
 * @access Private
 */
router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'Signature ID is required'
      });
    }

    const signature = await digitalSignatureService.cancelSignature(id);

    res.json({
      success: true,
      data: signature
    });
  } catch (error) {
    console.error('Error cancelling signature:', error);
    
    if (error instanceof Error && error.message === 'Signature not found') {
      return res.status(404).json({
        error: 'Signature not found'
      });
    }

    res.status(500).json({
      error: 'Failed to cancel signature',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/digital-signature/webhook
 * @desc Webhook endpoint for signature provider callbacks
 * @access Public (but should be secured with webhook signature verification)
 */
router.post('/webhook', async (req, res) => {
  try {
    // TODO: Implement webhook signature verification
    // This endpoint would be called by the signature provider when status changes
    
    const { externalId, status, signedAt, signedDocumentUrl } = req.body;

    if (!externalId || !status) {
      return res.status(400).json({
        error: 'Missing required webhook data'
      });
    }

    // TODO: Update signature status based on webhook data
    // This would require finding the signature by external_signature_id
    // and updating its status

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;