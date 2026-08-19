import type { Logger } from "pino";
import pino from "pino";

export const logger: Logger = pino();

/**
 * Configure the global logging level (e.g., 'info', 'warn', 'error', 'debug').
 *
 * **Note:** this sets a process-wide log level shared across all `Client`
 * instances — the most recently constructed client's `logLevel` applies
 * to every client in the same process.
 *
 * @param level - Log level string.
 */
export const setLogLevel = (level: string) => {
  logger.level = level;
};
