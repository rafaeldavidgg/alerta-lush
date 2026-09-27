export type LogLevel = 'info' | 'warn' | 'error';

export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export interface LoggerOptions {
  /** Values that must never appear in output (tokens, URLs, etc.). */
  secrets?: string[];
  /** Destination for formatted lines. Defaults to the console. */
  sink?: (level: LogLevel, line: string) => void;
}

/** Replace every occurrence of each secret with `***`. */
export function redact(text: string, secrets: string[]): string {
  let output = text;
  for (const secret of secrets) {
    if (!secret || secret.length < 4) continue;
    output = output.split(secret).join('***');
  }
  return output;
}

function format(message: string, meta?: Record<string, unknown>): string {
  if (!meta) return message;
  try {
    return `${message} ${JSON.stringify(meta)}`;
  } catch {
    return message;
  }
}

/**
 * Minimal logger for GitHub Actions output. Every message and metadata value
 * is passed through {@link redact} so secrets can never leak into logs.
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const secrets = options.secrets ?? [];
  const sink =
    options.sink ??
    ((level: LogLevel, line: string) => {
      if (level === 'error') console.error(line);
      else if (level === 'warn') console.warn(line);
      else console.log(line);
    });

  const emit = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
    const line = format(message, meta);
    sink(level, redact(line, secrets));
  };

  return {
    info: (message, meta) => emit('info', message, meta),
    warn: (message, meta) => emit('warn', message, meta),
    error: (message, meta) => emit('error', message, meta),
  };
}
