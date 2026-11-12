const tasksRepository = require('../repositories/tasksRepository');
const projectsRepository = require('../repositories/projectsRepository');
const AppError = require('../utils/AppError');
const { z } = require('zod');

const taskSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório').trim().optional(),
    description: z.string().optional().nullable().transform(val => val?.trim() || null),
    status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
    priority: z.enum(['urgent', 'high', 'medium', 'low', 'none']).default('none'),
    label: z.string().optional().default('feature'),
    dueDate: z.string().optional().nullable(),
});

// DTO Mapper (Isolamento de Dados Sênior)
const mapToTaskDTO = (task) => ({
    id: task.id,
    title: task.title || task.description || 'Sem título',
    description: task.description,
    status: task.status,
    priority: task.priority || 'none',
    label: task.label || 'feature',
    dueDate: task.due_date ? task.due_date.toISOString().split('T')[0] : null,
    projectId: task.project_id,
    createdAt: task.created_at
});

const tasksService = {
    async createTask(projectId, data, userId) {
        // Se vier title mas não description, ou vice-versa, garantir consistência
        const title = data.title?.trim() || data.description?.trim() || 'Sem título';
        const description = data.description?.trim() || null;
        const status = data.status || 'todo';
        const priority = data.priority || 'none';
        const label = data.label || 'feature';
        const dueDate = data.dueDate || null;

        // 🛡️ Domain Ownership: Validar antes de agir
        const project = await projectsRepository.findByIdAndOwner(projectId, userId);
        if (!project) {
            throw new AppError('Projeto não encontrado ou acesso negado', 404);
        }

        const task = await tasksRepository.create(title, description, status, projectId, priority, label, dueDate);
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
        const title = data.title !== undefined ? data.title.trim() : null;
        const description = data.description !== undefined ? data.description : null;
        const status = data.status || null;
        const priority = data.priority || null;
        const label = data.label || null;
        const dueDate = data.dueDate !== undefined ? data.dueDate : null;

        const updated = await tasksRepository.update(taskId, title, description, status, priority, label, dueDate, userId);
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
