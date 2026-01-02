/**
 * Component definition detection and parsing.
 *
 * Provides functionality to detect and extract component and slot definitions from a Pug AST.
 */

import type { ErrorHandler } from '@/core/errorHandler'
import type { ComponentDefinition, NodeLocation, SlotDefinition } from '@/types'
import type { Block, Node, Tag, Text } from '@/types/pug'
import { getNodeLocationObject, isTagNode, isTagWithName } from './astHelpers'
import { deepCloneBlock } from './deepClone'

/**
 * Checks if a node is a component definition node.
 *
 * @param node - The node to check.
 * @returns True if the node is a component definition node.
 *
 * @example
 * ```typescript
 * if (isComponentDefinitionNode(node)) {
 *   const def = extractComponentDefinition(node)
 * }
 * ```
 */
export function isComponentDefinitionNode(node: Node): node is Tag {
  return isTagWithName(node, 'component')
}

/**
 * Extracts the component name.
 *
 * Extracts `Card` from `component Card()`.
 * It gets `Card()` from the first Text node within the component tag's block,
 * removes the parentheses `()`, and returns the component name.
 *
 * @param componentNode - The component definition node.
 * @returns The component name (e.g., 'Card').
 * @throws {Error} component 名が見つからない場合
 *
 * @example
 * ```typescript
 * const name = extractComponentName(componentNode)
 * console.log(name) // "Card"
 * ```
 */
export function extractComponentName(componentNode: Tag): string {
  if (!componentNode.block) {
    throw new Error(
      `Component definition must have a block at ${getNodeLocationString(componentNode)}`,
    )
  }

  // Find the first Text node inside the component tag's block.
  const firstTextNode = componentNode.block.nodes.find(
    (node): node is Text => node.type === 'Text',
  )

  if (!firstTextNode) {
    throw new Error(
      `Component name not found. Expected format: component ComponentName() at ${getNodeLocationString(componentNode)}`,
    )
  }

  // Extract `Card` from `Card()`.
  const nameWithParens = firstTextNode.val.trim()
  const match = nameWithParens.match(/^([A-Z][a-zA-Z0-9_]*)\s*\(\)?$/)

  if (!match || !match[1]) {
    throw new Error(
      `Invalid component name format: "${nameWithParens}". Expected format: ComponentName() at ${getNodeLocationString(componentNode)}`,
    )
  }

  return match[1]
}

/**
 * Extracts the component body (Block).
 *
 * Returns the remaining nodes as a Block, excluding the Text node
 * that contains the component name, from the component tag's block.
 *
 * @param componentNode - The component definition node.
 * @returns The Block representing the component body.
 *
 * @example
 * ```typescript
 * const body = extractComponentBody(componentNode)
 * // body には .card, .card-header などのノードが含まれる
 * ```
 */
export function extractComponentBody(componentNode: Tag): Block {
  if (!componentNode.block) {
    return {
      type: 'Block',
      nodes: [],
      line: componentNode.line,
      column: componentNode.column,
      filename: componentNode.filename,
    }
  }

  // Get the remaining nodes, excluding the Text node with the component name.
  const bodyNodes = componentNode.block.nodes.filter(
    (node) =>
      node.type !== 'Text' || !node.val.match(/^[A-Z][a-zA-Z0-9_]*\s*\(\)?$/),
  )

  return {
    type: 'Block',
    nodes: bodyNodes,
    line: componentNode.block.line,
    column: componentNode.block.column,
    filename: componentNode.block.filename,
  }
}

/**
 * Extracts a component definition.
 *
 * Constructs a ComponentDefinition from a component node.
 *
 * @param componentNode - The component definition node.
 * @returns A ComponentDefinition object.
 * @throws {Error} component 名や slot の解析に失敗した場合
 *
 * @example
 * ```typescript
 * if (isComponentDefinitionNode(node)) {
 *   const definition = extractComponentDefinition(node)
 *   registry.register(definition)
 * }
 * ```
 */
export function extractComponentDefinition(
  componentNode: Tag,
  errorHandler?: ErrorHandler,
): ComponentDefinition {
  const name = extractComponentName(componentNode)
  const body = extractComponentBody(componentNode)
  const slots = extractSlotDefinitions(body, errorHandler)

  const location: NodeLocation = {
    line: componentNode.line,
    column: componentNode.column,
    filename: componentNode.filename,
  }

  return {
    name,
    body: deepCloneBlock(body),
    slots,
    location,
  }
}

/**
 * Checks if a node is a slot definition node.
 *
 * @param node - The node to check.
 * @returns True if the node is a slot definition node.
 *
 * @example
 * ```typescript
 * if (isSlotDefinitionNode(node)) {
 *   const slotDef = extractSlotDefinition(node)
 * }
 * ```
 */
export function isSlotDefinitionNode(node: Node): node is Tag {
  return isTagWithName(node, 'slot')
}

