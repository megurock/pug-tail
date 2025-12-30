/**
 * Helper function to load fixture files.
 *
 * A utility for loading fixture files (Pug files and expected HTML) in tests.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const fixturesDir = resolve(__dirname, '../fixtures')

/**
 * Loads a fixture file.
 *
 * @param category - The category of the fixture (e.g., simple, slots, nested, complex, edge-cases).
 * @param name - The name of the fixture (without extension).
 * @returns The content of the fixture (pug and html).
 */
export function loadFixture(category: string, name: string) {
  const pugPath = resolve(fixturesDir, category, `${name}.pug`)
  const htmlPath = resolve(fixturesDir, category, `${name}.html`)

  let pug: string
  let html: string | null = null

  try {
    pug = readFileSync(pugPath, 'utf-8')
  } catch (error) {
    throw new Error(
      `Failed to load fixture Pug file: ${pugPath}\n${error instanceof Error ? error.message : String(error)}`,
    )
  }

  try {
    html = readFileSync(htmlPath, 'utf-8')
  } catch (_error) {
    // If the HTML file does not exist, return null (optional).
    html = null
  }

  return { pug, html }
}
