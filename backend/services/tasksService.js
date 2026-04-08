const tasksRepository = require('../repositories/tasksRepository');
const projectsRepository = require('../repositories/projectsRepository');
const AppError = require('../utils/AppError');
const { z } = require('zod');

const taskSchema = z.object({
    description: z.string().min(1, 'Descrição é obrigatória').trim(),
    status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
});

// DTO Mapper (Isolamento de Dados Sênior)
const mapToTaskDTO = (task) => ({
    id: task.id,
    description: task.description,
    status: task.status,
    projectId: task.project_id,
    createdAt: task.created_at
});

const tasksService = {
    async createTask(projectId, data, userId) {
        const validated = taskSchema.parse(data);

        // 🛡️ Domain Ownership: Validar antes de agir
        const project = await projectsRepository.findByIdAndOwner(projectId, userId);
        if (!project) {
            throw new AppError('Projeto não encontrado ou acesso negado', 404);
        }

        const task = await tasksRepository.create(validated.description, validated.status, projectId);
        return mapToTaskDTO(task);
    },

    async listTasks(projectId, userId) {
        // 🛡️ Domain Ownership: Validar antes de listar
        const project = await projectsRepository.findByIdAndOwner(projectId, userId);
        if (!project) {
            throw new AppError('Projeto não encontrado', 404);
        }

        const tasks = await tasksRepository.findByProject(projectId);
        return tasks.map(mapToTaskDTO);
    },

    async updateTask(taskId, data, userId) {
        const updateSchema = taskSchema.partial();
        const validated = updateSchema.parse(data);

        // O repository já faz o check via JOIN, mas no nível Sênior 
        // poderíamos buscar a tarefa primeiro para garantir a existência.
        // Vamos manter o JOIN mas retornar o DTO.
        const updated = await tasksRepository.update(taskId, validated.description, validated.status, userId);
        if (!updated) {
            throw new AppError('Tarefa não encontrada ou acesso negado', 404);
        }
        return mapToTaskDTO(updated);
    },

    async deleteTask(taskId, userId) {
        const success = await tasksRepository.delete(taskId, userId);
        if (!success) {
            throw new AppError('Tarefa não encontrada ou acesso negado', 404);
        }
        return true;
    },

    async listTasksByTaskId(taskId, userId) {
        // Busca simples para obter metadados (como projectId)
        // O repository de tarefas deve suportar findById
        const task = await tasksRepository.findById(taskId);
        if (!task) throw new AppError('Tarefa não encontrada', 404);
        return mapToTaskDTO(task);
    }
};

module.exports = tasksService;
