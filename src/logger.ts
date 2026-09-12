import pino from "pino";

export interface Logger {
  info(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
}

export const noopLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {}
};

export const logger: Logger = pino();
