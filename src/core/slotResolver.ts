/**
 * SlotResolver
 *
 * A class for extracting and resolving slot content from the component call site.
 */

import type { Block, Node, Tag } from '@/types/pug'
import { getNodeLocationObject, isTagWithName } from '@/utils/astHelpers'
import { extractSlotName } from '@/utils/componentDetector'
import { deepCloneBlock, deepCloneNode } from '@/utils/deepClone'
import { ErrorHandler, type ErrorHandlerOptions } from './errorHandler'

/**
 * A class that resolves slot content from the component call site.
 *
 * Extracts the provided slot content from a component call node
 * like `Card()`.
 *
 * @example
 * ```typescript
 * const resolver = new SlotResolver()
 * const providedSlots = resolver.extractProvidedSlots(cardCallNode)
 * // Get the header slot content with providedSlots.get('header')
 * ```
 */
export class SlotResolver {
  private errorHandler: ErrorHandler

  constructor(options: ErrorHandlerOptions = {}) {
    this.errorHandler = new ErrorHandler(options)
  }

  /**
   * Extracts slots from the component call site.
   *
   * From a `Card()` call node, this extracts the content of child elements
   * like `slot(header)` and `slot(body)`.
   *
   * @param callNode - The component call node (e.g., a `Card()` tag).
   * @returns A Map of Blocks keyed by slot name.
   * @throws {ExtendedPugTailError} If a duplicate slot name exists.
   *
   * @example
   * ```typescript
   * // Card()
   * //   slot(header)
   * //     h1 Title
   * //   slot(body) // <- This is a typo in the original, should be slot(body)
   * //     p Content
   * const slots = resolver.extractProvidedSlots(cardCallNode)
   * const headerContent = slots.get('header') // Block for h1 Title
   * const bodyContent = slots.get('body')   // Block for p Content
   * ```
   */
  extractProvidedSlots(callNode: Node): Map<string, Block> {
    const slots = new Map<string, Block>()

    // If callNode is not a Tag or has no block, return an empty Map.
    if (callNode.type !== 'Tag') {
      return slots
    }

    const tagNode = callNode as Tag
    if (!tagNode.block) {
      return slots
    }

    // Collect slot nodes and non-slot nodes separately
    const slotNodes: Node[] = []
    const nonSlotNodes: Node[] = []

    // Search direct child nodes within the callNode's block.
    for (const node of tagNode.block.nodes) {
      if (isTagWithName(node, 'slot')) {
        slotNodes.push(node)
      } else if (node.type !== 'Comment') {
        // Non-slot, non-comment nodes are treated as default slot content
        // Comments are ignored
        nonSlotNodes.push(node)
      }
    }

    // Process slot nodes
    for (const node of slotNodes) {
      // Type guard to ensure node is Tag, since extractSlotName expects Tag
      if (node.type !== 'Tag') {
        continue // skip if not a tag (should not normally occur)
      }
      const slotName = extractSlotName(node as Tag)

      // Check for duplicates.
      if (slots.has(slotName)) {
        const location = getNodeLocationObject(node)
        throw this.errorHandler.duplicateSlotProvided(slotName, location)
      }

      // Copy and save the slot tag's block.
      // This preserves the slot content without modifying the original AST.
      if (node.block) {
        slots.set(slotName, deepCloneBlock(node.block))
      } else {
        // If there is no block, create an empty Block.
        const emptyBlock: Block = {
          type: 'Block',
          nodes: [],
          line: node.line,
          column: node.column,
          filename: node.filename,
        }
        slots.set(slotName, emptyBlock)
      }
    }

    // If there are non-slot nodes, treat them as default slot content
    if (nonSlotNodes.length > 0) {
      // Check if 'default' slot is already provided via slot tag
      if (slots.has('default')) {
        const firstNonSlotNode = nonSlotNodes[0]
        if (!firstNonSlotNode) {
          // This should not happen due to length check, but satisfies type checker
          return slots
        }
        const location = getNodeLocationObject(firstNonSlotNode)
        throw this.errorHandler.duplicateSlotProvided('default', location)
      }

      // Create a Block containing all non-slot nodes (deep cloned)
      const defaultBlock: Block = {
        type: 'Block',
        nodes: nonSlotNodes.map((node) => deepCloneNode(node)),
        line: tagNode.block.line,
        column: tagNode.block.column,
        filename: tagNode.block.filename,
      }
      slots.set('default', defaultBlock)
    }

    return slots
  }

  /**
   * Resolves a slot name (uses the provided slot or a default).
   *
   * @param slotName - The name of the slot to resolve.
   * @param providedSlots - A Map of provided slots.
   * @param defaultSlot - The default slot's Block, if it exists.
   * @returns The resolved slot content as a Block.
   *
   * @example
   * ```typescript
   * const content = resolver.resolveSlot(
   *   'header',
   *   providedSlots,
   *   defaultHeaderBlock
   * )
   * ```
   */
  resolveSlot(
    slotName: string,
    providedSlots: Map<string, Block>,
    defaultSlot: Block | null,
  ): Block {
    // If a slot is provided, use it.
    if (providedSlots.has(slotName)) {
      const provided = providedSlots.get(slotName)
      if (provided) {
        return provided
      }
    }

    // If a default slot exists, use it.
    if (defaultSlot) {
      return defaultSlot
    }

    // If neither exists, return an empty Block.
    return {
      type: 'Block',
      nodes: [],
      line: 0,
    }
  }
}
