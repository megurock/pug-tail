/**
 * Frontmatter parser for Pug files.
 *
 * @deprecated This module is deprecated and will be removed in a future version.
 * Use $dataFiles or inline Pug constants instead of YAML frontmatter.
 *
 * Parses YAML frontmatter from Pug files and extracts both the data and the cleaned content.
 *
 * @module cli/frontmatterParser
 */

import YAML from 'yaml'

/**
 * Result of parsing frontmatter from a file.
 */
export interface FrontmatterResult {
  /** Parsed frontmatter data (empty object if no frontmatter). */
  data: Record<string, unknown>
  /** File content with frontmatter removed. */
  content: string
  /** Whether frontmatter was found. */
  hasFrontmatter: boolean
  /** Data files to load (from @dataFiles directive). */
  dataFiles: string[]
}

/**
 * Parses YAML frontmatter from a string.
 *
 * Frontmatter format:
 * ```
 * ---
 * title: My Page
 * year: 2025
 * ---
 * doctype html
 * html
 *   ...
 * ```
 *
 * @param source - File content (may or may not have frontmatter)
 * @returns Parsed result with data and cleaned content
 *
 * @example
 * ```typescript
 * const result = parseFrontmatter(`---
 * title: Hello
 * ---
 * h1= title
 * `)
 * // result.data = { title: "Hello" }
 * // result.content = "h1= title\n"
 * // result.hasFrontmatter = true
 * ```
 */
export function parseFrontmatter(source: string): FrontmatterResult {
  // Check if file starts with frontmatter delimiter
  if (!source.startsWith('---')) {
    return {
      data: {},
      content: source,
      hasFrontmatter: false,
      dataFiles: [],
    }
  }

  // Find the closing delimiter
  const lines = source.split('\n')
  let endIndex = -1

  // Start from line 1 (skip the opening ---)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (line && line.trim() === '---') {
      endIndex = i
      break
    }
  }

  // No closing delimiter found
  if (endIndex === -1) {
    return {
      data: {},
      content: source,
      hasFrontmatter: false,
      dataFiles: [],
    }
  }

  // Extract frontmatter content (between the delimiters)
  const frontmatterLines = lines.slice(1, endIndex)
  const frontmatterContent = frontmatterLines.join('\n')

  // Extract remaining content (after the closing delimiter)
  const contentLines = lines.slice(endIndex + 1)
  const content = contentLines.join('\n')

  // Parse YAML
  let data: Record<string, unknown> = {}
  let dataFiles: string[] = []

  try {
    const parsed = YAML.parse(frontmatterContent)
    // Ensure we have an object
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const parsedObj = parsed as Record<string, unknown>

      // Extract @dataFiles directive
      if ('@dataFiles' in parsedObj) {
        const dataFilesValue = parsedObj['@dataFiles']
        if (Array.isArray(dataFilesValue)) {
          dataFiles = dataFilesValue.filter(
            (item): item is string => typeof item === 'string',
          )
        }
        // Remove @dataFiles from data (it's a directive, not data)
        delete parsedObj['@dataFiles']
      }

      data = parsedObj
    }
  } catch (error) {
    throw new Error(
      `Failed to parse frontmatter YAML: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }

  return {
    data,
    content,
    hasFrontmatter: true,
    dataFiles,
  }
}
