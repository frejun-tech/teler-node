import type {Logger} from 'pino';
import pino from 'pino';

export const logger: Logger = pino();

/**
 * Configure the global logging level (e.g., 'info', 'warn', 'error', 'debug').
 * 
 * @param level - Log level string.
 */
export const setLogLevel = (level: string) => {
    logger.level = level;
};