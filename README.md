# Gerenciador de Projetos (Kanban Full-Stack)

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![CSS](https://img.shields.io/badge/CSS-Modular-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg?style=for-the-badge)](LICENSE)

Aplicação web full-stack para gerenciamento de projetos e tarefas em quadro Kanban com drag-and-drop, sincronização em tempo real via WebSockets e isolamento de dados por usuário.

---

## Tecnologias

### Backend
- **Node.js 20+** com **Express 5**
- **PostgreSQL** com pool de conexões (`pg`)
- **Redis** — adaptador Socket.IO e rate limiting
- **Socket.IO** — sincronização em tempo real por sala de projeto
- **JWT** via cookie `httpOnly` + **bcrypt** para senhas
- **Zod** — validação de schemas e DTO mapping
- **Jest** — testes unitários de serviços e regras de negócio

### Frontend
- **React 18** com **Vite**
- **TanStack Query** — cache de servidor e atualizações otimistas
- **Socket.IO Client** — recebe eventos em tempo real por projeto
- **Axios** — requisições HTTP com `withCredentials`
- **CSS modular** — design system próprio estilo Linear (dark, minimalista)
- **React Hot Toast** — notificações de feedback
- **Lucide React** — ícones

### Infraestrutura
- **Docker Compose** — orquestra PostgreSQL, Redis, backend e frontend

---

## Arquitetura

```
backend/
  routes/       → HTTP, extração de parâmetros
  services/     → regras de negócio, Zod, DTO
  repositories/ → consultas SQL parametrizadas
  migrations/   → runner próprio com controle de versão
```

**Isolamento multi-tenant:** toda query valida `owner_id = req.userId`. Um usuário não acessa dados de outro.

**Atomicidade:** criação de projeto usa `BEGIN/COMMIT/ROLLBACK` — projeto e tarefa inicial são persistidos juntos ou revertidos.

**Migrações:** `runner.js` registra scripts executados na tabela `_migrations` e só aplica os novos.

---

## Como executar

### Docker Compose (recomendado)

```bash
docker-compose up --build
```

- Frontend: http://localhost:80
- Backend: http://localhost:5000

### Local

**Pré-requisitos:** Node.js 20+, PostgreSQL e Redis rodando localmente.

```bash
# Backend
cd backend
npm install
# Crie o arquivo backend/.env com as variáveis abaixo
npm run migrate
npm run dev

# Frontend (outro terminal)
cd client
npm install
npm run dev
```

**`backend/.env`:**
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=sua_chave_secreta
DB_HOST=localhost
DB_PORT=5432
DB_USER=seu_usuario_postgres
DB_PASSWORD=sua_senha_postgres
DB_NAME=gerenciador_projetos_sql
REDIS_URL=redis://localhost:6379
CLIENT_ORIGIN=http://localhost:5173
```

Acesse em http://localhost:5173.

---

## Testes

```bash
cd backend
npm test
```

3 suítes, 9 testes — cobrindo erros de domínio, serviços de tarefas e projetos com mocks.

---

## Funcionalidades

**Autenticação**
- Cadastro e login com senha criptografada (bcrypt)
- Sessão via cookie `httpOnly` com `SameSite`
- Rota protegida no cliente com validação via `/api/auth/me`

**Projetos**
- Criar, listar e excluir projetos
- Criação atômica — projeto e primeira tarefa de boas-vindas juntos
- Isolamento por usuário — cada conta vê somente seus projetos

**Kanban**
- 3 colunas: *Backlog / Para fazer*, *Em andamento*, *Concluído*
- Mover tarefas via drag-and-drop ou botões direcionais
- Atualização otimista — o card move imediatamente e reverte em erro
- Sincronização em tempo real entre abas e navegadores no mesmo projeto

**Issues / Tarefas**
- Criar e editar título e descrição
- Prioridade: Urgente, Alta, Média, Baixa, Nenhuma — com badge de cor
- Etiqueta: Feature, Bug, Melhoria, Design — com badge de cor
- Prazo de entrega — badge vermelho quando expirado
- Busca instantânea por título ou descrição
- Filtros na topbar por prioridade e etiqueta
- Atalho de teclado `C` para nova issue, `Esc` para fechar modal

---

## Licença

**ISC** — desenvolvido por [Douglas Scarello](https://github.com/DouglasScarello).
