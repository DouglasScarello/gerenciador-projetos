const tasksRepository = require('../repositories/tasksRepository');
const projectsRepository = require('../repositories/projectsRepository');
const AppError = require('../utils/AppError');
const { z } = require('zod');

const taskSchema = z.object({
    description: z.string().min(1, 'Descrição é obrigatória').trim(),
    status: z.enum(['todo', 'done']).default('todo'),
});

const tasksService = {
    async createTask(projectId, data, userId) {
        const validated = taskSchema.parse(data);

        // Validar se o projeto pertence ao usuário
        const project = await projectsRepository.findByIdAndOwner(projectId, userId);
        if (!project) {
            throw new AppError('Projeto não encontrado ou acesso negado', 404);
        }

        return await tasksRepository.create(validated.description, validated.status, projectId);
    },

    async listTasks(projectId, userId) {
        const project = await projectsRepository.findByIdAndOwner(projectId, userId);
        if (!project) {
            throw new AppError('Projeto não encontrado', 404);
        }

        return await tasksRepository.findByProject(projectId);
    },

    async updateTask(taskId, data, userId) {
        const updateSchema = taskSchema.partial();
        const validated = updateSchema.parse(data);

        const updated = await tasksRepository.update(taskId, validated.description, validated.status, userId);
        if (!updated) {
            throw new AppError('Tarefa não encontrada', 404);
        }
        return updated;
    },

    async deleteTask(taskId, userId) {
        const success = await tasksRepository.delete(taskId, userId);
        if (!success) {
            throw new AppError('Tarefa não encontrada', 404);
        }
        return true;
    }
};

module.exports = tasksService;
