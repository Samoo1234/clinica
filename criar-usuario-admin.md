# Criar Usuário Admin no Vision Care

## Opção 1: Via Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto **nfvrbyiocqozpkyispkb** (Vision Care)
3. Vá em **Authentication** → **Users**
4. Clique em **Add user**
5. Preencha:
   - Email: `admin@visioncare.com`
   - Password: `Admin123!`
   - Confirme a senha

6. Depois, vá em **Table Editor** → **users**
7. Insira um registro:
   ```sql
   INSERT INTO users (id, email, name, role, active)
   VALUES (
     'UUID_DO_USUARIO_CRIADO',
     'admin@visioncare.com',
     'Administrador',
     'admin',
     true
   );
   ```

## Opção 2: Via SQL Editor

Execute no SQL Editor do Supabase (projeto Vision Care):

```sql
-- 1. Criar usuário na autenticação (substitua o UUID)
-- Isso precisa ser feito manualmente no painel de Authentication

-- 2. Depois de criar no Authentication, pegue o UUID e execute:
INSERT INTO public.users (id, email, name, role, active, created_at, updated_at)
VALUES (
  'SEU_UUID_AQUI', -- Pegue do Authentication
  'admin@visioncare.com',
  'Administrador',
  'admin',
  true,
  now(),
  now()
);
```

## Opção 3: Usar usuário existente

Se já existe algum usuário cadastrado, use as credenciais dele.

Para ver os usuários existentes:

```sql
SELECT email, name, role FROM users WHERE active = true;
```

---

## Depois de criar o usuário:

1. Acesse: `http://localhost:3000/`
2. Faça login com:
   - Email: `admin@visioncare.com`
   - Senha: `Admin123!` (ou a que você definiu)
3. Depois acesse: `http://localhost:3000/appointments/unified`

---

## ✅ Pronto!

Agora você conseguirá ver os agendamentos dos dois sistemas!
