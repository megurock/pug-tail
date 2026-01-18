/**
 * Extracts attributes from a component call node.
 *
 * @module utils/attributes/extractAttributes
 */

import type { Tag } from '@/types/pug'

/**
 * Checks if an attribute is using shorthand syntax.
 *
 * Shorthand syntax: Card(title) where attr.val === true
 * Explicit syntax: Card(title=true) where attr.val === 'true'
 *
 * @param attr - The attribute to check
 * @returns True if the attribute is using shorthand syntax
 */
function isShorthand(attr: { name: string; val: string | boolean }): boolean {
  // Shorthand: attr.val is boolean true
  // Not shorthand: attr.val is string 'true' or 'false'
  return attr.val === true
}

/**
 * Expands shorthand attribute to its full form.
 *
 * @param attr - The attribute to expand
 * @returns The expanded attribute value
 * @example
 * ```typescript
 * // Shorthand: Card(title) → 'title'
 * // Explicit: Card(title="Hello") → '"Hello"'
 * ```
 */
function expandShorthand(attr: {
  name: string
  val: string | boolean
}): string {
  if (isShorthand(attr)) {
    // Shorthand: title → title=title
    return attr.name
  }
  // Explicit: convert to string
  return typeof attr.val === 'boolean' ? String(attr.val) : attr.val
}

/**
 * Extracts attributes from a component call node.
 *
 * Converts Pug AST attrs array into a key-value map where:
 * - Keys are attribute names
 * - Values are JavaScript expression strings (attr.val)
 *
 * Supports shorthand syntax (Vue/Svelte-like):
 * - Card(title) → Card(title=title)
 * - Card(disabled) → Card(disabled=disabled)
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
 *
 * // Pug: Card(title, disabled) - shorthand syntax
 * const attrs = extractAttributes(callNode)
 * // Returns: Map {
 * //   'title' => 'title',
 * //   'disabled' => 'disabled'
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
    // or boolean true for shorthand syntax (e.g., Card(title))
    const val: string = expandShorthand(attr)
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
