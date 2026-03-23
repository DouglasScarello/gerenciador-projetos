const logger = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
    err.status = err.status || 500;
    err.message = err.message || 'Erro interno do servidor';

    if (err.status >= 500) {
        logger.error(`${err.status} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${err.stack}`);
    } else {
        logger.warn(`${err.status} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    }

    res.status(err.status).json({
        success: false,
        error: {
            message: err.message,
            code: err.code || 'INTERNAL_ERROR',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
};

module.exports = errorMiddleware;
