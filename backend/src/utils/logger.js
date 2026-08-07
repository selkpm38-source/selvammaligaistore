/**
 * Application + audit logging via Winston.
 *
 * File logging is only used in local development. In production we log to
 * the console only: hosting platforms (Render, Vercel, etc.) capture
 * stdout/stderr automatically and show it in their dashboard's logs, and a
 * Winston File transport's write failure fires an unhandled 'error' event
 * that can crash the whole process on hosts with read-only or ephemeral
 * filesystems — so this avoids that risk entirely rather than depending on
 * a specific host's disk behavior.
 */
'use strict';

const winston = require('winston');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

const baseFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.simple()
);

function buildTransports(fileName, level) {
  if (isProduction) {
    return [new winston.transports.Console({ format: consoleFormat, level })];
  }

  return [
    new winston.transports.File({ filename: path.join(__dirname, '../../logs', fileName), level }),
    new winston.transports.Console({ format: consoleFormat }),
  ];
}

const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: baseFormat,
  transports: [
    ...buildTransports('error.log', 'error'),
    ...buildTransports('app.log', undefined),
  ],
});

// Winston transports emit an 'error' event on write failure instead of
// throwing — but an EventEmitter with no 'error' listener crashes the
// process on that event. This is a safety net regardless of environment.
logger.on('error', (err) => {
  console.error('Logger transport error (non-fatal, suppressed):', err.message);
});

const auditLogger = winston.createLogger({
  level: 'info',
  format: baseFormat,
  transports: buildTransports('audit.log', undefined),
});

auditLogger.on('error', (err) => {
  console.error('Audit logger transport error (non-fatal, suppressed):', err.message);
});

module.exports = logger;
module.exports.audit = (event) => auditLogger.info(event);
