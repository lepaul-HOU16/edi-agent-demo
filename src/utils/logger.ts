/**
 * Conditional Logger Utility
 * 
 * Provides environment-based conditional logging to improve performance
 * while maintaining debugging capabilities in development.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

/**
 * Check if we're in development mode
 */
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Check if verbose debugging is enabled
 * Can be enabled in browser console: window.DEBUG_CATALOG = true
 */
const isDebugEnabled = () => {
  return isDevelopment && (window as any).DEBUG_CATALOG === true;
};

/**
 * Conditional logger that respects environment and debug flags
 */
export const logger: Logger = {
  /**
   * Debug logs - only shown when DEBUG_CATALOG flag is enabled in development
   * Use for: Panel switches, map updates, detailed tracing
   */
  debug: (message: string, ...args: any[]) => {
    if (isDebugEnabled()) {
      console.log(`🔍 [CATALOG-DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Info logs - shown in development mode
   * Use for: API responses, state changes, user actions
   */
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`ℹ️ [CATALOG] ${message}`, ...args);
    }
  },

  /**
   * Warning logs - shown in development mode
   * Use for: Non-critical issues, fallback scenarios
   */
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(`⚠️ [CATALOG] ${message}`, ...args);
    }
  },

  /**
   * Error logs - always shown (development and production)
   * Use for: API errors, critical failures, user-facing errors
   */
  error: (message: string, ...args: any[]) => {
    console.error(`❌ [CATALOG] ${message}`, ...args);
  }
};

/**
 * Helper function to enable debug logging in browser console
 * Usage: enableDebugLogging() or window.DEBUG_CATALOG = true
 */
export const enableDebugLogging = () => {
  (window as any).DEBUG_CATALOG = true;
  console.log('🔍 Catalog debug logging enabled. Use logger.debug() for verbose logs.');
};

/**
 * Helper function to disable debug logging
 */
export const disableDebugLogging = () => {
  (window as any).DEBUG_CATALOG = false;
  console.log('🔍 Catalog debug logging disabled.');
};

/**
 * Export default logger for convenience
 */
export default logger;
