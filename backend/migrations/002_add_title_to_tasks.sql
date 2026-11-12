-- Migration 002: Adicionar coluna title à tabela tasks com suporte a retrocompatibilidade
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT 'Sem título';

-- Atualiza tarefas existentes que possam ter ficado com 'Sem título' usando o início da descrição
UPDATE tasks
SET title = SUBSTRING(description FROM 1 FOR 60)
WHERE title = 'Sem título' AND description IS NOT NULL AND description <> '';
