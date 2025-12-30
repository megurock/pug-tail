/**
 * Helper function for parsing Pug.
 *
 * A utility for converting Pug source code to an AST in tests.
 */

import lex from 'pug-lexer'
import parse from 'pug-parser'
import type { Node } from '@/types/pug'

/**
 * Converts Pug source code to an AST.
 *
 * @param source - The Pug source code.
 * @param filename - The filename (optional).
 * @returns The parsed AST.
 */
export function parsePug(source: string, filename?: string): Node {
  const tokens = lex(source, filename ? { filename } : undefined)
  return parse(
    tokens as unknown as Parameters<typeof parse>[0],
    filename ? { filename } : undefined,
  )
}
