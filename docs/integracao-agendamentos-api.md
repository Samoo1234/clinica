# Integração de Agendamentos entre Projetos via API

## 🎯 Objetivo
Integrar a listagem de agendamentos do projeto **dmsaqxuoruinwpnonpky** no projeto **nfvrbyiocqozpkyispkb**.

---

## 📋 Opções de Integração

### **Opção 1: API REST Nativa do Supabase (Mais Simples)**

#### **1.1 Configuração no Projeto Origem (dmsaqxuoruinwpnonpky)**

**Obter credenciais:**
- URL: `https://dmsaqxuoruinwpnonpky.supabase.co`
- Anon Key: Disponível no dashboard do Supabase
- Service Role Key: Para acesso administrativo (mais seguro)

**Configurar RLS (Row Level Security):**
```sql
-- Permitir leitura pública dos agendamentos (ajuste conforme necessário)
CREATE POLICY "Permitir leitura de agendamentos via API"
ON agendamentos
FOR SELECT
USING (true);

-- OU criar política específica para service role
CREATE POLICY "Service role pode ler agendamentos"
ON agendamentos
FOR SELECT
TO service_role
USING (true);
```

#### **1.2 Consumir no Projeto Destino (nfvrbyiocqozpkyispkb)**

**Exemplo em TypeScript/JavaScript:**

```typescript
// services/agendamentos-externos.ts
import { createClient } from '@supabase/supabase-js'

// Cliente para o projeto externo (dmsaqxuoruinwpnonpky)
const supabaseExterno = createClient(
  'https://dmsaqxuoruinwpnonpky.supabase.co',
  'SUA_ANON_KEY_OU_SERVICE_ROLE_KEY'
)

export interface AgendamentoExterno {
  id: string
  nome: string
  telefone: string
  email: string
  cpf: string
  data_nascimento: string
  data: string
  horario: string
  cidade: string
  medico_id: string
  status: string
  tipo_consulta: string
  observacoes: string
  valor: number
  forma_pagamento: string
  created_at: string
  updated_at: string
}

export async function listarAgendamentosExternos(filtros?: {
  dataInicio?: string
  dataFim?: string
  status?: string
  medicoId?: string
  limite?: number
}) {
  let query = supabaseExterno
    .from('agendamentos')
    .select(`
      *,
      medico:medicos(id, nome, especialidade, crm)
    `)
    .order('data', { ascending: true })
    .order('horario', { ascending: true })

  // Aplicar filtros
  if (filtros?.dataInicio) {
    query = query.gte('data', filtros.dataInicio)
  }
  if (filtros?.dataFim) {
    query = query.lte('data', filtros.dataFim)
  }
  if (filtros?.status) {
    query = query.eq('status', filtros.status)
  }
  if (filtros?.medicoId) {
    query = query.eq('medico_id', filtros.medicoId)
  }
  if (filtros?.limite) {
    query = query.limit(filtros.limite)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar agendamentos externos:', error)
    throw error
  }

  return data as AgendamentoExterno[]
}

// Exemplo de uso
export async function obterAgendamentosHoje() {
  const hoje = new Date().toISOString().split('T')[0]
  
  return await listarAgendamentosExternos({
    dataInicio: hoje,
    dataFim: hoje,
    status: 'confirmado'
  })
}
```

**Exemplo de componente React:**

```tsx
// components/AgendamentosExternos.tsx
import { useEffect, useState } from 'react'
import { listarAgendamentosExternos, AgendamentoExterno } from '../services/agendamentos-externos'

export function AgendamentosExternos() {
  const [agendamentos, setAgendamentos] = useState<AgendamentoExterno[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true)
        const data = await listarAgendamentosExternos({
          limite: 50
        })
        setAgendamentos(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    carregar()
  }, [])

  if (loading) return <div>Carregando agendamentos...</div>
  if (error) return <div>Erro: {error}</div>

  return (
    <div>
      <h2>Agendamentos do Sistema Externo</h2>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Horário</th>
            <th>Paciente</th>
            <th>Telefone</th>
            <th>Status</th>
            <th>Cidade</th>
          </tr>
        </thead>
        <tbody>
          {agendamentos.map(ag => (
            <tr key={ag.id}>
              <td>{new Date(ag.data).toLocaleDateString('pt-BR')}</td>
              <td>{ag.horario}</td>
              <td>{ag.nome}</td>
              <td>{ag.telefone}</td>
              <td>{ag.status}</td>
              <td>{ag.cidade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

### **Opção 2: Edge Function (Mais Controle)**

#### **2.1 Deploy da Edge Function**

A Edge Function já foi criada em `supabase/functions/get-agendamentos/index.ts`.

**Deploy:**
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref dmsaqxuoruinwpnonpky

# Deploy da função
supabase functions deploy get-agendamentos
```

#### **2.2 Consumir a Edge Function**

