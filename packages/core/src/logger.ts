/**
 * Minimal logger with environment-aware verbosity.
 * - In production, only `.error` logs by default.
 * - Set DEBUG=1 to enable `.debug` and `.info` in production.
 */

type LogFields = Record<string, unknown> | undefined;

function isDebugEnabled(): boolean {
  return process.env.DEBUG === "1" || process.env.NODE_ENV === "development";
}

export const logger = {
  debug(message: string, fields?: LogFields) {
    if (isDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.log(message, fields ?? "");
    }
  },

  info(message: string, fields?: LogFields) {
    if (isDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.log(message, fields ?? "");
    }
  },

  warn(message: string, fields?: LogFields) {
    // eslint-disable-next-line no-console
    console.warn(message, fields ?? "");
  },

  error(message: string, fields?: LogFields) {
    // eslint-disable-next-line no-console
    console.error(message, fields ?? "");
  },
};
