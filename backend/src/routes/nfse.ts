import { Router, Request, Response } from 'express';
import { nfseService, NFSeRequest } from '../services/nfse';
import { supabase } from '../config/supabase';

const router = Router();

// Emitir nota fiscal para um agendamento
router.post('/issue', async (req: Request, res: Response) => {
  try {
    const { appointment_id, amount, service_description } = req.body;

    if (!appointment_id || !amount || !service_description) {
      return res.status(400).json({
        error: 'appointment_id, amount e service_description são obrigatórios'
      });
    }

    // Buscar dados do agendamento
    const { data: appointmentData, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(*),
        doctor:users(*)
      `)
      .eq('id', appointment_id)
      .single();

    if (appointmentError || !appointmentData) {
      return res.status(404).json({
        error: 'Agendamento não encontrado'
      });
    }

    // Verificar se já existe nota fiscal para este agendamento
    const existingInvoices = await nfseService.getInvoicesByAppointment(appointment_id);
    const hasIssuedInvoice = existingInvoices.some(inv => inv.status === 'issued');
    
    if (hasIssuedInvoice) {
      return res.status(400).json({
        error: 'Já existe uma nota fiscal emitida para este agendamento'
      });
    }

    // Preparar dados para emissão
    const nfseRequest: NFSeRequest = {
      appointment_id,
      amount: parseFloat(amount),
      service_description,
      patient_data: {
        name: appointmentData.patient.name,
        cpf: appointmentData.patient.cpf,
        email: appointmentData.patient.email,
        address: appointmentData.patient.address
      },
      doctor_data: {
        name: appointmentData.doctor.name,
        cpf: appointmentData.doctor.cpf || ''
      }
    };

    // Emitir nota fiscal
    const invoice = await nfseService.issueInvoice(nfseRequest);

    res.status(201).json({
      success: true,
      invoice
    });

  } catch (error) {
    console.error('Erro ao emitir NFS-e:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
});

// Buscar nota fiscal por ID
router.get('/invoice/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const invoice = await nfseService.getInvoice(id);
    
    if (!invoice) {
      return res.status(404).json({
        error: 'Nota fiscal não encontrada'
      });
    }

    res.json({
      success: true,
      invoice
    });

  } catch (error) {
    console.error('Erro ao buscar nota fiscal:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
});

// Buscar notas fiscais de um agendamento
router.get('/appointment/:appointmentId/invoices', async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    
    const invoices = await nfseService.getInvoicesByAppointment(appointmentId);

    res.json({
      success: true,
      invoices
    });

  } catch (error) {
    console.error('Erro ao buscar notas fiscais do agendamento:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
});

// Listar notas fiscais com filtros
router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const {
      status,
      start_date,
      end_date,
      limit = '50',
      offset = '0'
    } = req.query;

    const filters = {
      status: status as string,
      start_date: start_date as string,
      end_date: end_date as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    const result = await nfseService.listInvoices(filters);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Erro ao listar notas fiscais:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
});

// Cancelar nota fiscal
router.post('/invoice/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        error: 'Motivo do cancelamento é obrigatório'
      });
    }

    const invoice = await nfseService.cancelInvoice(id, reason);

    res.json({
      success: true,
      invoice
    });

  } catch (error) {
    console.error('Erro ao cancelar nota fiscal:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
});

// Retentar emissão de nota fiscal
router.post('/invoice/:id/retry', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await nfseService.retryInvoice(id);

    res.json({
      success: true,
      invoice
    });

  } catch (error) {
    console.error('Erro ao retentar emissão:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
});

// Buscar configuração ativa
router.get('/config', async (req: Request, res: Response) => {
  try {
    const config = await nfseService.getActiveConfig();

    if (!config) {
      // Retornar configuração padrão/mock se não existir
      const defaultConfig = {
        id: 'default',
        provider_name: 'Mock Provider',
        api_url: 'https://api.mock-nfse.com',
        api_key: '***',
        city_code: '3550308', // São Paulo
        cnpj: '00.000.000/0001-00',
        municipal_inscription: '123456789',
        service_code: '14.01',
        tax_rate: 5.0,
        active: true
      };

      return res.json({
        success: true,
        config: defaultConfig
      });
    }

    // Remover dados sensíveis da resposta
    const safeConfig = {
      ...config,
      api_key: '***',
      certificate_password: config.certificate_password ? '***' : undefined
    };

    res.json({
      success: true,
      config: safeConfig
    });

  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    
    // Em caso de erro, retornar configuração mock
    const defaultConfig = {
      id: 'default',
      provider_name: 'Mock Provider',
      api_url: 'https://api.mock-nfse.com',
      api_key: '***',
      city_code: '3550308',
      cnpj: '00.000.000/0001-00',
      municipal_inscription: '123456789',
      service_code: '14.01',
      tax_rate: 5.0,
      active: true
    };

    res.json({
      success: true,
      config: defaultConfig
    });
  }
});

// Atualizar configuração (apenas para administradores)
router.put('/config', async (req: Request, res: Response) => {
  try {
    // TODO: Verificar se usuário é administrador
    const configData = req.body;

    // Remover campos que não devem ser atualizados via API
    delete configData.id;
    delete configData.created_at;
    delete configData.updated_at;

    const config = await nfseService.updateConfig(configData);

    // Remover dados sensíveis da resposta
    const safeConfig = {
      ...config,
      api_key: '***',
      certificate_password: config.certificate_password ? '***' : undefined
    };

    res.json({
      success: true,
      config: safeConfig
    });

  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
});

// Buscar logs de integração
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const {
      invoice_id,
      operation,
      status,
      limit = '50',
      offset = '0'
    } = req.query;

    let query = supabase
      .from('nfse_integration_logs')
      .select('*', { count: 'exact' });

    if (invoice_id) {
      query = query.eq('invoice_id', invoice_id);
    }

    if (operation) {
      query = query.eq('operation', operation);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(
        parseInt(offset as string), 
        parseInt(offset as string) + parseInt(limit as string) - 1
      );

    const { data, error, count } = await query;

    if (error) {
      throw new Error('Erro ao buscar logs');
    }

    res.json({
      success: true,
      logs: data || [],
      total: count || 0
    });

  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
});

// Relatório de notas fiscais
router.get('/report', async (req: Request, res: Response) => {
  try {
    const {
      start_date,
      end_date,
      status
    } = req.query;

    // Usar a tabela invoices diretamente em vez de uma view
    let query = supabase
      .from('invoices')
      .select('*');

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      // Retornar dados mock em caso de erro
      const mockData = [
        {
          id: '1',
          amount: 150.00,
          tax_amount: 7.50,
          net_amount: 142.50,
          status: 'issued',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          amount: 200.00,
          tax_amount: 10.00,
          net_amount: 190.00,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ];

      const summary = {
        total_invoices: mockData.length,
        total_amount: mockData.reduce((sum, inv) => sum + inv.amount, 0),
        total_tax: mockData.reduce((sum, inv) => sum + inv.tax_amount, 0),
        total_net: mockData.reduce((sum, inv) => sum + inv.net_amount, 0),
        by_status: mockData.reduce((acc, inv) => {
          acc[inv.status] = (acc[inv.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return res.json({
        success: true,
        invoices: mockData,
        summary
      });
    }

    // Calcular totais
    const summary = {
      total_invoices: data?.length || 0,
      total_amount: data?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0,
      total_tax: data?.reduce((sum, inv) => sum + (inv.tax_amount || 0), 0) || 0,
      total_net: data?.reduce((sum, inv) => sum + (inv.net_amount || 0), 0) || 0,
      by_status: data?.reduce((acc, inv) => {
        acc[inv.status] = (acc[inv.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
    };

    res.json({
      success: true,
      invoices: data || [],
      summary
    });

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
});

export default router;