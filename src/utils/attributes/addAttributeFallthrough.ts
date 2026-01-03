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
 * @param variableName - The variable name to use (default: 'attributes')
 *                       Use '$attrs' for Phase 3 components, 'attributes' for Phase 2
 * @returns The modified Tag node (mutates in place)
 *
 * @example
 * ```typescript
 * // Before: <div class="card"></div>
 * addAttributeFallthrough(rootElement)
 * // After: <div class="card" &attributes(attributes)></div>
 * ```
 *
 * @example
 * ```typescript
 * // Phase 3: use '$attrs'
 * addAttributeFallthrough(rootElement, '$attrs')
 * // After: <div class="card" &attributes($attrs)></div>
 * ```
 */
export function addAttributeFallthrough(
  rootElement: Tag,
  variableName: string = 'attributes',
): Tag {
  if (!hasAttributeBlocks(rootElement)) {
    // Initialize attributeBlocks if it doesn't exist
    if (!rootElement.attributeBlocks) {
      rootElement.attributeBlocks = []
    }

    // Add &attributes(variableName)
    rootElement.attributeBlocks.push(createAttributeBlock(variableName))
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
 * Creates an AttributeBlock node for &attributes(variableName).
 *
 * @param variableName - The variable name to use (default: 'attributes')
 * @returns An AttributeBlock AST node
 */
function createAttributeBlock(
  variableName: string = 'attributes',
): AttributeBlock {
  return {
    type: 'AttributeBlock',
    val: variableName,
    line: 0,
    column: 0,
    filename: '',
  }
}
