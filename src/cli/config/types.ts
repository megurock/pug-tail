/**
 * pug-tail configuration file types
 */

/**
 * Configuration for pug-tail CLI
 */
export interface PugTailConfig {
  /** Input files/directories/patterns */
  input?: string | string[]

  /** Output directory */
  output?: string

  /** Output file extension (default: .html) */
  extension?: string

  /** Base directory for absolute includes */
  basedir?: string

  /** Doctype to use */
  doctype?: string

  /** Pretty print HTML output */
  pretty?: boolean

  /** Output format */
  format?: 'html' | 'ast' | 'pug-code'

  /** Data to inject (JSON string or file path) */
  data?: string | Record<string, unknown>

  /** File matching patterns */
  files?: {
    /**
     * Include patterns
     * Supports glob patterns with negation (!)
     *
     * @example
     * ```js
     * includes: [
     *   '**\/*.pug',                 // All .pug files
     *   '!**\/components\/**\/*.pug',   // Exclude components directory
     *   '!**\/_*.pug',                // Exclude files starting with _
     * ]
     * ```
     */
    includes?: string[]
  }

  /** Watch mode options */
  watch?: {
    /** Enable watch mode */
    enabled?: boolean
    /** Debounce delay in milliseconds */
    debounce?: number
  }

  /** Silent mode (no log output) */
  silent?: boolean

  /** Enable debug output */
  debug?: boolean
}
