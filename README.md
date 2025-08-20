# VisionCare

Sistema de gestão para clínicas oftalmológicas com interface clean e profissional.

## 🚀 Funcionalidades

- ✅ Gestão completa de pacientes
- ✅ Prontuários eletrônicos especializados
- ✅ Sistema de agendamentos
- ✅ Controle financeiro
- ✅ Relatórios e estatísticas
- ✅ Integração com assinatura digital
- ✅ Emissão de NFS-e
- ✅ API para integração com óticas

## 🛠️ Tecnologias

### Frontend
- React 18 com TypeScript
- Tailwind CSS para estilização
- React Router para navegação
- React Query para gerenciamento de estado
- Supabase Client para autenticação e dados

### Backend
- Node.js com TypeScript
- Express.js para APIs
- Supabase como BaaS (Backend as a Service)
- PostgreSQL (via Supabase)
- JWT para autenticação

## 📁 Estrutura do Projeto

```
visioncare/
├── frontend/          # Aplicação React
├── backend/           # APIs Node.js
├── docs/              # Documentação
├── docker-compose.yml # Configuração Docker
└── README.md
```

## 🚀 Como executar

### Pré-requisitos
- Node.js 18+
- npm 9+
- Docker (opcional)

### Instalação

1. Clone o repositório
```bash
git clone <repository-url>
cd visioncare
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Configure suas credenciais do Supabase
```

4. Execute o projeto
```bash
npm run dev
```

O frontend estará disponível em `http://localhost:3000` e o backend em `http://localhost:3001`.

## 🔧 Scripts Disponíveis

- `npm run dev` - Executa frontend e backend em modo desenvolvimento
- `npm run build` - Build de produção
- `npm run test` - Executa todos os testes
- `npm run lint` - Executa linting em todo o código

## 📝 Documentação

A documentação completa está disponível na pasta `docs/` e inclui:
- Especificação de requisitos
- Documento de design
- Plano de implementação
- Guias de API

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato através do email: suporte@visioncare.com.br