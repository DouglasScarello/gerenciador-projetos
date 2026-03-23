const AppError = require('../utils/AppError');

const errorMiddleware = (err, req, res, next) => {
    err.status = err.status || 500;
    err.message = err.message || 'Erro interno do servidor';

    // Log de erros não operacionais (bugs reais)
    if (!err.isOperational) {
        console.error('💥 ERRO CRÍTICO:', err);
    }

    res.status(err.status).json({
        status: err.status,
        message: err.message,
        // Em desenvolvimento, podemos enviar o stack para o cliente (opcional)
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

module.exports = errorMiddleware;
