const projectsRepository = require('../repositories/projectsRepository');

const ALLOWED_STATUSES = ['todo', 'in_progress', 'done'];

const projectsService = {
    async createProject(data, userId) {
        const { title, description, status } = data;
        const normalizedStatus = status || 'todo';

        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            throw { status: 400, message: 'Título é obrigatório' };
        }

        if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
            throw { status: 400, message: 'Status inválido' };
        }

        let normalizedDescription = null;
        if (description !== undefined && description !== null) {
            const trimmed = String(description).trim();
            normalizedDescription = trimmed.length > 0 ? trimmed : null;
        }

        return await projectsRepository.create(title.trim(), normalizedDescription, normalizedStatus, userId);
    },

    async listUserProjects(userId) {
        return await projectsRepository.findAllByOwner(userId);
    },

    async updateProject(projectId, userId, data) {
        const { title, description, status } = data;

        if (status && !ALLOWED_STATUSES.includes(status)) {
            throw { status: 400, message: 'Status inválido' };
        }

        if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
            throw { status: 400, message: 'Título não pode ser vazio' };
        }

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
            throw { status: 400, message: 'Nenhum campo para atualizar' };
        }

        values.push(projectId, userId);

        const updated = await projectsRepository.update(projectId, userId, updates, values);
        if (!updated) {
            throw { status: 404, message: 'Projeto não encontrado' };
        }
        return updated;
    },

    async deleteProject(projectId, userId) {
        const success = await projectsRepository.delete(projectId, userId);
        if (!success) {
            throw { status: 404, message: 'Projeto não encontrado' };
        }
        return true;
    }
};

module.exports = projectsService;
