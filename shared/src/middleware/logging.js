/**
 * Winston Logger Configuration
 */

import winston from 'winston';

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Create a logger instance for a service
 * @param {string} serviceName - Name of the service
 * @returns {Object} Winston logger instance
 */
export const createLogger = (serviceName) => {
  const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

  const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  );

  const transports = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `[${timestamp}] [${service || serviceName}] ${level}: ${message} ${metaStr}`;
        })
      ),
    }),
  ];

  // File transport in production
  if (!isDevelopment) {
    transports.push(
      new winston.transports.File({
        filename: `logs/${serviceName}-error.log`,
        level: 'error',
        format,
      }),
      new winston.transports.File({
        filename: `logs/${serviceName}.log`,
        format,
      })
    );
  }

  return winston.createLogger({
    level: logLevel,
    format,
    defaultMeta: { service: serviceName },
    transports,
  });
};

/**
 * Log HTTP request/response middleware
 * @param {Object} logger - Winston logger instance
 * @returns {Function} Express middleware
 */
export const createHttpLogger = (logger) => {
  return (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('HTTP Request', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        requestId: req.id,
      });
    });

    next();
  };
};
