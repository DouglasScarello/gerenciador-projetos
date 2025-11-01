const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.post('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { description, status } = req.body;
    const { rowCount } = await pool.query('SELECT 1 FROM projects WHERE id = $1 AND owner_id = $2', [projectId, req.userId]);
    if (rowCount === 0) return res.status(404).json({ message: 'Projeto não encontrado' });
    const { rows } = await pool.query(
      'INSERT INTO tasks(description, status, project_id) VALUES($1, $2, $3) RETURNING *',
      [description, status || 'todo', projectId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar tarefa', error: err.message });
  }
});

router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { rowCount } = await pool.query('SELECT 1 FROM projects WHERE id = $1 AND owner_id = $2', [projectId, req.userId]);
    if (rowCount === 0) return res.status(404).json({ message: 'Projeto não encontrado' });
    const { rows } = await pool.query(
      'SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC',
      [projectId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar tarefas', error: err.message });
  }
});

router.put('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { description, status } = req.body;
    const { rows } = await pool.query(
      `UPDATE tasks t
       SET description = COALESCE($1, t.description),
           status = COALESCE($2, t.status)
       FROM projects p
       WHERE t.id = $3 AND t.project_id = p.id AND p.owner_id = $4
       RETURNING t.*`,
      [description, status, taskId, req.userId]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Tarefa não encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar tarefa', error: err.message });
  }
});

router.delete('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { rowCount } = await pool.query(
      'DELETE FROM tasks t USING projects p WHERE t.id = $1 AND t.project_id = p.id AND p.owner_id = $2',
      [taskId, req.userId]
    );
    if (rowCount === 0) return res.status(404).json({ message: 'Tarefa não encontrada' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao remover tarefa', error: err.message });
  }
});

module.exports = router;


