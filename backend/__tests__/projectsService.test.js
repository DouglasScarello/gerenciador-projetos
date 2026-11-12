const projectsService = require('../services/projectsService');
const projectsRepository = require('../repositories/projectsRepository');
const tasksRepository = require('../repositories/tasksRepository');
const { getClient } = require('../db');
const AppError = require('../utils/AppError');

jest.mock('../repositories/projectsRepository');
jest.mock('../repositories/tasksRepository');
jest.mock('../db');

describe('projectsService', () => {
    let mockClient;

    beforeEach(() => {
        mockClient = {
            query: jest.fn().mockResolvedValue({}),
            release: jest.fn()
        };
        getClient.mockResolvedValue(mockClient);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('deve criar projeto e tarefa inicial em transacao atomica', async () => {
        projectsRepository.create.mockResolvedValue({
            id: 1,
            title: 'Novo SaaS',
            description: 'Descricao',
            status: 'todo',
            owner_id: 10,
            created_at: new Date().toISOString()
        });

        const result = await projectsService.createProject(
            { title: 'Novo SaaS', description: 'Descricao' },
            10
        );

        expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
        expect(projectsRepository.create).toHaveBeenCalledWith(
            'Novo SaaS',
            'Descricao',
            'todo',
            10,
            mockClient
        );
        expect(tasksRepository.create).toHaveBeenCalledWith(
            'Boas-vindas!',
            'Bem-vindo ao seu novo projeto! Comece editando esta tarefa.',
            'todo',
            1,
            mockClient
        );
        expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        expect(mockClient.release).toHaveBeenCalled();
        expect(result.id).toBe(1);
    });

    test('deve efetuar ROLLBACK em caso de erro na criacao atomica', async () => {
        projectsRepository.create.mockRejectedValue(new Error('Falha no banco'));

        await expect(
            projectsService.createProject({ title: 'Falha' }, 10)
        ).rejects.toThrow('Falha no banco');

        expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        expect(mockClient.release).toHaveBeenCalled();
    });

    test('deve listar projetos do usuario respeitando owner_id', async () => {
        projectsRepository.findAllByOwner.mockResolvedValue([
            { id: 1, title: 'Projeto 1', description: null, status: 'todo', created_at: new Date() }
        ]);

        const list = await projectsService.listUserProjects(10, { limit: 10, offset: 0 });

        expect(projectsRepository.findAllByOwner).toHaveBeenCalledWith(10, 10, 0);
        expect(list).toHaveLength(1);
        expect(list[0].title).toBe('Projeto 1');
    });
});
