import type {Logger} from 'pino';
import pino from 'pino';

export const logger: Logger = pino();

export const setLogLevel = (level: string) => {
    logger.level = level;
};