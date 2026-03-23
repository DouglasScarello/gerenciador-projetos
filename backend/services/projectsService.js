const projectsRepository = require('../repositories/projectsRepository');
const AppError = require('../utils/AppError');

const ALLOWED_STATUSES = ['todo', 'in_progress', 'done'];

const projectsService = {
    async createProject(data, userId) {
        const { title, description, status } = data;
        const normalizedStatus = status || 'todo';

        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            throw new AppError('Título é obrigatório', 400);
        }

        if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
            throw new AppError('Status inválido', 400);
        }

        let normalizedDescription = null;
        if (description !== undefined && description !== null) {
            const trimmed = String(description).trim();
            normalizedDescription = trimmed.length > 0 ? trimmed : null;
        }

        return await projectsRepository.create(title.trim(), normalizedDescription, normalizedStatus, userId);
    },

    async listUserProjects(userId, queryParams = {}) {
        const limit = parseInt(queryParams.limit, 10) || 20;
        const offset = parseInt(queryParams.offset, 10) || 0;

        return await projectsRepository.findAllByOwner(userId, limit, offset);
    },

    async updateProject(projectId, userId, data) {
        const { title, description, status } = data;

        if (status && !ALLOWED_STATUSES.includes(status)) {
            throw new AppError('Status inválido', 400);
        }

        if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
            throw new AppError('Título não pode ser vazio', 400);
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
            throw new AppError('Nenhum campo para atualizar', 400);
        }

        values.push(projectId, userId);

        const updated = await projectsRepository.update(projectId, userId, updates, values);
        if (!updated) {
            throw new AppError('Projeto não encontrado', 404);
        }
        return updated;
    },

    async deleteProject(projectId, userId) {
        const success = await projectsRepository.delete(projectId, userId);
        if (!success) {
            throw new AppError('Projeto não encontrado', 404);
        }
        return true;
    }
};

module.exports = projectsService;
