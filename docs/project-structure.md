# Estrutura do Projeto VisionCare

## Visão Geral

O VisionCare é organizado como um monorepo com frontend e backend separados, utilizando workspaces do npm para gerenciamento de dependências.

## Estrutura de Pastas

```
visioncare/
├── frontend/                 # Aplicação React
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilitários e configurações
│   │   ├── types/           # Tipos TypeScript
│   │   ├── App.tsx          # Componente principal
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Estilos globais
│   ├── public/              # Arquivos estáticos
│   ├── package.json
│   ├── vite.config.ts       # Configuração Vite
│   ├── tailwind.config.js   # Configuração Tailwind
│   └── tsconfig.json        # Configuração TypeScript
│
├── backend/                  # API Node.js
│   ├── src/
│   │   ├── routes/          # Rotas da API
│   │   ├── middleware/      # Middlewares customizados
│   │   ├── services/        # Lógica de negócio
│   │   ├── types/           # Tipos TypeScript
│   │   ├── utils/           # Utilitários
│   │   └── index.ts         # Entry point
│   ├── package.json
│   ├── tsconfig.json        # Configuração TypeScript
│   └── jest.config.js       # Configuração de testes
│
├── docs/                     # Documentação
│   └── project-structure.md
│
├── .kiro/specs/             # Especificações do projeto
│   └── sistema-clinica-oftalmologica/
│       ├── requirements.md
│       ├── design.md
│       └── tasks.md
│
├── package.json             # Configuração do workspace
├── docker-compose.yml       # Configuração Docker
├── .env.example            # Exemplo de variáveis de ambiente
├── .gitignore
└── README.md
```

## Tecnologias Utilizadas

### Frontend
- **React 18** - Framework principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS
- **React Router** - Roteamento
- **React Query** - Gerenciamento de estado servidor
- **React Hook Form** - Formulários
- **Zod** - Validação de schemas
- **Supabase Client** - Cliente para backend

### Backend
- **Node.js** - Runtime
- **Express.js** - Framework web
- **TypeScript** - Tipagem estática
- **Supabase** - Backend as a Service
- **JWT** - Autenticação
- **Zod** - Validação de dados
- **Jest** - Framework de testes

### DevOps
- **Docker** - Containerização
- **ESLint** - Linting
- **Prettier** - Formatação de código
- **Concurrently** - Execução paralela de scripts

## Scripts Disponíveis

### Workspace (raiz)
- `npm run dev` - Executa frontend e backend simultaneamente
- `npm run build` - Build de produção
- `npm run test` - Executa todos os testes
- `npm run lint` - Linting em todo o código

### Frontend
- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run preview` - Preview do build
- `npm run test` - Testes unitários
- `npm run lint` - ESLint

### Backend
- `npm run dev` - Servidor de desenvolvimento com watch
- `npm run build` - Compilação TypeScript
- `npm run start` - Executa versão compilada
- `npm run test` - Testes unitários
- `npm run lint` - ESLint

## Próximos Passos

1. ✅ Configuração inicial do projeto
2. ⏳ Configuração do Supabase
3. ⏳ Sistema de autenticação
4. ⏳ Interface base
5. ⏳ Gestão de pacientes

## Convenções de Código

### Nomenclatura
- **Componentes**: PascalCase (ex: `PatientForm`)
- **Arquivos**: kebab-case (ex: `patient-form.tsx`)
- **Variáveis/Funções**: camelCase (ex: `getUserData`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `API_BASE_URL`)

### Estrutura de Componentes
```tsx
// Imports
import React from 'react'
import { ComponentProps } from './types'

// Types/Interfaces
interface Props {
  // ...
}

// Component
export const Component: React.FC<Props> = ({ prop1, prop2 }) => {
  // Hooks
  // State
  // Effects
  // Handlers
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}

// Default export
export default Component
```