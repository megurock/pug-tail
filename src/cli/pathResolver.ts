/**
 * Path resolution utilities for CLI file processing.
 *
 * @module cli/pathResolver
 */

import { basename, dirname, extname, join, relative, resolve } from 'node:path'

/**
 * Options for path resolution.
 */
export interface PathResolverOptions {
  /** Output directory */
  outputDir?: string
  /** Output file extension (default: .html) */
  extension?: string
  /** Root path for maintaining directory structure */
  rootPath?: string
}

/**
 * Resolves the output path for an input file.
 *
 * @param inputPath - The input file path (absolute)
 * @param options - Path resolver options
 * @returns The output file path (absolute)
 *
 * @example
 * ```typescript
 * // Single file, no output dir
 * resolveOutputPath('/project/src/index.pug', {})
 * // → '/project/src/index.html'
 *
 * // Single file, with output dir
 * resolveOutputPath('/project/src/index.pug', { outputDir: '/project/dist' })
 * // → '/project/dist/index.html'
 *
 * // Multiple files, maintain structure
 * resolveOutputPath('/project/src/pages/about.pug', {
 *   outputDir: '/project/dist',
 *   rootPath: '/project/src'
 * })
 * // → '/project/dist/pages/about.html'
 * ```
 */
export function resolveOutputPath(
  inputPath: string,
  options: PathResolverOptions = {},
): string {
  const { outputDir, extension = '.html', rootPath } = options

  // Replace extension
  const ext = extname(inputPath)
  const isPug = /\.(?:pug|jade)$/.test(ext)
  const outputPath = isPug
    ? inputPath.replace(/\.(?:pug|jade)$/, extension)
    : inputPath

  // If no output directory, return the path with replaced extension
  if (!outputDir) {
    return outputPath
  }

  // Resolve outputDir to absolute path
  const absoluteOutputDir = resolve(outputDir)

  // If rootPath is provided, maintain directory structure
  if (rootPath) {
    const relativePath = relative(rootPath, outputPath)
    return resolve(absoluteOutputDir, relativePath)
  }

  // Otherwise, just use the basename
  return resolve(absoluteOutputDir, basename(outputPath))
}

/**
 * Checks if a file should be ignored based on its path.
 *
 * A file is ignored if:
 * - The filename starts with `_` (e.g., `_layout.pug`)
 * - Any directory in the path starts with `_` (e.g., `_components/Card.pug`)
 *
 * This matches pug-cli's behavior.
 *
 * @param filepath - The file path to check (can be relative or absolute)
 * @returns True if the file should be ignored
 *
 * @example
 * ```typescript
 * shouldIgnoreFile('src/index.pug')           // → false
 * shouldIgnoreFile('src/_layout.pug')         // → true
 * shouldIgnoreFile('src/_components/Card.pug') // → true
 * shouldIgnoreFile('src/my_component.pug')    // → false (snake_case is OK)
 * shouldIgnoreFile('src/user_profile.pug')    // → false
 * ```
 */
export function shouldIgnoreFile(filepath: string): boolean {
  // Matches pug-cli's regex: /([\/\\]_)|(^_)/
  // - ([\/\\]_) - path contains /_ or \_
  // - (^_) - path starts with _
  const isIgnored = /([/\\]_)|(^_)/
  return isIgnored.test(filepath)
}

/**
 * Checks if a path is a Pug file.
 *
 * @param filepath - The file path to check
 * @returns True if the file is a Pug file (.pug or .jade)
 */
export function isPugFile(filepath: string): boolean {
  return /\.(?:pug|jade)$/.test(filepath)
}

/**
 * Gets the directory of a file path.
 *
 * @param filepath - The file path
 * @returns The directory path
 */
export function getDirectory(filepath: string): string {
  return dirname(filepath)
}

/**
 * Joins path segments.
 *
 * @param segments - Path segments to join
 * @returns The joined path
 */
export function joinPath(...segments: string[]): string {
  return join(...segments)
}

/**
 * Resolves a path to an absolute path.
 *
 * @param filepath - The path to resolve
 * @returns The absolute path
 */
export function resolveAbsolutePath(filepath: string): string {
  return resolve(filepath)
}
