# 🏗️ PLANO DE AÇÃO - ARQUITETURA DE BANCO DE DADOS

**Data:** 03/12/2025  
**Sistema:** Vision Care (Clínica Oftalmológica)

---

## 📊 SITUAÇÃO ATUAL (PROBLEMÁTICA)

### Bancos Existentes:

| Banco | Project ID | Região | Propósito |
|-------|------------|--------|-----------|
| **CENTRAL** | `egyirufudbococcgdidj` | us-east-1 | Clientes compartilhados |
| **EXTERNO** | `dmsaqxuoruinwpnonpky` | ? | Sistema Agendamentos |
| **LOCAL** | `nfvrbyiocqozpkyispkb` | eu-north-1 | VisionCare |

### Problemas Identificados:

1. ❌ **Tabela `clientes` DUPLICADA** - existe no CENTRAL e no EXTERNO
2. ❌ **`medical_records` no banco EXTERNO** - deveria usar cliente do CENTRAL
3. ❌ **Dados não sincronizados** - Rodrigo Bueno existe no CENTRAL mas verificação falha
4. ❌ **Identificação por telefone** - problemático (duplicados, formato inconsistente)
5. ❌ **Frontend confuso** - múltiplos clientes Supabase apontando para bancos diferentes

---

## 🎯 ARQUITETURA IDEAL

```
                         ┌─────────────────────────┐
                         │    BANCO CENTRAL        │
                         │  egyirufudbococcgdidj   │
                         │                         │
                         │  ┌─────────────────┐    │
                         │  │    clientes     │    │
                         │  │  (codigo, cpf)  │    │
                         │  └────────┬────────┘    │
                         └───────────┼─────────────┘
                                     │
            ┌────────────────────────┼────────────────────────┐
            │                        │                        │
            ▼                        ▼                        ▼
   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
   │  AGENDAMENTOS   │     │   VISIONCARE    │     │      ERP        │
   │  (externo)      │     │    (local)      │     │   (futuro)      │
   │                 │     │                 │     │                 │
   │ agendamentos    │     │ medical_records │     │ vendas          │
   │ (cliente_id →)  │     │ (patient_id →)  │     │ (cliente_id →)  │
   │                 │     │                 │     │                 │
   │ medicos         │     │ consultas       │     │                 │
   │ filiais         │     │ attachments     │     │                 │
   └─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 📋 PLANO DE AÇÃO

### FASE 1: PREPARAÇÃO (1-2 dias)
> Objetivo: Preparar ambiente sem quebrar nada

#### 1.1 Backup dos dados
- [ ] Exportar tabela `clientes` do banco EXTERNO
- [ ] Exportar tabela `clientes` do banco CENTRAL
- [ ] Documentar diferenças entre os registros

#### 1.2 Mapear dependências
- [ ] Listar todas as foreign keys que referenciam `clientes` no banco EXTERNO
- [ ] Identificar quais tabelas precisam migrar referências

#### 1.3 Criar variáveis de ambiente corretas
```env
# .env do frontend
VITE_SUPABASE_URL=https://nfvrbyiocqozpkyispkb.supabase.co          # Local (VisionCare)
VITE_SUPABASE_ANON_KEY=xxx

VITE_SUPABASE_CENTRAL_URL=https://egyirufudbococcgdidj.supabase.co  # Central (Clientes)
VITE_SUPABASE_CENTRAL_ANON_KEY=xxx

VITE_SUPABASE_EXTERNO_URL=https://dmsaqxuoruinwpnonpky.supabase.co  # Externo (Agendamentos)
VITE_SUPABASE_EXTERNO_ANON_KEY=xxx
```

---

### FASE 2: MIGRAÇÃO DE DADOS (1 dia)
> Objetivo: Unificar clientes no banco CENTRAL

#### 2.1 Sincronizar clientes
```sql
-- No banco CENTRAL: Inserir clientes que existem apenas no EXTERNO
INSERT INTO clientes (nome, telefone, cpf, codigo, ...)
SELECT nome, telefone, cpf, codigo, ...
FROM externo.clientes
WHERE cpf NOT IN (SELECT cpf FROM central.clientes WHERE cpf IS NOT NULL)
  AND codigo NOT IN (SELECT codigo FROM central.clientes WHERE codigo IS NOT NULL);
