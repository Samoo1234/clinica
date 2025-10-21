import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente Supabase com service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar autenticação (opcional - remova se quiser API pública)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parsear query parameters
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const dataInicio = url.searchParams.get('data_inicio')
    const dataFim = url.searchParams.get('data_fim')
    const status = url.searchParams.get('status')
    const medicoId = url.searchParams.get('medico_id')

    // Construir query
    let query = supabaseClient
      .from('agendamentos')
      .select(`
        *,
        medico:medicos(id, nome, especialidade, crm)
      `)
      .order('data', { ascending: true })
      .order('horario', { ascending: true })
      .range(offset, offset + limit - 1)

    // Aplicar filtros
    if (dataInicio) {
      query = query.gte('data', dataInicio)
    }
    if (dataFim) {
      query = query.lte('data', dataFim)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (medicoId) {
      query = query.eq('medico_id', medicoId)
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: data,
        total: count,
        limit: limit,
        offset: offset
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
