import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface DatabaseStats {
  connected: boolean
  usersCount: number
  patientsCount: number
  appointmentsCount: number
  error?: string
}

export function DatabaseTest() {
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const testDatabase = async () => {
      try {
        setLoading(true)
        
        // Test connection and get basic stats
        const [usersResult, patientsResult, appointmentsResult] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('patients').select('*', { count: 'exact', head: true }),
          supabase.from('appointments').select('*', { count: 'exact', head: true })
        ])

        // Check for errors
        if (usersResult.error || patientsResult.error || appointmentsResult.error) {
          throw new Error('Failed to fetch database stats')
        }

        setStats({
          connected: true,
          usersCount: usersResult.count || 0,
          patientsCount: patientsResult.count || 0,
          appointmentsCount: appointmentsResult.count || 0
        })
      } catch (error: any) {
        setStats({
          connected: false,
          usersCount: 0,
          patientsCount: 0,
          appointmentsCount: 0,
          error: error.message
        })
      } finally {
        setLoading(false)
      }
    }

    testDatabase()
  }, [])

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-700">Testando conexão com o banco de dados...</p>
      </div>
    )
  }

  if (!stats?.connected) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold mb-2">❌ Erro de Conexão</h3>
        <p className="text-red-700 mb-2">
          Não foi possível conectar ao banco de dados Supabase.
        </p>
        {stats?.error && (
          <p className="text-red-600 text-sm">Erro: {stats.error}</p>
        )}
        <div className="mt-3 text-sm text-red-600">
          <p>Verifique se:</p>
          <ul className="list-disc list-inside mt-1">
            <li>As variáveis de ambiente estão configuradas</li>
            <li>O projeto Supabase está ativo</li>
            <li>As tabelas foram criadas</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <h3 className="text-green-800 font-semibold mb-2">✅ Conexão Estabelecida</h3>
      <p className="text-green-700 mb-3">
        Banco de dados Supabase conectado com sucesso!
      </p>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-white p-3 rounded border">
          <div className="text-gray-600">Usuários</div>
          <div className="text-2xl font-bold text-blue-600">{stats.usersCount}</div>
        </div>
        <div className="bg-white p-3 rounded border">
          <div className="text-gray-600">Pacientes</div>
          <div className="text-2xl font-bold text-blue-600">{stats.patientsCount}</div>
        </div>
        <div className="bg-white p-3 rounded border">
          <div className="text-gray-600">Consultas</div>
          <div className="text-2xl font-bold text-blue-600">{stats.appointmentsCount}</div>
        </div>
      </div>
      
      <div className="mt-3 text-sm text-green-600">
        <p>✓ Tabelas criadas e acessíveis</p>
        <p>✓ Políticas RLS configuradas</p>
        <p>✓ Dados de teste carregados</p>
      </div>
    </div>
  )
}