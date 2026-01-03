/**
 * File pattern matcher
 */

import { relative } from 'node:path'
import { minimatch } from 'minimatch'

/**
 * Check if a file should be output based on patterns
 *
 * Supports negation patterns (starting with !)
 * Later patterns override earlier ones
 *
 * @param filePath - Absolute file path to check
 * @param patterns - Array of glob patterns (supports ! for negation)
 * @param basePath - Base path for relative matching
 * @returns True if file should be compiled and output
 *
 * @example
 * ```ts
 * shouldIncludeFile('/project/src/index.pug', [
 *   '**\/*.pug',              // Output all .pug
 *   '!**\/components\/**',    // Exclude components
 *   'src/index.pug'         // But output index.pug
 * ], '/project')
 * // Returns: true
 * ```
 */
export function shouldIncludeFile(
  filePath: string,
  patterns: string[],
  basePath: string,
): boolean {
  // Get relative path for matching
  const relativePath = relative(basePath, filePath)

  // Default: include if no patterns
  let included = patterns.length === 0

  // Process patterns in order
  for (const pattern of patterns) {
    if (pattern.startsWith('!')) {
      // Negation pattern
      const negatedPattern = pattern.slice(1)
      if (minimatch(relativePath, negatedPattern, { dot: true })) {
        included = false
      }
    } else {
      // Inclusion pattern
      if (minimatch(relativePath, pattern, { dot: true })) {
        included = true
      }
    }
  }

  return included
}

/**
 * Get default output patterns
 * Used when no config file is present
 *
 * @returns Default patterns (excludes components and _ prefixed files)
 */
export function getDefaultOutputPatterns(): string[] {
  return [
    '**/*.pug', // All .pug files
    '!**/_*.pug', // Exclude files starting with _ (Pug standard)
    '!**/*.component.pug', // Exclude component files by naming convention
    '!**/components/**/*.pug', // Exclude components directory
  ]
}
