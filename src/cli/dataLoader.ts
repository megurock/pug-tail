/**
 * Data loader for CLI option injection.
 *
 * @module cli/dataLoader
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Loads data from a string or file.
 *
 * Supports:
 * - JSON strings: '{"title": "Hello"}'
 * - JSON files: data.json
 *
 * @param input - JSON string or file path
 * @param basedir - Optional base directory for resolving file paths
 * @returns Parsed data object
 * @throws {Error} If the input cannot be parsed or loaded
 *
 * @example
 * ```typescript
 * // JSON string
 * const data = loadData('{"title": "Hello", "year": 2025}')
 * // → { title: "Hello", year: 2025 }
 *
 * // JSON file (from process.cwd())
 * const data = loadData('data.json')
 * // → contents of data.json
 *
 * // JSON file (from basedir)
 * const data = loadData('data.json', '/project/src')
 * // → contents of /project/src/data.json
 * ```
 */
export function loadData(
  input: string,
  basedir?: string,
): Record<string, unknown> {
  // Try to load as a file first
  // If basedir is provided, resolve from basedir; otherwise from process.cwd()
  const basePath = basedir || process.cwd()
  const filePath = resolve(basePath, input)

  try {
    // Check if it's a file path
    const fileContent = readFileSync(filePath, 'utf-8')

    // Parse as JSON
    try {
      return JSON.parse(fileContent)
    } catch (error) {
      throw new Error(
        `Failed to parse file "${input}" as JSON: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  } catch (fileError) {
    // If file reading failed, try to parse as JSON string
    try {
      return JSON.parse(input)
    } catch (parseError) {
      throw new Error(
        `Failed to load data from "${input}". ` +
          `It must be either a valid JSON file path or a JSON string. ` +
          `File error: ${fileError instanceof Error ? fileError.message : String(fileError)}. ` +
          `Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
      )
    }
  }
}

/**
 * Merges multiple data objects.
 *
 * Later objects override earlier ones.
 *
 * @param sources - Data objects to merge
 * @returns Merged data object
 *
 * @example
 * ```typescript
 * const merged = mergeData(
 *   { title: "Default", year: 2025 },
 *   { title: "Override" }
 * )
 * // → { title: "Override", year: 2025 }
 * ```
 */
export function mergeData(
  ...sources: Array<Record<string, unknown> | undefined>
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const source of sources) {
    if (source) {
      Object.assign(result, source)
    }
  }

  return result
}

/**
 * Data loader class for loading JSON files
 */
class DataLoader {
  /**
   * Load data from JSON files
   *
   * @param filePaths - Array of file paths to load
   * @param basePath - Base directory for resolving relative paths
   * @returns Merged data from all files
   */
  loadDataFiles(
    filePaths: string[],
    basePath?: string,
  ): Record<string, unknown> {
    const mergedData: Record<string, unknown> = {}

    for (const filePath of filePaths) {
      try {
        const data = loadData(filePath, basePath)
        Object.assign(mergedData, data)
      } catch (error) {
        console.warn(
          `Warning: Failed to load data file "${filePath}": ${
            error instanceof Error ? error.message : String(error)
          }`,
        )
      }
    }

    return mergedData
  }
}

export const dataLoader = new DataLoader()
