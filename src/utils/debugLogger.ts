/**
 * Debug Logger for Flowise Chat Embed
 * 
 * Provides conditional debug logging that can be controlled via:
 * 1. Configuration file (debug attribute)
 * 2. Browser console commands (window.FlowiseDebug)
 * 
 * Default state: DEBUG OFF
 */

class DebugLogger {
  private enabled = false; // Default: OFF
  private prefix = '🔍 CLIENT DEBUG:';

  /**
   * Set debug state from configuration
   * @param enabled - Whether debug logging should be enabled
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) {
      console.log('🔧 Flowise Chat Embed debug logging enabled via configuration');
    }
  }

  /**
   * Enable debug logging via console command
   */
  enable(): void {
    this.enabled = true;
    console.log('🟢 Flowise Chat Embed debug logging enabled via console');
  }

  /**
   * Disable debug logging via console command
   */
  disable(): void {
    this.enabled = false;
    console.log('🔴 Flowise Chat Embed debug logging disabled via console');
  }

  /**
   * Check if debug logging is currently enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Log debug information (only when enabled)
   */
  log(...args: any[]): void {
    if (this.enabled) {
      console.log(this.prefix, ...args);
    }
  }

  /**
   * Log debug warnings (only when enabled)
   */
  warn(...args: any[]): void {
    if (this.enabled) {
      console.warn(this.prefix, ...args);
    }
  }

  /**
   * Log debug errors (always shown regardless of debug state)
   */
  error(...args: any[]): void {
    console.error(this.prefix, ...args);
  }

  /**
   * Log debug info (only when enabled)
   */
  info(...args: any[]): void {
    if (this.enabled) {
      console.info(this.prefix, ...args);
    }
  }
}

// Create singleton instance
export const debugLogger = new DebugLogger();

// Export for type definitions
export type { DebugLogger };