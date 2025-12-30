/**
 * Extracts attributes from a component call node.
 *
 * @module utils/attributes/extractAttributes
 */

import type { Tag } from '@/types/pug'

/**
 * Extracts attributes from a component call node.
 *
 * Converts Pug AST attrs array into a key-value map where:
 * - Keys are attribute names
 * - Values are JavaScript expression strings (attr.val)
 *
 * @param callNode - The component call node (Tag)
 * @returns A map of attribute names to their JavaScript expression values
 * @example
 * ```typescript
 * // Pug: Card(title="Hello", count=5, class=myVar)
 * const attrs = extractAttributes(callNode)
 * // Returns: Map {
 * //   'title' => '"Hello"',
 * //   'count' => '5',
 * //   'class' => 'myVar'
 * // }
 * ```
 */
export function extractAttributes(callNode: Tag): Map<string, string> {
  const attributes = new Map<string, string>()

  if (!callNode.attrs || callNode.attrs.length === 0) {
    return attributes
  }

  // callNode.attrs is of type Attribute[]
  for (const attr of callNode.attrs) {
    // attr.name is the attribute name (e.g., 'title')
    // attr.val is a JavaScript expression string (e.g., '"Hello"', '5', 'myVar')
    // or a boolean for boolean attributes
    const val: string =
      typeof attr.val === 'boolean' ? String(attr.val) : attr.val
    attributes.set(attr.name, val)
  }

  return attributes
}

/**
 * Checks if a component call has any attributes.
 *
 * @param callNode - The component call node (Tag)
 * @returns True if the node has attributes
 *
 * @example
 * ```typescript
 * if (hasAttributes(callNode)) {
 *   // Process attributes
 * }
 * ```
 */
export function hasAttributes(callNode: Tag): boolean {
  return Boolean(callNode.attrs && callNode.attrs.length > 0)
}