/**
 * Extracts the slot name.
 *
 * Extracts the slot name from `slot(header)` or `slot(name="header")`.
 *
 * @param slotNode - The slot definition node.
 * @returns The slot name (e.g., 'header').
 * @throws {Error} slot 名が見つからない場合
 *
 * @example
 * ```typescript
 * const slotName = extractSlotName(slotNode)
 * console.log(slotName) // "header"
 * ```
 */
export function extractSlotName(slotNode: Tag): string {
  // For `slot(header)`, the name of the first attribute is the slot name.
  if (slotNode.attrs && slotNode.attrs.length > 0) {
    const firstAttr = slotNode.attrs[0]
    if (!firstAttr) {
      return 'default'
    }

    // For `slot(name="header")`.
    if (firstAttr.name === 'name') {
      const val = firstAttr.val
      if (typeof val === 'string') {
        // Remove quotes.
        return val.replace(/^['"]|['"]$/g, '')
      }
      throw new Error(
        `Invalid slot name attribute value at ${getNodeLocationString(slotNode)}`,
      )
    }

    // For `slot(header)`, the name of the first attribute is the slot name.
    return firstAttr.name
  }

  // If there are no attributes, return 'default'.
  return 'default'
}

/**
 * slot 定義を抽出
 *
 * slot ノードから SlotDefinition を構築します。
 * *
 * @param slotNode - The slot definition node.
 * @returns A SlotDefinition object.
 *
 * @example
 * ```typescript
 * if (isSlotDefinitionNode(node)) {
 *   const slotDef = extractSlotDefinition(node)
 * }
 * ```
 */
export function extractSlotDefinition(slotNode: Tag): SlotDefinition {
  const name = extractSlotName(slotNode)

  const location: NodeLocation = {
    line: slotNode.line,
    column: slotNode.column,
    filename: slotNode.filename,
  }

  return {
    name,
    placeholder: slotNode, // Keep the entire slot tag node.
    location,
  }
}

/**
 * Extracts all slot definitions within a Block.
 *
 * @param block - The Block to search within.
 * @param errorHandler - An optional error handler.
 * @returns A Map of SlotDefinitions, keyed by slot name.
 * @throws {ExtendedPugTailError} 重複した slot 定義が存在する場合
 *
 * @example
 * ```typescript
 * const slots = extractSlotDefinitions(componentBody, errorHandler)
 * console.log(slots.get('header')) // SlotDefinition
 * ```
 */
export function extractSlotDefinitions(
  block: Block,
  errorHandler?: ErrorHandler,
): Map<string, SlotDefinition> {
  const slots = new Map<string, SlotDefinition>()

  function traverse(node: Node): void {
    if (isSlotDefinitionNode(node)) {
      const slotDef = extractSlotDefinition(node)

      // Check for duplicates.
      if (slots.has(slotDef.name)) {
        const existing = slots.get(slotDef.name)
        if (existing) {
          if (errorHandler) {
            const location = getNodeLocationObject(node)
            throw errorHandler.duplicateSlotDefinition(slotDef.name, location)
          }
          // If no ErrorHandler is provided, throw a standard error.
          throw new Error(
            `Duplicate slot definition "${slotDef.name}" at ${getNodeLocationString(node)}. ` +
              `Previously defined at ${getNodeLocationString(existing.placeholder)}`,
          )
        }
      }

      slots.set(slotDef.name, slotDef)
    }

    // Recursively traverse child nodes.
    // Skip slot nodes inside component call nodes (they are provided slots, not definitions).
    if (isTagNode(node)) {
      const tagNode = node as Tag
      // If this is a component call node, skip traversing its block
      // because slots inside component calls are provided slots, not slot definitions.
      // Check if the tag name starts with a capital letter (component call)
      if (/^[A-Z]/.test(tagNode.name)) {
        // Component call nodes are skipped (don't traverse their block)
        return
      }
      // For regular tags, traverse their block normally
      if (tagNode.block) {
        for (const child of tagNode.block.nodes) {
          traverse(child)
        }
      }
    }

    if (node.type === 'Block') {
      for (const child of node.nodes) {
        traverse(child)
      }
    }
  }

  // Traverse all nodes within the Block.
  for (const node of block.nodes) {
    traverse(node)
  }

  return slots
}

/**
 * Gets the location information of a node as a string (internal helper).
 *
 * @param node - The target node.
 * @returns A string representing the location (e.g., "example.pug:10:5").
 */
function getNodeLocationString(node: Node): string {
  const filename = 'filename' in node ? node.filename : undefined
  const line = 'line' in node ? node.line : undefined
  const column = 'column' in node ? node.column : undefined

  const parts: string[] = []
  if (filename) parts.push(filename)
  if (line !== undefined) parts.push(String(line))
  if (column !== undefined) parts.push(String(column))

  return parts.length > 0 ? parts.join(':') : 'unknown'
}
