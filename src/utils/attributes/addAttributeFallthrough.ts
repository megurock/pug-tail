/**
 * Adds attribute fallthrough to root elements.
 *
 * @module utils/attributes/addAttributeFallthrough
 */

import type { AttributeBlock, Tag } from '@/types/pug'

/**
 * Adds &attributes to a Tag node if it doesn't already have it.
 *
 * This enables attribute fallthrough: any attributes not consumed by the component
 * will be passed to the root element.
 *
 * @param rootElement - The root Tag node
 * @returns The modified Tag node (mutates in place)
 *
 * @example
 * ```typescript
 * // Before: <div class="card"></div>
 * addAttributeFallthrough(rootElement)
 * // After: <div class="card" &attributes(attributes)></div>
 * ```
 */
export function addAttributeFallthrough(rootElement: Tag): Tag {
  if (!hasAttributeBlocks(rootElement)) {
    // Initialize attributeBlocks if it doesn't exist
    if (!rootElement.attributeBlocks) {
      rootElement.attributeBlocks = []
    }

    // Add &attributes(attributes)
    rootElement.attributeBlocks.push(createAttributeBlock())
  }

  return rootElement
}

/**
 * Checks if a Tag node already has attribute blocks.
 *
 * @param tag - The Tag node to check
 * @returns True if the tag has attribute blocks
 */
export function hasAttributeBlocks(tag: Tag): boolean {
  return Boolean(tag.attributeBlocks && tag.attributeBlocks.length > 0)
}

/**
 * Creates an AttributeBlock node for &attributes(attributes).
 *
 * @returns An AttributeBlock AST node
 */
function createAttributeBlock(): AttributeBlock {
  return {
    type: 'AttributeBlock',
    val: 'attributes',
    line: 0,
    column: 0,
    filename: '',
  }
}
