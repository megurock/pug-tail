/**
 * pug-tail configuration file types
 */

/**
 * Configuration for pug-tail CLI
 */
export interface PugTailConfig {
  /** File-related settings */
  files?: {
    /** Input files/directories/patterns */
    input?: string | string[]

    /** Output directory (for multiple files) or file path (for single file) */
    output?: string

    /**
     * Root path for maintaining directory structure in output
     * If specified, files will be output relative to this path instead of the input pattern base
     *
     * @example
     * ```js
     * // Without root: examples/pages/index.pug → compiled/pages/index.html
     * // With root: examples/pages/index.pug → compiled/index.html (pages is treated as root)
     * root: 'examples/pages'
     * ```
     */
    root?: string

    /**
     * Entry patterns - determines which .pug files should be compiled to .html
     * Supports glob patterns with negation (!)
     *
     * Files matching these patterns will be compiled and output.
     * Files not matching (or matching negation patterns) will be ignored.
     *
     * @default ['**\/*.pug', '!**\/_*.pug', '!**\/*.component.pug', '!**\/components\/**\/*.pug']
     *
     * @example
     * ```js
     * entry: [
     *   '**\/*.pug',                    // All .pug files
     *   '!**\/_*.pug',                  // Exclude files starting with _ (Pug standard)
     *   '!**\/*.component.pug',         // Exclude component files by naming convention
     *   '!**\/components\/**\/*.pug',     // Exclude components directory
     * ]
     * ```
     */
    entry?: string[]
  }

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

  /** Key name for injected data (default: 'global') */
  dataKey?: string

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

  /** Validation and code quality settings */
  validation?: {
    /** How to handle external variable references. Default: 'error' (strict mode). */
    scopeIsolation?: 'error' | 'warn' | 'off'
    /** Additional global variables to allow (beyond standard JavaScript globals). */
    allowedGlobals?: string[]
  }
}
