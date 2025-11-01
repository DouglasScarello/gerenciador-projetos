# 📦 Guia para Subir o Projeto no Git/GitHub

## 1️⃣ Inicializar o Repositório Git (se ainda não fez)

```bash
# Navegue até a pasta do projeto
cd "caminho/do/seu/projeto"

# Inicialize o Git
git init
```

## 2️⃣ Criar Repositório no GitHub

1. Acesse [GitHub](https://github.com)
2. Clique em **"+"** → **"New repository"**
3. Preencha:
   - **Repository name**: `gerenciador-projetos` (ou o nome que preferir)
   - **Description**: "Sistema de gerenciamento de projetos com tickets Kanban"
   - Escolha: **Public** ou **Private**
   - **NÃO** marque "Initialize with README" (já temos um)
4. Clique em **"Create repository"**

## 3️⃣ Adicionar Arquivos ao Git

```bash
# Adicionar todos os arquivos
git add .

# Verificar o que será commitado
git status
```

## 4️⃣ Fazer o Primeiro Commit

```bash
git commit -m "Initial commit: Gerenciador de Projetos com sistema de tickets Kanban

- Backend com Express e PostgreSQL
- Frontend com React e Vite
- Sistema de autenticação JWT
- Gerenciamento de tickets com status (todo, in_progress, done)
- Drag & drop para mover tickets
- Gerenciamento de tarefas por projeto"
```

## 5️⃣ Conectar ao Repositório Remoto do GitHub

```bash
# Substitua SEU_USUARIO pelo seu nome de usuário do GitHub
# Substitua NOME_DO_REPOSITORIO pelo nome que você deu ao repositório

git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git

# Ou usando SSH (se você configurou SSH keys):
# git remote add origin git@github.com:SEU_USUARIO/NOME_DO_REPOSITORIO.git
```

## 6️⃣ Fazer Push para o GitHub

```bash
# Enviar para o GitHub (primeira vez)
git push -u origin main

# Se der erro porque a branch é 'master' ao invés de 'main':
git branch -M main
git push -u origin main
```

## 7️⃣ Verificar no GitHub

Acesse o seu repositório no GitHub e verifique se todos os arquivos foram enviados corretamente.

## 🔄 Comandos para Futuras Atualizações

Sempre que fizer alterações no projeto:

```bash
# 1. Ver o que mudou
git status

# 2. Adicionar arquivos alterados
git add .

# 3. Fazer commit com mensagem descritiva
git commit -m "Descrição do que foi alterado"

# 4. Enviar para o GitHub
git push
```

## 🔍 Verificar Status do Git

```bash
# Ver arquivos modificados
git status

# Ver histórico de commits
git log --oneline

# Ver diferenças
git diff
```

## ⚠️ Arquivos que NÃO são enviados (`.gitignore`)

Os seguintes arquivos são automaticamente ignorados:
- `node_modules/` - Dependências (podem ser reinstaladas com `npm install`)
- `.env` - Variáveis de ambiente (credenciais sensíveis)
- `dist/`, `build/` - Arquivos compilados
- Logs e arquivos temporários

## 🚨 Importante: Nunca Faça Commit de

- Arquivos `.env` com senhas e tokens
- `node_modules/` (é muito grande)
- Credenciais de banco de dados
- Chaves privadas

## 📝 Criando um `.env.example`

É uma boa prática criar um arquivo `.env.example` para documentar as variáveis necessárias:

**backend/.env.example:**
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

Isso ajuda outros desenvolvedores a saberem quais variáveis configurar sem expor valores reais.

