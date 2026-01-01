/**
 * Frontmatter parser for Pug files.
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
  try {
    const parsed = YAML.parse(frontmatterContent)
    // Ensure we have an object
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      data = parsed as Record<string, unknown>
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
  }
}
