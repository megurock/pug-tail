/**
 * Finds root elements in a component body.
 *
 * @module utils/attributes/findRootElements
 */

import walk from 'pug-walk'
import type { Block, Node, Tag } from '@/types/pug'

/**
 * Finds all root HTML elements in a component body.
 *
 * A root element is a Tag node that is a direct child of the component body Block,
 * excluding:
 * - Code nodes (JavaScript code like `- const x = 1`)
 * - Text nodes (whitespace, comments)
 * - Comment nodes
 *
 * @param componentBody - The Block node representing the component body
 * @returns An array of Tag nodes that are root elements
 *
 * @example
 * ```pug
 * component Card()
 *   - const title = "Hello"
 *   .card
 *     h2= title
 * ```
 * Returns: [.card Tag node]
 *
 * @example
 * ```pug
 * component Layout()
 *   header Header
 *   main Content
 *   footer Footer
 * ```
 * Returns: [header Tag, main Tag, footer Tag] (3 root elements)
 */
export function findRootElements(componentBody: Block): Tag[] {
  const rootElements: Tag[] = []

  for (const node of componentBody.nodes) {
    if (isRootElement(node)) {
      rootElements.push(node as Tag)
    }
  }

  return rootElements
}

/**
 * Checks if a node is a root HTML element.
 *
 * A node is considered a root element if it is a Tag node.
 * Code nodes, Text nodes, and Comment nodes are not considered root elements.
 *
 * @param node - The AST node to check
 * @returns True if the node is a root element (Tag)
 */
function isRootElement(node: Node): boolean {
  return node.type === 'Tag'
}

/**
 * Finds the single root element in a component body.
 *
 * @param componentBody - The Block node representing the component body
 * @returns The single root Tag node, or undefined if there are 0 or multiple roots
 *
 * @example
 * ```pug
 * component Card()
 *   .card Content
 * ```
 * Returns: .card Tag node
 *
 * @example
 * ```pug
 * component Layout()
 *   header Header
 *   main Content
 * ```
 * Returns: undefined (multiple roots)
 */
export function findSingleRootElement(componentBody: Block): Tag | undefined {
  const roots = findRootElements(componentBody)
  return roots.length === 1 ? roots[0] : undefined
}

/**
 * Checks if a component body has a single root element.
 *
 * @param componentBody - The Block node representing the component body
 * @returns True if there is exactly one root element
 */
export function hasSingleRoot(componentBody: Block): boolean {
  return findRootElements(componentBody).length === 1
}

/**
 * Checks if a component body has multiple root elements.
 *
 * @param componentBody - The Block node representing the component body
 * @returns True if there are multiple root elements
 */
export function hasMultipleRoots(componentBody: Block): boolean {
  return findRootElements(componentBody).length > 1
}

/**
 * Checks if any element in the component body has explicit attribute blocks.
 *
 * This function recursively walks through the entire component AST to detect
 * if the developer has manually written `&attributes` anywhere.
 * If found, automatic attribute fallthrough should be disabled.
 *
 * @param componentBody - The Block node representing the component body
 * @returns True if any element has `&attributes` or `&attributes(...)`
 *
 * @example
 * ```pug
 * component Input()
 *   .wrapper
 *     input.field&attributes(attributes)
 * ```
 * Returns: true (developer has manually controlled attributes)
 *
 * @example
 * ```pug
 * component Card()
 *   .card
 *     h2 Title
 * ```
 * Returns: false (no manual attribute blocks, auto fallthrough can be applied)
 */
export function hasAnyAttributeBlocks(componentBody: Block): boolean {
  let found = false

  walk(componentBody, (node: Node) => {
    if (node.type === 'Tag') {
      const tag = node as Tag
      if (tag.attributeBlocks && tag.attributeBlocks.length > 0) {
        found = true
      }
    }
  })

  return found
}