```

#### 2.2 Criar mapeamento de IDs
- [ ] Criar tabela temporária de mapeamento: `id_externo` → `id_central`
- [ ] Usar CPF ou codigo como chave de correlação

---

### FASE 3: AJUSTAR BANCO EXTERNO (1 dia)
> Objetivo: Banco externo usar cliente do CENTRAL

#### 3.1 Adicionar campo `cliente_central_id` na tabela `agendamentos`
```sql
-- No banco EXTERNO
ALTER TABLE agendamentos 
ADD COLUMN cliente_central_id UUID;

COMMENT ON COLUMN agendamentos.cliente_central_id IS 'ID do cliente no banco CENTRAL';
```

#### 3.2 Preencher `cliente_central_id` para agendamentos existentes
```sql
-- Atualizar com base no CPF ou codigo
UPDATE agendamentos a
SET cliente_central_id = (
  SELECT id FROM central.clientes c 
  WHERE c.cpf = a.cpf OR c.codigo = a.codigo
  LIMIT 1
);
```

#### 3.3 Remover tabela `clientes` duplicada (APÓS confirmação)
```sql
-- CUIDADO: Apenas após migração completa e testes
-- DROP TABLE clientes;
```

---

### FASE 4: AJUSTAR MEDICAL_RECORDS (1 dia)
> Objetivo: Prontuários referenciarem cliente do CENTRAL

#### 4.1 Opção A: Mover `medical_records` para banco CENTRAL
```sql
-- Mover tabela medical_records para banco CENTRAL
-- Ajustar foreign key para clientes.id do CENTRAL
```

#### 4.2 Opção B: Manter no banco EXTERNO mas referenciar CENTRAL
```sql
-- Alterar foreign key
ALTER TABLE medical_records
DROP CONSTRAINT medical_records_patient_id_fkey;

-- Adicionar comentário indicando que é referência externa
COMMENT ON COLUMN medical_records.patient_id IS 'ID do cliente no banco CENTRAL (egyirufudbococcgdidj)';
```

---

### FASE 5: AJUSTAR FRONTEND (2-3 dias)
> Objetivo: Código usar arquitetura correta

#### 5.1 Centralizar busca de clientes
```typescript
// services/cliente-central.ts - ÚNICA fonte de clientes
export async function buscarCliente(identificador: {
  id?: string;
  cpf?: string;
  codigo?: string;
  telefone?: string; // último recurso
}): Promise<Cliente | null> {
  
  // Prioridade: ID > CPF > Codigo > Telefone
  if (identificador.id) {
    return buscarPorId(identificador.id);
  }
  if (identificador.cpf) {
    return buscarPorCPF(identificador.cpf);
  }
  if (identificador.codigo) {
    return buscarPorCodigo(identificador.codigo);
  }
  if (identificador.telefone) {
    return buscarPorTelefone(identificador.telefone);
  }
  
  return null;
}
```

#### 5.2 Atualizar AppointmentsExternal.tsx
```typescript
// Usar busca por CPF/codigo primeiro, telefone como fallback
const verificarCliente = async (agendamento: Agendamento) => {
  // 1. Tentar por CPF
  if (agendamento.cpf) {
    const cliente = await buscarClientePorCPF(agendamento.cpf);
    if (cliente) return cliente;
  }
  
  // 2. Tentar por código (se vier do agendamento)
  if (agendamento.codigo_cliente) {
    const cliente = await buscarClientePorCodigo(agendamento.codigo_cliente);
    if (cliente) return cliente;
  }
  
  // 3. Último recurso: telefone (menos confiável)
  if (agendamento.telefone) {
    const cliente = await buscarClientePorTelefone(agendamento.telefone);
    if (cliente) return cliente;
  }
  
  return null; // Cliente não encontrado - mostrar botão Cadastrar
};
```

#### 5.3 Remover serviços duplicados
- [ ] Manter apenas `patient-central.ts` para busca de pacientes/clientes
- [ ] Deprecar/remover `patients.ts` (usa API REST inexistente)
- [ ] Consolidar funções em `supabaseCentral.ts`

---

### FASE 6: TESTES E VALIDAÇÃO (1 dia)

#### 6.1 Testes de integração
- [ ] Verificar que Rodrigo Bueno aparece como "Cadastrado"
- [ ] Criar novo agendamento → verificar se cliente é encontrado
- [ ] Criar prontuário → verificar se salva corretamente
- [ ] Testar com cliente sem CPF (apenas telefone)

#### 6.2 Validar dados
```sql
-- Verificar integridade
SELECT COUNT(*) FROM agendamentos WHERE cliente_central_id IS NULL;
SELECT COUNT(*) FROM medical_records WHERE patient_id IS NULL;
```

---

## 📁 ARQUIVOS MODIFICADOS

### Frontend:
| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `config/supabaseCentral.ts` | ✅ Concluído | Busca CPF > codigo > telefone |
| `pages/AppointmentsExternal.tsx` | ✅ Concluído | Nova lógica de verificação |
| `pages/Consultations.tsx` | ✅ Concluído | Integração com banco EXTERNO |
| `services/patient-sync.ts` | ✅ **NOVO** | Sincronização LOCAL ↔ CENTRAL |
| `services/agendamentos-externos.ts` | ✅ Concluído | Exporta supabaseExterno |
| `services/medical-records.ts` | ✅ OK | Já usa banco LOCAL |

### Fluxo de Persistência Implementado:
```
1. Consulta iniciada (agendamento EXTERNO)
         ↓
