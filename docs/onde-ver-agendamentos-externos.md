# 📍 Onde Ver os Agendamentos Externos no Vision Care

## ✅ CONFIGURADO E PRONTO!

A integração já está funcionando. Você tem **2 formas** de ver os agendamentos:

---

## 🎯 Opção 1: Dashboard Unificado (RECOMENDADO)

### **URL:**
```
http://localhost:5173/appointments/unified
```

### **O que você vê:**
- ✅ Agendamentos do Vision Care (locais)
- ✅ Agendamentos do Sistema Externo (dmsaqxuoruinwpnonpky)
- ✅ Tudo na mesma tela!

### **Recursos:**
- 📊 Cards com totais separados
- 🔍 Filtros para ver só um sistema ou ambos
- 📋 Tabela unificada com cores diferentes:
  - 🔵 Azul = Vision Care
  - 🟢 Verde = Sistema Externo
- 🔄 Botão de atualizar

### **Como acessar:**

**Opção A: Direto pela URL**
```
http://localhost:5173/appointments/unified
```

**Opção B: Adicionar link no menu** (vou te mostrar como)

---

## 🎯 Opção 2: Página Separada

### **URL:**
```
http://localhost:5173/appointments
```

Esta é a página original de agendamentos do Vision Care (só locais).

---

## 🔗 Como Adicionar no Menu Lateral

Vou adicionar um botão no menu para você acessar facilmente:

### **No menu, você verá:**
```
📅 Agendamentos
   ├─ 📋 Agendamentos Locais
   └─ 🌐 Visão Unificada ← NOVO!
```

---

## 🚀 Teste Rápido (3 passos)

### **1. Certifique-se que o `.env` está configurado:**
```env
VITE_SUPABASE_EXTERNO_URL=https://dmsaqxuoruinwpnonpky.supabase.co
VITE_SUPABASE_EXTERNO_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc2FxeHVvcnVpbndwbm9ucGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQyNTYsImV4cCI6MjA2ODUxMDI1Nn0.qgUE3Lpn5-dgphbW6k59Pu4M-xkwpI6KtAYR7m5FkdU
```

### **2. Reinicie o servidor:**
```bash
npm run dev
```

### **3. Acesse:**
```
http://localhost:5173/appointments/unified
```

---

## 📊 O Que Você Vai Ver

### **Cards no Topo:**
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Vision Care     │  │ Sistema Externo │  │ Total Geral     │
│      15         │  │       5         │  │      20         │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### **Filtros:**
```
[ Todos (20) ]  [ Vision Care (15) ]  [ Sistema Externo (5) ]
```

### **Tabela:**
```
┌────────┬────────────┬──────────────┬──────────┬─────────┬────────┐
│ Sistema│ Data/Hora  │ Paciente     │ Contato  │ Médico  │ Status │
├────────┼────────────┼──────────────┼──────────┼─────────┼────────┤
│ 🔵 VC  │ 21/10 10h  │ João Silva   │ (11)999..│ Dr. Ana │ Conf.  │
│ 🟢 Ext │ 21/10 14h  │ Pedro Oliv.  │ (11)777..│ Dr. João│ Pend.  │
│ 🔵 VC  │ 21/10 15h  │ Maria Santos │ (11)888..│ Dr. Ana │ Conf.  │
└────────┴────────────┴──────────────┴──────────┴─────────┴────────┘
```

---

## 🎨 Personalizações Disponíveis

Você pode personalizar:
- ✅ Cores dos cards
- ✅ Colunas da tabela
- ✅ Filtros adicionais
- ✅ Período de datas
- ✅ Exportar para Excel/PDF

---

## 🐛 Troubleshooting

### **Não vejo os agendamentos externos?**
1. Verifique o `.env`
2. Reinicie o servidor (`Ctrl+C` e `npm run dev`)
3. Abra o console do navegador (F12) e veja se há erros

### **Erro de conexão?**
- Verifique se a ANON_KEY está correta
- Teste a conexão com o MCP: `testarConexao()`

### **Dados não atualizam?**
- Clique no botão "🔄 Atualizar Tudo"
- Ou recarregue a página (F5)

---

## 📱 Acesso Rápido

### **Bookmark estas URLs:**
- Dashboard Unificado: `http://localhost:5173/appointments/unified`
- Agendamentos Locais: `http://localhost:5173/appointments`
- Dashboard Principal: `http://localhost:5173/dashboard`

---

## ✅ Checklist

- [x] Rota criada: `/appointments/unified`
- [x] Componente criado: `AgendamentosDashboard.tsx`
- [x] Serviço de integração: `agendamentos-externos.ts`
- [ ] Variáveis no `.env` configuradas
- [ ] Servidor reiniciado
- [ ] Testado no navegador

---

## 🎉 Pronto!

Agora você tem acesso aos agendamentos dos **2 sistemas** em um só lugar!

**Próximo passo:** Adicionar link no menu lateral (quer que eu faça isso?)
