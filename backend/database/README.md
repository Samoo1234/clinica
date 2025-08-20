# VisionCare Database Setup

Este diretório contém os scripts SQL necessários para configurar o banco de dados Supabase do VisionCare.

## Configuração do Supabase

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Clique em "New Project"
4. Escolha sua organização
5. Preencha os dados do projeto:
   - **Name**: VisionCare
   - **Database Password**: Escolha uma senha forte
   - **Region**: Escolha a região mais próxima (ex: South America)
6. Clique em "Create new project"

### 2. Obter Credenciais

Após a criação do projeto, vá para **Settings > API** e copie:

- **Project URL**: `https://your-project-id.supabase.co`
- **anon public key**: Chave pública para uso no frontend
- **service_role secret key**: Chave secreta para uso no backend

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Executar Scripts SQL

Execute os scripts na seguinte ordem no **SQL Editor** do Supabase:

#### 4.1. Schema Principal
```sql
-- Copie e cole o conteúdo de schema.sql
```

#### 4.2. Políticas RLS
```sql
-- Copie e cole o conteúdo de rls-policies.sql
```

#### 4.3. Dados de Teste (Opcional)

**Opção 1 - Dados Simples (Recomendado para teste inicial):**
```sql
-- Copie e cole o conteúdo de test-data-simple.sql
-- Este script insere apenas pacientes e logs, sem usuários
```

**Opção 2 - Dados Completos (Requer configuração adicional):**
```sql
-- Copie e cole o conteúdo de test-data.sql
-- ATENÇÃO: Este script requer que você primeiro crie usuários através do Supabase Auth
-- ou modifique temporariamente as constraints de foreign key
```

## Estrutura do Banco de Dados

### Tabelas Principais

- **users**: Usuários do sistema (médicos, recepcionistas, admin)
- **patients**: Pacientes da clínica
- **medical_records**: Prontuários médicos
- **appointments**: Agendamentos de consultas
- **attachments**: Anexos dos prontuários
- **invoices**: Notas fiscais emitidas
- **integration_logs**: Logs de integrações externas

### Tipos Customizados

- **user_role**: 'admin', 'doctor', 'receptionist'
- **appointment_status**: 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
- **payment_status**: 'pending', 'paid', 'cancelled', 'refunded'
- **invoice_status**: 'pending', 'issued', 'error', 'cancelled'

### Row Level Security (RLS)

Todas as tabelas possuem políticas RLS configuradas para garantir que:

- Usuários só acessem dados que têm permissão
- Médicos só vejam seus próprios prontuários
- Administradores tenham acesso completo
- Dados sensíveis sejam protegidos

### Índices

Índices otimizados para:
- Busca de pacientes por CPF e nome
- Consultas por data e médico
- Pesquisa full-text em nomes de pacientes
- Performance em relatórios

## Verificação da Instalação

Após executar os scripts, verifique se:

1. Todas as tabelas foram criadas
2. As políticas RLS estão ativas
3. Os dados de teste foram inseridos (se aplicável)
4. As funções e triggers estão funcionando

### Teste de Conexão

Execute no backend:

```bash
npm run dev
```

Acesse: `http://localhost:3001/health`

Se a configuração estiver correta, você deve ver uma resposta JSON com status "OK".

## Troubleshooting

### Erro de Conexão
- Verifique se as variáveis de ambiente estão corretas
- Confirme se o projeto Supabase está ativo
- Verifique se não há firewall bloqueando a conexão

### Erro de Permissão
- Confirme se as políticas RLS foram aplicadas corretamente
- Verifique se o usuário tem as permissões necessárias
- Teste com a service_role key para operações administrativas

### Erro de Schema
- Execute os scripts na ordem correta
- Verifique se não há conflitos de nomes
- Confirme se as extensões necessárias estão habilitadas

### Erro "permission denied to set parameter app.jwt_secret"
- Este erro foi corrigido na versão atual do schema.sql
- A linha problemática foi removida pois não é necessária no Supabase

### Erro de Foreign Key ao inserir dados de teste
- Use o arquivo `test-data-simple.sql` para dados básicos sem usuários
- Para dados completos, você precisa primeiro criar usuários através do Supabase Auth
- Alternativamente, use o painel do Supabase para criar usuários manualmente primeiro

## Backup e Manutenção

### Backup Automático
O Supabase faz backup automático dos dados. Para backups manuais:

1. Vá para **Settings > Database**
2. Clique em "Database backups"
3. Configure backups automáticos ou faça backup manual

### Monitoramento
- Use o Dashboard do Supabase para monitorar performance
- Configure alertas para uso de recursos
- Monitore logs de erro na aba "Logs"