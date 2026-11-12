# 📋 Gerenciador de Projetos (Kanban Full-Stack)

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg?style=for-the-badge)](LICENSE)

Aplicação web full-stack para gerenciamento de projetos e tarefas em quadro Kanban com suporte a movimentação drag-and-drop, sincronização em tempo real e isolamento de dados por usuário.

---

## 🛠️ Tecnologias Utilizadas

### Backend
* **Linguagem & Framework:** Node.js (v20+) e Express.js
* **Banco de Dados:** PostgreSQL (driver `pg` com pool de conexões)
* **Tempo Real & Mensageria:** Socket.IO integrado ao Redis (`@socket.io/redis-adapter`)
* **Controle de Taxa:** Express Rate Limit com armazenamento no Redis (`rate-limit-redis`)
* **Segurança & Validação:** JWT via cookies `httpOnly`, bcrypt para hash de senhas, Zod e validator.js
* **Testes Automatizados:** Jest (testes de regras de negócio, atomicidade e isolamento multi-tenant)

### Frontend
* **Core:** React 18 com Vite
* **Gerenciamento de Estado de Servidor:** TanStack Query (React Query) com atualizações otimistas (*optimistic updates*)
* **Tempo Real:** Socket.IO Client (conexão vinculada à sala do projeto selecionado)
* **Estilização:** Tailwind CSS e CSS modularizado
* **Notificações:** React Hot Toast
* **Comunicação HTTP:** Axios com `withCredentials: true` para tráfego seguro de cookies de sessão

### Infraestrutura
* **Docker Compose:** Orquestração local dos serviços de PostgreSQL, Redis, Backend e Frontend

---

## 🏛️ Arquitetura e Decisões de Implementação

1. **Separação em Camadas (Backend):**
   * `routes/`: Roteamento HTTP, extração de parâmetros e delegação.
   * `services/`: Regras de negócio, validação de schemas com Zod e DTO mapping.
   * `repositories/`: Camada de persistência responsável por consultas SQL parametrizadas.

2. **Isolamento de Dados (Multi-tenancy):**
   * Toda consulta, atualização e deleção de projetos e tarefas valida se `p.owner_id = req.userId`. Um usuário autenticado não possui permissão para ler ou alterar dados de outros usuários.

3. **Atomicidade em Criação:**
   * A criação de um novo projeto utiliza transações manuais com o cliente do PostgreSQL (`BEGIN`, `COMMIT`, `ROLLBACK`), garantindo que o projeto e sua tarefa inicial de boas-vindas sejam persistidos juntos ou cancelados em caso de falha.

4. **Sincronização em Tempo Real:**
   * Ao selecionar um projeto, o cliente se conecta a uma sala específica (`project_${id}`) no Socket.IO.
   * Operações de criação, edição e exclusão de tarefas emitem eventos para a sala correspondente, disparando a invalidação de cache no TanStack Query dos clientes conectados.

5. **Migrações de Banco de Dados:**
   * O projeto conta com um executor próprio de migrações (`backend/migrations/runner.js`) que registra os scripts já executados na tabela `_migrations`, evitando inconsistências manuais de schema.

---

## ⚙️ Como Executar o Projeto

### Opção 1: Via Docker Compose (Recomendado)

Suba toda a infraestrutura (PostgreSQL, Redis, API e Client) com um único comando:

```bash
docker-compose up --build
```

* **Frontend:** [http://localhost:80](http://localhost:80)
* **Backend:** [http://localhost:5000](http://localhost:5000)

---

### Opção 2: Execução Local Passo a Passo

#### Pré-requisitos
* Node.js 18+ instalado
* PostgreSQL e Redis em execução localmente

#### 1. Configurar o Backend
```bash
cd backend
npm install
```

Crie o arquivo `backend/.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=defina_uma_chave_secreta_segura
DB_HOST=localhost
DB_PORT=5432
DB_USER=seu_usuario_postgres
DB_PASSWORD=sua_senha_postgres
DB_NAME=gerenciador_projetos_sql
REDIS_URL=redis://localhost:6379
CLIENT_ORIGIN=http://localhost:5173
```

Execute as migrações para criar as tabelas e índices:
```bash
npm run migrate
```

Inicie o servidor backend:
```bash
npm run dev
```

#### 2. Configurar o Frontend
Em outro terminal:
```bash
cd client
npm install
npm run dev
```

Acesse a interface no navegador em [http://localhost:5173](http://localhost:5173).

---

## 🧪 Testes Automatizados

O backend conta com testes cobrindo tratamento operacional de erros, serviços de domínio e isolamento de dados com mocks:

```bash
cd backend
npm test
```

---

## 🎯 Funcionalidades Implementadas

* [x] Cadastro e autenticação de usuários com senha criptografada (bcrypt).
* [x] Sessão segura via cookies `httpOnly` com proteção `SameSite`.
* [x] CRUD completo de projetos com criação atômica da primeira tarefa.
* [x] Quadro Kanban com 3 colunas (*Para fazer*, *Em andamento*, *Concluído*).
* [x] Movimentação de tarefas via Drag-and-Drop ou botões direcionais acessíveis via teclado.
* [x] Atualizações otimistas no frontend (o card move instantaneamente e reverte em caso de erro na API).
* [x] Atualização em tempo real via WebSockets entre múltiplas abas ou navegadores abertos no mesmo projeto.
* [x] Rota de proteção no cliente (`ProtectedRoute`) validando o token no endpoint `/api/auth/me`.

---

## 📄 Licença

Este projeto é disponibilizado sob a licença **ISC**.  
Desenvolvido por **[Douglas Scarello](https://github.com/DouglasScarello)**.
