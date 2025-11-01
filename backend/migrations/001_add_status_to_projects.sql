-- Migration: Adicionar coluna status à tabela projects
-- Data: $(date)

-- Adicionar coluna status se não existir
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'todo';

-- Atualizar registros existentes sem status para 'todo'
UPDATE projects
SET status = 'todo'
WHERE status IS NULL;

