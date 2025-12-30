/**
 * AST manipulation helper functions.
 *
 * A collection of utility functions for manipulating the Pug AST.
 */

import type { NodeLocation } from '@/types'
import type { Attribute, Block, Node, Tag, Text } from '@/types/pug'

/**
 * Checks if a node is of type Tag.
 *
 * @param node - The node to check.
 * @returns True if the node is of type Tag.
 *
 * @example
 * ```typescript
 * if (isTagNode(node)) {
 *   console.log(node.name) // TypeScript recognizes it as a Tag type
 * }
 * ```
 */
export function isTagNode(node: Node): node is Tag {
  return node.type === 'Tag'
}

/**
 * Checks if a node is of type Block.
 *
 * @param node - The node to check.
 * @returns True if the node is of type Block.
 */
export function isBlockNode(node: Node): node is Block {
  return node.type === 'Block'
}

/**
 * Checks if a node is of type Text.
 *
 * @param node - The node to check.
 * @returns True if the node is of type Text.
 */
export function isTextNode(node: Node): node is Text {
  return node.type === 'Text'
}

/**
 * Checks if a Tag node has a specific name.
 *
 * @param node - The node to check.
 * @param name - The tag name.
 * @returns True if it has the specified tag name.
 *
 * @example
 * ```typescript
 * if (isTagWithName(node, 'slot')) {
 *   // Process the slot tag
 * }
 * ```
 */
export function isTagWithName(node: Node, name: string): node is Tag {
  return isTagNode(node) && node.name === name
}

/**
 * Checks if a Tag node starts with a capital letter (used to detect component calls).
 *
 * @param node - The node to check.
 * @returns True if the Tag starts with a capital letter.
 *
 * @example
 * ```typescript
 * if (isCapitalizedTag(node)) {
 *   // Process a component call like Card()
 * }
 * ```
 */
export function isCapitalizedTag(node: Node): node is Tag {
  return isTagNode(node) && /^[A-Z]/.test(node.name)
}

/**
 * Gets a value from an attribute.
 *
 * @param attrs - The array of attributes.
 * @param name - The attribute name.
 * @returns The attribute value, or undefined if not found.
 *
 * @example
 * ```typescript
 * const className = getAttributeValue(node.attrs, 'class')
 * console.log(className) // "'card'"
 * ```
 */
export function getAttributeValue(
  attrs: Attribute[] | undefined,
  name: string,
): string | boolean | undefined {
  if (!attrs) return undefined
  const attr = attrs.find((a) => a.name === name)
  return attr?.val
}

/**
 * Gets a list of attribute names.
 *
 * @param attrs - The array of attributes.
 * @returns An array of attribute names.
 *
 * @example
 * ```typescript
 * const names = getAttributeNames(node.attrs)
 * console.log(names) // ['class', 'id', 'data-value']
 * ```
 */
export function getAttributeNames(attrs: Attribute[] | undefined): string[] {
  if (!attrs) return []
  return attrs.map((a) => a.name)
}

/**
 * Gets an array of child nodes from a Block.
 *
 * @param block - The Block node or undefined.
 * @returns An array of child nodes, or an empty array if the block is undefined.
 *
 * @example
 * ```typescript
 * const children = getChildNodes(tagNode.block)
 * for (const child of children) {
 *   // Process child nodes
 * }
 * ```
 */
export function getChildNodes(block: Block | undefined): Node[] {
  return block?.nodes ?? []
}

/**
 * Gets the location information of a node as a NodeLocation object.
 *
 * @param node - The target node.
 * @returns A location information object.
 *
 * @example
 * ```typescript
 * const location = getNodeLocationObject(node)
 * console.log(location) // { line: 10, column: 5, filename: "example.pug" }
 * ```
 */
export function getNodeLocationObject(node: Node): NodeLocation {
  return {
    line: 'line' in node ? (node.line ?? 0) : 0,
    column: 'column' in node ? node.column : undefined,
    filename: 'filename' in node ? node.filename : undefined,
  }
}

/**
 * Gets the location information of a node as a string.
 *
 * @param node - The target node.
 * @returns A string representing the location (e.g., "example.pug:10:5").
 *
 * @example
 * ```typescript
 * const location = getNodeLocation(node)
 * console.log(`Error at ${location}`)
 * // => "Error at example.pug:10:5"
 * ```
 */
export function getNodeLocation(node: Node): string {
  const filename = 'filename' in node ? node.filename : undefined
  const line = 'line' in node ? node.line : undefined
  const column = 'column' in node ? node.column : undefined

  const parts: string[] = []
  if (filename) parts.push(filename)
  if (line !== undefined) parts.push(String(line))
  if (column !== undefined) parts.push(String(column))

  return parts.length > 0 ? parts.join(':') : 'unknown'
}

/**
 * Gets the content of the first Text node from a Tag node.
 *
 * @param node - The Tag node.
 * @returns The content of the Text node, or undefined if not found.
 *
 * @example
 * ```typescript
 * // For <p>Hello World</p>
 * const text = getFirstTextContent(pNode)
 * console.log(text) // "Hello World"
 * ```
 */
export function getFirstTextContent(node: Tag): string | undefined {
  if (!node.block) return undefined

  for (const child of node.block.nodes) {
    if (isTextNode(child)) {
      return child.val
    }
  }

  return undefined
}

/**
 * Filters nodes of a specific type within a Block.
 *
 * @param block - The Block node.
 * @param predicate - The filtering condition.
 * @returns An array of nodes that match the condition.
 *
 * @example
 * ```typescript
 * // Extract only slot tags
 * const slots = filterNodes(block, node => isTagWithName(node, 'slot'))
 * ```
 */
export function filterNodes(
  block: Block,
  predicate: (node: Node) => boolean,
): Node[] {
  return block.nodes.filter(predicate)
}

/**
 * Finds a node of a specific type within a Block.
 *
 * @param block - The Block node.
 * @param predicate - The search condition.
 * @returns The first node found, or undefined if not found.
 *
 * @example
 * ```typescript
 * // Find the first slot tag
 * const firstSlot = findNode(block, node => isTagWithName(node, 'slot'))
 * ```
 */
export function findNode(
  block: Block,
  predicate: (node: Node) => boolean,
): Node | undefined {
  return block.nodes.find(predicate)
}
