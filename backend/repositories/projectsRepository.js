const { pool } = require('../db');

const projectsRepository = {
    async create(title, description, status, ownerId) {
        const { rows } = await pool.query(
            'INSERT INTO projects(title, description, status, owner_id) VALUES($1, $2, $3, $4) RETURNING *',
            [title, description, status, ownerId]
        );
        return rows[0];
    },

    async findAllByOwner(ownerId, limit = 20, offset = 0) {
        const { rows } = await pool.query(
            'SELECT * FROM projects WHERE owner_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
            [ownerId, limit, offset]
        );
        return rows;
    },

    async findByIdAndOwner(id, ownerId) {
        const { rows } = await pool.query(
            'SELECT * FROM projects WHERE id = $1 AND owner_id = $2',
            [id, ownerId]
        );
        return rows[0];
    },

    async update(id, ownerId, updates, values) {
        const { rows } = await pool.query(
            `UPDATE projects
       SET ${updates.join(', ')}
       WHERE id = $${values.length - 1} AND owner_id = $${values.length}
       RETURNING *`,
            values
        );
        return rows[0];
    },

    async delete(id, ownerId) {
        const { rowCount } = await pool.query(
            'DELETE FROM projects WHERE id = $1 AND owner_id = $2',
            [id, ownerId]
        );
        return rowCount > 0;
    }
};

module.exports = projectsRepository;
