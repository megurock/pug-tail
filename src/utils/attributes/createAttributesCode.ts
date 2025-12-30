/**
 * Creates a Code node for the attributes object.
 *
 * @module utils/attributes/createAttributesCode
 */

import type { Code } from '@/types/pug'

/**
 * Creates a Code node that declares the attributes object.
 *
 * Generates: `var attributes = {key1: val1, key2: val2, ...}`
 *
 * Note: We use `var` instead of `const` to avoid scope issues in nested
 * components when Pug generates code with `with` statements.
 *
 * This Code node will be inserted at the beginning of the component body,
 * making the attributes object available to the component's internal code.
 *
 * @param attributes - Map of attribute names to JavaScript expression strings
 * @returns A Code AST node
 *
 * @example
 * ```typescript
 * // Input: Map { 'title' => '"Hello"', 'count' => '5', 'data-test' => '"value"' }
 * const codeNode = createAttributesCode(attributes)
 * // codeNode.val: 'var attributes = {title: "Hello", count: 5, "data-test": "value"}'
 * ```
 *
 * @example
 * ```typescript
 * // Empty attributes
 * const codeNode = createAttributesCode(new Map())
 * // codeNode.val: 'var attributes = {}'
 * ```
 */
export function createAttributesCode(attributes: Map<string, string>): Code {
  // Build the object expression
  const objectEntries = Array.from(attributes.entries())
    .map(([key, val]) => {
      // If the key is not a valid JavaScript identifier (e.g., contains a hyphen), wrap it in quotes.
      const needsQuotes = !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
      const quotedKey = needsQuotes ? `"${key}"` : key
      return `${quotedKey}: ${val}`
    })
    .join(', ')

  const objectExpr = objectEntries.length > 0 ? `{${objectEntries}}` : '{}'

  return {
    type: 'Code',
    val: `var attributes = ${objectExpr}`,
    buffer: false,
    mustEscape: false,
    isInline: false,
    line: 0,
    column: 0,
    filename: '',
  }
}
