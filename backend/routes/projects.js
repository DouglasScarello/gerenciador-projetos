const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

const ALLOWED_STATUSES = ['todo', 'in_progress', 'done'];

router.post('/', async (req, res) => {
  try {
    console.log('Recebendo requisição POST /projetos');
    console.log('Body:', req.body);
    console.log('UserId:', req.userId);
    
    const { title, description, status } = req.body;
    const normalizedStatus = status || 'todo';

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      console.log('Erro: Título inválido');
      return res.status(400).json({ message: 'Título é obrigatório' });
    }

    if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
      console.log('Erro: Status inválido:', normalizedStatus);
      return res.status(400).json({ message: 'Status inválido' });
    }

    const trimmedTitle = title.trim();
    // Normalizar descrição: undefined/null ou string vazia vira null
    let normalizedDescription = null;
    if (description !== undefined && description !== null) {
      const trimmed = String(description).trim();
      normalizedDescription = trimmed.length > 0 ? trimmed : null;
    }

    console.log('Inserindo projeto:', {
      title: trimmedTitle,
      description: normalizedDescription,
      status: normalizedStatus,
      owner_id: req.userId
    });

    const { rows } = await pool.query(
      'INSERT INTO projects(title, description, status, owner_id) VALUES($1, $2, $3, $4) RETURNING *',
      [trimmedTitle, normalizedDescription, normalizedStatus, req.userId]
    );
    
    console.log('Projeto criado com sucesso:', rows[0]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao criar projeto:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({ message: 'Erro ao criar projeto', error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM projects WHERE owner_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar projetos', error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    // Validação do ID
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({ message: 'ID do projeto inválido' });
    }

    // Validação do status se fornecido
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }

    // Validação do título se fornecido
    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      return res.status(400).json({ message: 'Título não pode ser vazio' });
    }

    // Montar a query dinamicamente baseado nos campos fornecidos
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title.trim());
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description === null || description === '' ? null : description);
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Nenhum campo para atualizar' });
    }

    // Adicionar projectId e userId aos valores
    const idParamIndex = paramIndex;
    const userIdParamIndex = paramIndex + 1;
    values.push(projectId, req.userId);

    const { rows } = await pool.query(
      `UPDATE projects
       SET ${updates.join(', ')}
       WHERE id = $${idParamIndex} AND owner_id = $${userIdParamIndex}
       RETURNING *`,
      values
    );

    if (!rows[0]) {
      return res.status(404).json({ message: 'Projeto não encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar projeto:', err);
    res.status(500).json({ message: 'Erro ao atualizar projeto', error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projectId = parseInt(id, 10);
    
    if (isNaN(projectId)) {
      return res.status(400).json({ message: 'ID do projeto inválido' });
    }

    const { rowCount } = await pool.query(
      'DELETE FROM projects WHERE id = $1 AND owner_id = $2',
      [projectId, req.userId]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Projeto não encontrado' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao remover projeto:', err);
    res.status(500).json({ message: 'Erro ao remover projeto', error: err.message });
  }
});

module.exports = router;


