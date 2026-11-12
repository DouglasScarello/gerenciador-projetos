const tasksService = require('../services/tasksService');
const tasksRepository = require('../repositories/tasksRepository');
const projectsRepository = require('../repositories/projectsRepository');
const AppError = require('../utils/AppError');

jest.mock('../repositories/tasksRepository');
jest.mock('../repositories/projectsRepository');

describe('tasksService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('deve criar uma tarefa com title e description quando o projeto pertencer ao usuario', async () => {
        projectsRepository.findByIdAndOwner.mockResolvedValue({ id: 1, title: 'Projeto Alpha', owner_id: 10 });
        tasksRepository.create.mockResolvedValue({
            id: 101,
            title: 'Implementar Auth',
            description: 'Usar JWT em cookies',
            status: 'todo',
            project_id: 1,
            created_at: new Date().toISOString()
        });

        const result = await tasksService.createTask(
            1,
            { title: 'Implementar Auth', description: 'Usar JWT em cookies' },
            10
        );

        expect(projectsRepository.findByIdAndOwner).toHaveBeenCalledWith(1, 10);
        expect(tasksRepository.create).toHaveBeenCalledWith(
            'Implementar Auth',
            'Usar JWT em cookies',
            'todo',
            1
        );
        expect(result).toMatchObject({
            id: 101,
            title: 'Implementar Auth',
            description: 'Usar JWT em cookies',
            status: 'todo',
            projectId: 1
        });
    });

    test('deve lancar AppError 404 se o projeto nao pertencer ao usuario', async () => {
        projectsRepository.findByIdAndOwner.mockResolvedValue(null);

        await expect(
            tasksService.createTask(1, { title: 'Hack' }, 999)
        ).rejects.toThrow(AppError);

        expect(tasksRepository.create).not.toHaveBeenCalled();
    });

    test('deve atualizar o status de uma tarefa corretamente', async () => {
        tasksRepository.update.mockResolvedValue({
            id: 101,
            title: 'Implementar Auth',
            description: 'Concluido',
            status: 'done',
            project_id: 1,
            created_at: new Date().toISOString()
        });

        const result = await tasksService.updateTask(101, { status: 'done' }, 10);

        expect(tasksRepository.update).toHaveBeenCalledWith(101, null, null, 'done', 10);
        expect(result.status).toBe('done');
    });

    test('deve lancar erro ao tentar atualizar tarefa inexistente ou de outro usuario', async () => {
        tasksRepository.update.mockResolvedValue(null);

        await expect(
            tasksService.updateTask(999, { status: 'done' }, 10)
        ).rejects.toThrow(AppError);
    });
});
