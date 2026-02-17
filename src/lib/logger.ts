/**
 * Logger Utility
 * ==============
 * Centralized logging with levels and environment-based output
 * 
 * Log Levels:
 * - debug: Detailed debugging information (dev only)
 * - info: General informational messages
 * - warn: Warning messages (potential issues)
 * - error: Error messages (actual problems)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Format log message with context
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Debug level - detailed debugging info (dev only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  /**
   * Info level - general informational messages
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment || this.isProduction) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  /**
   * Warn level - warning messages
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  /**
   * Error level - error messages
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error(this.formatMessage('error', message, {
      ...context,
      error: errorMessage,
      stack: errorStack,
    }));
  }

  /**
   * Log API request (structured logging)
   */
  apiRequest(method: string, path: string, statusCode: number, duration?: number, context?: LogContext): void {
    const logContext = {
      ...context,
      method,
      path,
      statusCode,
      duration: duration ? `${duration}ms` : undefined,
    };

    if (statusCode >= 500) {
      this.error(`API ${method} ${path}`, undefined, logContext);
    } else if (statusCode >= 400) {
      this.warn(`API ${method} ${path}`, logContext);
    } else {
      this.info(`API ${method} ${path}`, logContext);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for convenience
export type { LogLevel, LogContext };
