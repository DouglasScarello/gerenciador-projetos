const tasksRepository = require('../repositories/tasksRepository');
const projectsRepository = require('../repositories/projectsRepository');

const tasksService = {
    async createTask(projectId, data, userId) {
        const { description, status } = data;

        // Validar se o projeto pertence ao usuário
        const project = await projectsRepository.findByIdAndOwner(projectId, userId);
        if (!project) {
            throw { status: 404, message: 'Projeto não encontrado' };
        }

        return await tasksRepository.create(description, status, projectId);
    },

    async listTasks(projectId, userId) {
        // Validar se o projeto pertence ao usuário
        const project = await projectsRepository.findByIdAndOwner(projectId, userId);
        if (!project) {
            throw { status: 404, message: 'Projeto não encontrado' };
        }

        return await tasksRepository.findByProject(projectId);
    },

    async updateTask(taskId, data, userId) {
        const { description, status } = data;
        const updated = await tasksRepository.update(taskId, description, status, userId);
        if (!updated) {
            throw { status: 404, message: 'Tarefa não encontrada' };
        }
        return updated;
    },

    async deleteTask(taskId, userId) {
        const success = await tasksRepository.delete(taskId, userId);
        if (!success) {
            throw { status: 404, message: 'Tarefa não encontrada' };
        }
        return true;
    }
};

module.exports = tasksService;
