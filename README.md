# Gerenciador de Projetos

Aplicação Full-Stack de gerenciamento de projetos e tarefas com sistema de tickets (Kanban) usando PostgreSQL, Express, React e Node.js.

## 🚀 Tecnologias

- **Backend**: Node.js, Express.js, PostgreSQL
- **Frontend**: React, Vite, TailwindCSS, React Router
- **Autenticação**: JWT (JSON Web Tokens)
- **Banco de Dados**: PostgreSQL

## 📋 Requisitos

- Node.js 18+ 
- PostgreSQL 12+
- npm ou yarn

## 🗄️ Banco de Dados

### 1. Crie o banco de dados PostgreSQL

```bash
createdb gerenciador_projetos_sql
```

### 2. Execute o schema

```bash
psql -d gerenciador_projetos_sql -f backend/schema.sql
```

Ou manualmente via psql:

```bash
psql -d gerenciador_projetos_sql
\i backend/schema.sql
```

## ⚙️ Configuração

### Backend

1. Entre na pasta do backend:
```bash
cd backend
```

2. Crie um arquivo `.env` na pasta `backend` com as seguintes variáveis:
```env
PORT=5000
JWT_SECRET=um-segredo-forte-aqui
DB_HOST=localhost
DB_PORT=5432
DB_USER=seu_usuario_postgres
DB_PASSWORD=sua_senha_postgres
DB_NAME=gerenciador_projetos_sql
CLIENT_ORIGIN=http://localhost:5173
```

3. Instale as dependências:
```bash
npm install
```

4. Execute o servidor em modo desenvolvimento:
```bash
npm run dev
```

O servidor estará rodando em `http://localhost:5000`

### Frontend

1. Entre na pasta do client:
```bash
cd client
```

2. Configure a URL da API (opcional):
   - Por padrão, a API usa `http://localhost:5000/api`
   - Para customizar, crie um arquivo `.env.local`:
```env
VITE_API_URL=http://localhost:5000/api
```

3. Instale as dependências:
```bash
npm install
```

4. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 🎯 Funcionalidades

### Sistema de Tickets (Kanban Board)

- ✅ Criar, editar e excluir tickets
- ✅ Mover tickets entre estágios: **Para fazer** → **Em andamento** → **Concluído**
- ✅ Arrastar e soltar (drag & drop) tickets entre colunas
- ✅ Botões de navegação rápida (← Voltar / Avançar →)
- ✅ Modal de edição com validação

### Gerenciamento de Tarefas

- ✅ Criar tarefas dentro de projetos
- ✅ Marcar tarefas como concluídas
- ✅ Excluir tarefas

### Autenticação

- ✅ Registro de usuários
- ✅ Login com JWT
- ✅ Proteção de rotas

## 📡 Rotas da API

### Autenticação (`/api/auth`)
- `POST /api/auth/register` - Registrar novo usuário
  ```json
  {
    "name": "Nome do Usuário",
    "email": "usuario@email.com",
    "password": "senha123"
  }
  ```
- `POST /api/auth/login` - Login de usuário
  ```json
  {
    "email": "usuario@email.com",
    "password": "senha123"
  }
  ```

### Projetos/Tickets (`/api/projetos`)
Require autenticação (token JWT no header `Authorization: Bearer <token>`)

- `GET /api/projetos` - Listar todos os projetos/tickets do usuário
- `POST /api/projetos` - Criar novo ticket
  ```json
  {
    "title": "Título do ticket",
    "description": "Descrição opcional",
    "status": "todo" // ou "in_progress" ou "done"
  }
  ```
- `PUT /api/projetos/:id` - Atualizar ticket
  ```json
  {
    "title": "Título atualizado",
    "description": "Nova descrição",
    "status": "in_progress"
  }
  ```
- `DELETE /api/projetos/:id` - Excluir ticket

### Tarefas (`/api/tarefas`)
Require autenticação (token JWT no header `Authorization: Bearer <token>`)

- `GET /api/tarefas/:projectId` - Listar tarefas de um projeto
- `POST /api/tarefas/:projectId` - Criar nova tarefa
  ```json
  {
    "description": "Descrição da tarefa",
    "status": "todo" // ou "done"
  }
  ```
- `PUT /api/tarefas/:taskId` - Atualizar tarefa
- `DELETE /api/tarefas/:taskId` - Excluir tarefa

### Health Check
- `GET /api/health` - Verificar status da API

## 📊 Estrutura do Banco de Dados

### Tabela `users`
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR(100))
- `email` (VARCHAR(100) UNIQUE)
- `password_hash` (TEXT)
- `created_at` (TIMESTAMP)

### Tabela `projects` (Tickets)
- `id` (SERIAL PRIMARY KEY)
- `title` (VARCHAR(255))
- `description` (TEXT)
- `status` (VARCHAR(20)) - Valores: `todo`, `in_progress`, `done`
- `owner_id` (INTEGER) - Foreign Key para `users.id`
- `created_at` (TIMESTAMP)

### Tabela `tasks`
- `id` (SERIAL PRIMARY KEY)
- `description` (TEXT)
- `status` (VARCHAR(20)) - Valores: `todo`, `done`
- `project_id` (INTEGER) - Foreign Key para `projects.id`
- `created_at` (TIMESTAMP)

## 🔧 Scripts Disponíveis

### Backend
- `npm run dev` - Executa o servidor em modo desenvolvimento (nodemon)
- `npm start` - Executa o servidor em modo produção
- `npm test` - Executa testes (ainda não implementado)

### Frontend
- `npm run dev` - Executa o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa o linter

## 🚢 Deploy

### Backend
- **Render/Heroku**: Configure as variáveis de ambiente no painel
- Certifique-se de que o PostgreSQL esteja acessível
- Configure `CLIENT_ORIGIN` com a URL do frontend em produção

### Frontend
- **Vercel/Netlify**: Configure `VITE_API_URL` apontando para a API em produção
- Exemplo: `VITE_API_URL=https://sua-api.herokuapp.com/api`

## 📝 Notas Importantes

- A coluna `status` na tabela `projects` é necessária para o funcionamento do sistema de tickets
- Se estiver usando uma instalação antiga, execute a migration em `backend/migrations/001_add_status_to_projects.sql`
- O token JWT tem validade de 7 dias
- Todos os endpoints de projetos e tarefas requerem autenticação

## 🐛 Troubleshooting

### Erro: "coluna status da relação projects não existe"
Execute o comando SQL para adicionar a coluna:
```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'todo';
```

### Erro de conexão com o banco
Verifique se:
- PostgreSQL está rodando
- As credenciais no `.env` estão corretas
- O banco de dados foi criado

### CORS Error
Certifique-se de que `CLIENT_ORIGIN` no backend aponta para a URL correta do frontend.

## 📄 Licença

ISC
