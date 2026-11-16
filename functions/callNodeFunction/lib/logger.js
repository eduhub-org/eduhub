import winston from 'winston';
import { isProduction } from './config.js';

/**
 * Structured JSON logger shared by the dispatcher and every handler.
 *
 * Console only: Cloud Logging parses the JSON lines (jsonPayload.level), and
 * a file transport would just fill the instance's in-memory disk. The Slack
 * alert in infrastructure/application/10_monitoring.tf matches
 * `jsonPayload.level="error"`, so keep the JSON format.
 *
 * Handlers that receive the logger as their second argument should use that;
 * modules without one import it from here, never from ../index.js (that is
 * an import cycle with the dispatcher).
 */
export const logger = winston.createLogger({
  level: isProduction() ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});