```typescript
// services/agendamentos-api.ts
const EDGE_FUNCTION_URL = 'https://dmsaqxuoruinwpnonpky.supabase.co/functions/v1/get-agendamentos'
const SUPABASE_ANON_KEY = 'SUA_ANON_KEY'

export async function buscarAgendamentosViaAPI(filtros?: {
  data_inicio?: string
  data_fim?: string
  status?: string
  medico_id?: string
  limit?: number
  offset?: number
}) {
  const params = new URLSearchParams()
  
  if (filtros?.data_inicio) params.append('data_inicio', filtros.data_inicio)
  if (filtros?.data_fim) params.append('data_fim', filtros.data_fim)
  if (filtros?.status) params.append('status', filtros.status)
  if (filtros?.medico_id) params.append('medico_id', filtros.medico_id)
  if (filtros?.limit) params.append('limit', filtros.limit.toString())
  if (filtros?.offset) params.append('offset', filtros.offset.toString())

  const url = `${EDGE_FUNCTION_URL}?${params.toString()}`

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.statusText}`)
  }

  return await response.json()
}
```

---

### **Opção 3: Backend Intermediário (Node.js/Express)**

Se você precisa de mais controle, cache, ou transformações de dados:

```typescript
// backend/routes/agendamentos-externos.ts
import express from 'express'
import { createClient } from '@supabase/supabase-js'

const router = express.Router()

const supabaseExterno = createClient(
  process.env.SUPABASE_EXTERNO_URL!,
  process.env.SUPABASE_EXTERNO_KEY!
)

router.get('/agendamentos-externos', async (req, res) => {
  try {
    const { data_inicio, data_fim, status, medico_id, limit = 50 } = req.query

    let query = supabaseExterno
      .from('agendamentos')
      .select('*, medico:medicos(*)')
      .limit(Number(limit))

    if (data_inicio) query = query.gte('data', data_inicio as string)
    if (data_fim) query = query.lte('data', data_fim as string)
    if (status) query = query.eq('status', status as string)
    if (medico_id) query = query.eq('medico_id', medico_id as string)

    const { data, error } = await query

    if (error) throw error

    res.json({
      success: true,
      data,
      total: data.length
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
```

---

## 🔒 Segurança

### **Recomendações:**

1. **Use Service Role Key** para comunicação servidor-servidor
2. **Configure RLS** adequadamente no projeto origem
3. **Valide tokens** se usar autenticação
4. **Rate limiting** para evitar abuso
5. **CORS** configurado corretamente
6. **Logs de auditoria** para rastrear acessos

### **Exemplo de RLS mais restritivo:**

```sql
-- Apenas usuários autenticados podem ler
CREATE POLICY "Apenas autenticados podem ler agendamentos"
ON agendamentos
FOR SELECT
TO authenticated
USING (true);

-- Ou restringir por API key específica
CREATE POLICY "API específica pode ler"
ON agendamentos
FOR SELECT
USING (
  current_setting('request.headers')::json->>'x-api-key' = 'SUA_API_KEY_SECRETA'
);
```

---

## 📊 Exemplo Completo de Integração

```typescript
// App.tsx ou página principal
import { useState, useEffect } from 'react'
import { listarAgendamentosExternos } from './services/agendamentos-externos'

export function DashboardIntegrado() {
  const [agendamentosLocais, setAgendamentosLocais] = useState([])
  const [agendamentosExternos, setAgendamentosExternos] = useState([])

  useEffect(() => {
    async function carregarDados() {
      // Carregar agendamentos do projeto local (nfvrbyiocqozpkyispkb)
      const locais = await supabase.from('appointments').select('*')
      setAgendamentosLocais(locais.data)

      // Carregar agendamentos do projeto externo (dmsaqxuoruinwpnonpky)
      const externos = await listarAgendamentosExternos()
      setAgendamentosExternos(externos)
    }

    carregarDados()
  }, [])

  return (
    <div>
      <h1>Dashboard Integrado</h1>
      
      <section>
        <h2>Agendamentos Locais ({agendamentosLocais.length})</h2>
        {/* Renderizar agendamentos locais */}
      </section>

      <section>
        <h2>Agendamentos Sistema Externo ({agendamentosExternos.length})</h2>
        {/* Renderizar agendamentos externos */}
      </section>
    </div>
  )
}
```

---

## 🚀 Próximos Passos

1. **Escolher a opção** que melhor se adequa ao seu caso
2. **Configurar credenciais** no `.env`
3. **Testar a integração** em desenvolvimento
4. **Implementar tratamento de erros** robusto
5. **Adicionar cache** se necessário (Redis, React Query)
6. **Monitorar performance** e uso da API

---

## 📝 Variáveis de Ambiente

Adicione ao `.env` do projeto **nfvrbyiocqozpkyispkb**:

```env
# Projeto Externo (dmsaqxuoruinwpnonpky)
VITE_SUPABASE_EXTERNO_URL=https://dmsaqxuoruinwpnonpky.supabase.co
VITE_SUPABASE_EXTERNO_ANON_KEY=sua_anon_key_aqui
# OU para backend
SUPABASE_EXTERNO_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

---

## ✅ Qual opção escolher?

- **Opção 1 (API REST Nativa)**: Mais simples, ideal para começar
- **Opção 2 (Edge Function)**: Melhor controle, lógica customizada
- **Opção 3 (Backend)**: Máximo controle, cache, transformações complexas
