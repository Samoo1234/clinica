#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

class ClinicaMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'clinica-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_patients',
            description: 'Buscar pacientes com filtros opcionais',
            inputSchema: {
              type: 'object',
              properties: {
                limit: { type: 'number', description: 'Limite de resultados (padrão: 10)' },
                search: { type: 'string', description: 'Buscar por nome, email ou CPF' },
                recent_days: { type: 'number', description: 'Pacientes cadastrados nos últimos X dias' }
              }
            }
          },
          {
            name: 'get_appointments',
            description: 'Buscar agendamentos com filtros',
            inputSchema: {
              type: 'object',
              properties: {
                limit: { type: 'number', description: 'Limite de resultados (padrão: 10)' },
                date_from: { type: 'string', description: 'Data inicial (YYYY-MM-DD)' },
                date_to: { type: 'string', description: 'Data final (YYYY-MM-DD)' },
                doctor_id: { type: 'string', description: 'ID do médico' },
                status: { type: 'string', description: 'Status do agendamento' }
              }
            }
          },
          {
            name: 'create_appointment',
            description: 'Criar novo agendamento',
            inputSchema: {
              type: 'object',
              required: ['patient_id', 'doctor_id', 'scheduled_at'],
              properties: {
                patient_id: { type: 'string', description: 'ID do paciente' },
                doctor_id: { type: 'string', description: 'ID do médico' },
                scheduled_at: { type: 'string', description: 'Data e hora do agendamento (ISO string)' },
                duration: { type: 'number', description: 'Duração em minutos (padrão: 30)' },
                type: { type: 'string', description: 'Tipo de consulta' },
                notes: { type: 'string', description: 'Observações' },
                value: { type: 'number', description: 'Valor da consulta' }
              }
            }
          },
          {
            name: 'get_financial_summary',
            description: 'Obter resumo financeiro',
            inputSchema: {
              type: 'object',
              properties: {
                date_from: { type: 'string', description: 'Data inicial (YYYY-MM-DD)' },
                date_to: { type: 'string', description: 'Data final (YYYY-MM-DD)' },
                doctor_id: { type: 'string', description: 'ID do médico específico' }
              }
            }
          },
          {
            name: 'execute_query',
            description: 'Executar query SQL personalizada (use com cuidado)',
            inputSchema: {
              type: 'object',
              required: ['query'],
              properties: {
                query: { type: 'string', description: 'Query SQL para executar' }
              }
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_patients':
            return await this.getPatients(args);
          case 'get_appointments':
            return await this.getAppointments(args);
          case 'create_appointment':
            return await this.createAppointment(args);
          case 'get_financial_summary':
            return await this.getFinancialSummary(args);
          case 'execute_query':
            return await this.executeQuery(args);
          default:
            throw new Error(`Ferramenta desconhecida: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Erro ao executar ${name}: ${error.message}`
            }
          ]
        };
      }
    });
  }

  async getPatients(args = {}) {
    const { limit = 10, search, recent_days } = args;
    
    let query = supabase
      .from('patients')
      .select('*')
      .limit(limit);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,cpf.ilike.%${search}%`);
    }

    if (recent_days) {
      const date = new Date();
      date.setDate(date.getDate() - recent_days);
      query = query.gte('created_at', date.toISOString());
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return {
      content: [
        {
          type: 'text',
          text: `Encontrados ${data.length} pacientes:\n\n${data.map(p => 
            `• ${p.name} (${p.email}) - CPF: ${p.cpf} - Cadastrado: ${new Date(p.created_at).toLocaleDateString()}`
          ).join('\n')}`
        }
      ]
    };
  }

  async getAppointments(args = {}) {
    const { limit = 10, date_from, date_to, doctor_id, status } = args;
    
    let query = supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(name, email),
        doctor:users(name)
      `)
      .limit(limit);

    if (date_from) {
      query = query.gte('scheduled_at', date_from);
    }
    if (date_to) {
      query = query.lte('scheduled_at', date_to);
    }
    if (doctor_id) {
      query = query.eq('doctor_id', doctor_id);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('scheduled_at', { ascending: true });

    if (error) throw error;

    return {
      content: [
        {
          type: 'text',
          text: `Encontrados ${data.length} agendamentos:\n\n${data.map(a => 
            `• ${new Date(a.scheduled_at).toLocaleString()} - ${a.patient?.name} com ${a.doctor?.name}\n  Status: ${a.status} | Tipo: ${a.type || 'N/A'} | Valor: R$ ${a.value || 0}`
          ).join('\n\n')}`
        }
      ]
    };
  }

  async createAppointment(args) {
    const { patient_id, doctor_id, scheduled_at, duration = 30, type, notes, value } = args;

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id,
        doctor_id,
        scheduled_at,
        duration_minutes: duration,
        notes,
        value,
        status: 'scheduled'
      })
      .select(`
        *,
        patient:patients(name),
        doctor:users(name)
      `)
      .single();

    if (error) throw error;

    return {
      content: [
        {
          type: 'text',
          text: `✅ Agendamento criado com sucesso!\n\nDetalhes:\n• Paciente: ${data.patient?.name}\n• Médico: ${data.doctor?.name}\n• Data/Hora: ${new Date(data.scheduled_at).toLocaleString()}\n• Duração: ${data.duration_minutes} minutos\n• Valor: R$ ${data.value || 0}\n• Status: ${data.status}`
        }
      ]
    };
  }

  async getFinancialSummary(args = {}) {
    const { date_from, date_to, doctor_id } = args;
    
    let query = supabase
      .from('appointments')
      .select('value, payment_status, scheduled_at, doctor:users(name)');

    if (date_from) query = query.gte('scheduled_at', date_from);
    if (date_to) query = query.lte('scheduled_at', date_to);
    if (doctor_id) query = query.eq('doctor_id', doctor_id);

    const { data, error } = await query;

    if (error) throw error;

    const total = data.reduce((sum, a) => sum + (a.value || 0), 0);
    const paid = data.filter(a => a.payment_status === 'paid').reduce((sum, a) => sum + (a.value || 0), 0);
    const pending = data.filter(a => a.payment_status === 'pending').reduce((sum, a) => sum + (a.value || 0), 0);

    return {
      content: [
        {
          type: 'text',
          text: `📊 Resumo Financeiro\n\n• Total de consultas: ${data.length}\n• Receita total: R$ ${total.toFixed(2)}\n• Receita paga: R$ ${paid.toFixed(2)}\n• Receita pendente: R$ ${pending.toFixed(2)}\n• Taxa de pagamento: ${data.length > 0 ? ((paid / total) * 100).toFixed(1) : 0}%`
        }
      ]
    };
  }

  async executeQuery(args) {
    const { query } = args;
    
    // Validação básica de segurança
    const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE'];
    const upperQuery = query.toUpperCase();
    
    if (dangerousKeywords.some(keyword => upperQuery.includes(keyword))) {
      throw new Error('Query contém comandos perigosos. Use apenas SELECT para consultas.');
    }

    const { data, error } = await supabase.rpc('execute_sql', { sql_query: query });

    if (error) throw error;

    return {
      content: [
        {
          type: 'text',
          text: `Resultado da query:\n\n${JSON.stringify(data, null, 2)}`
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 Clinica MCP Server iniciado');
  }
}

const server = new ClinicaMCPServer();
server.run().catch(console.error);