const AppError = require('../utils/AppError');

describe('AppError', () => {
    test('deve criar um erro com mensagem e status code corretos', () => {
        const error = new AppError('Erro de teste', 400);

        expect(error.message).toBe('Erro de teste');
        expect(error.status).toBe(400);
        expect(error.isOperational).toBe(true);
    });

    test('deve ter status 500 por padrão', () => {
        const error = new AppError('Erro padrão');
        expect(error.status).toBe(500);
    });
});
