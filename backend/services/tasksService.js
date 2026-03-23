const tasksRepository = require('../repositories/tasksRepository');
const projectsRepository = require('../repositories/projectsRepository');
const AppError = require('../utils/AppError');

const tasksService = {
    async createTask(projectId, data, userId) {
        const { description, status } = data;

        if (!description || typeof description !== 'string' || description.trim().length === 0) {
            throw new AppError('Descrição da tarefa é obrigatória', 400);
        }

        // Validar se o projeto pertence ao usuário
        const project = await projectsRepository.findByIdAndOwner(projectId, userId);
        if (!project) {
            throw new AppError('Projeto não encontrado ou acesso negado', 404);
        }

        return await tasksRepository.create(description.trim(), status, projectId);
    },

    async listTasks(projectId, userId) {
        const project = await projectsRepository.findByIdAndOwner(projectId, userId);
        if (!project) {
            throw new AppError('Projeto não encontrado', 404);
        }

        return await tasksRepository.findByProject(projectId);
    },

    async updateTask(taskId, data, userId) {
        const { description, status } = data;

        if (description !== undefined && (typeof description !== 'string' || description.trim().length === 0)) {
            throw new AppError('Descrição não pode ser vazia', 400);
        }

        const updated = await tasksRepository.update(taskId, description?.trim(), status, userId);
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
