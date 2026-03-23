const projectsRepository = require('../repositories/projectsRepository');
const tasksRepository = require('../repositories/tasksRepository');
const AppError = require('../utils/AppError');
const { getClient } = require('../db');
const { z } = require('zod');

const projectSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório').trim(),
    description: z.string().optional().nullable().transform(val => val?.trim() || null),
    status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
});

const mapToProjectDTO = (p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.status,
    createdAt: p.created_at
});

const projectsService = {
    async createProject(data, userId) {
        const validated = projectSchema.parse(data);
        const client = await getClient();

        try {
            await client.query('BEGIN');

            // 1. Criar o projeto
            const project = await projectsRepository.create(
                validated.title,
                validated.description,
                validated.status,
                userId,
                client
            );

            // 2. Criar tarefa inicial automática (Atomicidade Sênior)
            await tasksRepository.create(
                'Bem-vindo ao seu novo projeto! Comece editando esta tarefa.',
                'todo',
                project.id,
                client
            );

            await client.query('COMMIT');
            return mapToProjectDTO(project);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    async listUserProjects(userId, queryParams = {}) {
        const limit = parseInt(queryParams.limit, 10) || 20;
        const offset = parseInt(queryParams.offset, 10) || 0;

        const projects = await projectsRepository.findAllByOwner(userId, limit, offset);
        return projects.map(mapToProjectDTO);
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
        return mapToProjectDTO(updated);
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
