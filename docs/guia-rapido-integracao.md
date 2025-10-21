# 🚀 Guia Rápido - Integração de Agendamentos

## ✅ Recomendação: API REST Nativa

Usar a API REST nativa do Supabase é a melhor opção porque:
- ✅ Simples e rápido
- ✅ Sem deploy necessário
- ✅ Manutenção zero
- ✅ Performance excelente
- ✅ Sem custos extras

---

## 📋 Passo a Passo (5 minutos)

### **1. Adicionar variáveis ao `.env`**

Copie estas linhas para o seu arquivo `.env`:

```env
# Sistema Externo de Agendamentos
VITE_SUPABASE_EXTERNO_URL=https://dmsaqxuoruinwpnonpky.supabase.co
VITE_SUPABASE_EXTERNO_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc2FxeHVvcnVpbndwbm9ucGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQyNTYsImV4cCI6MjA2ODUxMDI1Nn0.qgUE3Lpn5-dgphbW6k59Pu4M-xkwpI6KtAYR7m5FkdU
```

### **2. Configurar RLS (Opcional)**

Se quiser controlar o acesso, execute no SQL Editor do projeto **dmsaqxuoruinwpnonpky**:

```sql
-- Permitir leitura pública dos agendamentos
CREATE POLICY "Permitir leitura via API"
ON agendamentos
FOR SELECT
USING (true);
```

**Ou deixe sem RLS** se a tabela já estiver acessível.

### **3. Usar no código**

```tsx
import { AgendamentosExternos } from './components/AgendamentosExternos'

function MinhaPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <AgendamentosExternos />
    </div>
  )
}
```

**Ou usar o serviço diretamente:**

```typescript
import { listarAgendamentosExternos } from './services/agendamentos-externos'

// Buscar agendamentos de hoje
const hoje = new Date().toISOString().split('T')[0]
const agendamentos = await listarAgendamentosExternos({
  dataInicio: hoje,
  dataFim: hoje,
  status: 'confirmado'
})

console.log(`${agendamentos.length} agendamentos hoje`)
```

---

## 🎯 Exemplos de Uso

### **Dashboard com múltiplos sistemas**

```tsx
import { useState, useEffect } from 'react'
import { supabase } from './config/supabase' // Projeto local
import { listarAgendamentosExternos } from './services/agendamentos-externos'

export function DashboardIntegrado() {
  const [agendamentosLocais, setAgendamentosLocais] = useState([])
  const [agendamentosExternos, setAgendamentosExternos] = useState([])

  useEffect(() => {
    async function carregar() {
      // Sistema local (nfvrbyiocqozpkyispkb)
      const { data: locais } = await supabase
        .from('appointments')
        .select('*')
        .gte('scheduled_at', new Date().toISOString())
      
      // Sistema externo (dmsaqxuoruinwpnonpky)
      const externos = await listarAgendamentosExternos({
        dataInicio: new Date().toISOString().split('T')[0]
      })

      setAgendamentosLocais(locais || [])
      setAgendamentosExternos(externos)
    }

    carregar()
  }, [])

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h2>Sistema Principal</h2>
        <p>{agendamentosLocais.length} agendamentos</p>
      </div>
      <div>
        <h2>Sistema Externo</h2>
        <p>{agendamentosExternos.length} agendamentos</p>
      </div>
    </div>
  )
}
```

### **Buscar por paciente**

```typescript
import { buscarAgendamentosPorNome } from './services/agendamentos-externos'

const agendamentos = await buscarAgendamentosPorNome('Pedro')
console.log(`Encontrados ${agendamentos.length} agendamentos`)
```

### **Estatísticas**

```typescript
import { obterEstatisticasAgendamentos } from './services/agendamentos-externos'

const stats = await obterEstatisticasAgendamentos(
  '2025-10-01',
  '2025-10-31'
)

console.log(`
  Total: ${stats.total}
  Realizados: ${stats.realizados}
  Taxa de realização: ${stats.taxaRealizacao.toFixed(1)}%
  Valor total: R$ ${stats.valorTotal.toFixed(2)}
`)
```

---

## 🔍 Testar a Integração

### **Teste 1: Verificar conexão**

```typescript
import { testarConexao } from './services/agendamentos-externos'

const ok = await testarConexao()
console.log(ok ? '✅ Conectado' : '❌ Erro na conexão')
```

### **Teste 2: Listar agendamentos**

```typescript
import { listarAgendamentosExternos } from './services/agendamentos-externos'

const agendamentos = await listarAgendamentosExternos({ limite: 5 })
console.log('Primeiros 5 agendamentos:', agendamentos)
```

### **Teste 3: Filtros**

```typescript
const confirmados = await listarAgendamentosExternos({
  status: 'confirmado',
  cidade: 'São Paulo',
  limite: 10
})
```

---

## 📊 Funções Disponíveis

| Função | Descrição |
|--------|-----------|
| `listarAgendamentosExternos(filtros)` | Lista com filtros customizados |
| `obterAgendamentosHoje()` | Agendamentos de hoje |
| `obterAgendamentosSemana()` | Agendamentos da semana |
| `obterAgendamentosPorStatus(status)` | Filtra por status |
| `buscarAgendamentosPorNome(nome)` | Busca por nome do paciente |
| `obterEstatisticasAgendamentos()` | Estatísticas e métricas |
| `testarConexao()` | Verifica se está funcionando |

---

## 🔒 Segurança

### **A Anon Key é segura?**

✅ **Sim!** A Anon Key pode ser exposta no frontend porque:
- Respeita as políticas RLS do banco
- Só permite operações autorizadas
- É projetada para uso público

### **Quando usar Service Role Key?**

❌ **Nunca no frontend!** Use apenas em:
- Backend/servidor
- Edge Functions
- Scripts administrativos

---

## 🎨 Personalizar o Componente

O componente `AgendamentosExternos.tsx` já está pronto, mas você pode:

1. **Mudar as cores** (linha 52-58)
2. **Adicionar mais filtros** (linha 88-130)
3. **Customizar a tabela** (linha 135-250)
4. **Adicionar ações** (botões de editar, cancelar, etc)

---

## 🐛 Troubleshooting

### **Erro: "Failed to fetch"**
- Verifique se as variáveis de ambiente estão corretas
- Confirme que o projeto está ativo no Supabase

### **Erro: "Row level security policy"**
- Configure RLS ou desabilite temporariamente para testes

### **Dados não aparecem**
- Verifique se há dados na tabela `agendamentos`
- Teste com `testarConexao()` primeiro

---

## ✅ Checklist

- [ ] Variáveis adicionadas ao `.env`
- [ ] Servidor reiniciado
- [ ] Teste de conexão executado
- [ ] Componente importado
- [ ] Dados aparecendo na tela

---

## 🎉 Pronto!

Sua integração está completa. Agora você pode:
- Ver agendamentos dos dois sistemas
- Filtrar e buscar dados
- Criar dashboards unificados
- Gerar relatórios consolidados

**Tempo total:** ~5 minutos ⚡