2. Buscar histórico por CPF (banco LOCAL)
         ↓
3. Consulta finalizada
         ↓
4. Sincronizar paciente (LOCAL) ← por CPF
         ↓
5. Salvar prontuário (LOCAL.medical_records)
         ↓
6. Atualizar status (EXTERNO.agendamentos → "realizado")
```

### Banco de Dados:
| Banco | Tabela | Ação |
|-------|--------|------|
| EXTERNO | `agendamentos` | ➕ Adicionar `cliente_central_id` |
| EXTERNO | `clientes` | 🗑️ Remover (após migração) |
| CENTRAL | `clientes` | ✅ Fonte única |

---

## ⏱️ CRONOGRAMA ESTIMADO

| Fase | Duração | Descrição |
|------|---------|-----------|
| Fase 1 | 1-2 dias | Preparação e backup |
| Fase 2 | 1 dia | Migração de dados |
| Fase 3 | 1 dia | Ajustar banco externo |
| Fase 4 | 1 dia | Ajustar medical_records |
| Fase 5 | 2-3 dias | Ajustar frontend |
| Fase 6 | 1 dia | Testes |
| **TOTAL** | **7-9 dias** | |

---

## ⚠️ RISCOS E MITIGAÇÕES

| Risco | Mitigação |
|-------|-----------|
| Perda de dados | Backup completo antes de cada fase |
| Downtime do sistema | Fazer migrações em horário de baixo uso |
| Clientes duplicados | Usar CPF/codigo como chave única |
| Foreign keys quebradas | Manter IDs antigos até migração completa |

---

## ✅ CRITÉRIOS DE SUCESSO

1. [ ] Tabela `clientes` existe APENAS no banco CENTRAL
2. [ ] Todos os sistemas (Agendamento, VisionCare, ERP) usam o banco CENTRAL para clientes
3. [ ] Identificação de cliente usa: CPF → codigo → telefone (nessa ordem)
4. [ ] Rodrigo Bueno aparece como "Cadastrado" na página de agendamentos
5. [ ] Prontuários salvam corretamente referenciando cliente do CENTRAL

---

**Criado por:** Cascade AI  
**Última atualização:** 03/12/2025
