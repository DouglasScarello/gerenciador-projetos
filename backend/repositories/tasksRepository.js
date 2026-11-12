const { pool } = require('../db');

const tasksRepository = {
    async create(title, description, status, projectId, priority = 'none', label = 'feature', dueDate = null, dbClient = null) {
        const client = dbClient || pool;
        const taskTitle = title || description || 'Sem título';
        const taskDesc = description !== undefined ? description : null;
        const { rows } = await client.query(
            'INSERT INTO tasks(title, description, status, priority, label, due_date, project_id) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [taskTitle, taskDesc, status || 'todo', priority || 'none', label || 'feature', dueDate || null, projectId]
        );
        return rows[0];
    },

    async findByProject(projectId) {
        const { rows } = await pool.query(
            'SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC',
            [projectId]
        );
        return rows;
    },

    async update(taskId, title, description, status, priority, label, dueDate, userId) {
        const { rows } = await pool.query(
            `UPDATE tasks t
       SET title = COALESCE($1, t.title),
           description = COALESCE($2, t.description),
           status = COALESCE($3, t.status),
           priority = COALESCE($4, t.priority),
           label = COALESCE($5, t.label),
           due_date = COALESCE($6, t.due_date)
       FROM projects p
       WHERE t.id = $7 AND t.project_id = p.id AND p.owner_id = $8
       RETURNING t.*`,
            [title, description, status, priority, label, dueDate, taskId, userId]
        );
        return rows[0];
    },

    async delete(taskId, userId) {
        const { rowCount } = await pool.query(
            'DELETE FROM tasks t USING projects p WHERE t.id = $1 AND t.project_id = p.id AND p.owner_id = $2',
            [taskId, userId]
        );
        return rowCount > 0;
    },

    async findById(taskId) {
        const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
        return rows[0];
    }
};

module.exports = tasksRepository;
