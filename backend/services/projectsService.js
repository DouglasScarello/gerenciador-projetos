const projectsRepository = require('../repositories/projectsRepository');
const AppError = require('../utils/AppError');
const { z } = require('zod');

const projectSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório').trim(),
    description: z.string().optional().nullable().transform(val => val?.trim() || null),
    status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
});

const projectsService = {
    async createProject(data, userId) {
        const validated = projectSchema.parse(data);
        return await projectsRepository.create(validated.title, validated.description, validated.status, userId);
    },

    async listUserProjects(userId, queryParams = {}) {
        const limit = parseInt(queryParams.limit, 10) || 20;
        const offset = parseInt(queryParams.offset, 10) || 0;

        return await projectsRepository.findAllByOwner(userId, limit, offset);
    },

    async updateProject(projectId, userId, data) {
        const updateSchema = projectSchema.partial();
        const validated = updateSchema.parse(data);

        const updates = [];
        const values = [];
        let paramIndex = 1;

        Object.keys(validated).forEach(key => {
            updates.push(`${key} = $${paramIndex++}`);
            values.push(validated[key]);
        });

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
