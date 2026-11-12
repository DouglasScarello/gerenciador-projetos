-- Migration 003: Adicionar prioridade, label e due_date às tarefas (Linear Style)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NOT NULL DEFAULT 'none';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS label VARCHAR(50) DEFAULT 'feature';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE;

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_label ON tasks(label);
