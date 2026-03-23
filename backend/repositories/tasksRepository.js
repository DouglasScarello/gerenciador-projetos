const { pool } = require('../db');

const tasksRepository = {
    async create(description, status, projectId) {
        const { rows } = await pool.query(
            'INSERT INTO tasks(description, status, project_id) VALUES($1, $2, $3) RETURNING *',
            [description, status || 'todo', projectId]
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

    async update(taskId, description, status, userId) {
        const { rows } = await pool.query(
            `UPDATE tasks t
       SET description = COALESCE($1, t.description),
           status = COALESCE($2, t.status)
       FROM projects p
       WHERE t.id = $3 AND t.project_id = p.id AND p.owner_id = $4
       RETURNING t.*`,
            [description, status, taskId, userId]
        );
        return rows[0];
    },

    async delete(taskId, userId) {
        const { rowCount } = await pool.query(
            'DELETE FROM tasks t USING projects p WHERE t.id = $1 AND t.project_id = p.id AND p.owner_id = $2',
            [taskId, userId]
        );
        return rowCount > 0;
    }
};

module.exports = tasksRepository;
