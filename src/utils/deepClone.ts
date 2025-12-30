/**
 * AST Deep Cloning Utility.
 *
 * Creates a complete copy of the Pug AST, independent of the original.
 * This prevents side effects when expanding a component definition multiple times.
 */

import type { Block, Node } from '@/types/pug'

/**
 * Deep clones a Node.
 *
 * @param node - The node to be cloned.
 * @returns An independent, new node.
 *
 * @example
 * ```typescript
 * const original = { type: 'Tag', name: 'div', ... }
 * const cloned = deepCloneNode(original)
 * cloned.name = 'span'
 * console.log(original.name) // 'div' (unaffected)
 * ```
 */
export function deepCloneNode<T extends Node>(node: T): T {
  return structuredClone(node)
}

/**
 * Deep clones a Block.
 *
 * @param block - The block to be cloned.
 * @returns An independent, new block.
 *
 * @example
 * ```typescript
 * const original = { type: 'Block', nodes: [...], line: 1 }
 * const cloned = deepCloneBlock(original)
 * cloned.nodes.push(newNode)
 * console.log(original.nodes.length) // Remains the original length (unaffected)
 * ```
 */
export function deepCloneBlock(block: Block): Block {
  return structuredClone(block)
}

/**
 * Deep clones any object.
 *
 * A wrapper function for `structuredClone`.
 * Acts as a compatibility layer in case we switch to a different cloning method in the future.
 *
 * @param value - The value to be cloned.
 * @returns An independent, new value.
 *
 * @throws {DOMException} If it contains non-serializable objects (functions, Symbols, etc.).
 *
 * @example
 * ```typescript
 * const original = { a: { b: { c: 1 } } }
 * const cloned = deepClone(original)
 * cloned.a.b.c = 2
 * console.log(original.a.b.c) // 1 (unaffected)
 * ```
 */
export function deepClone<T>(value: T): T {
  return structuredClone(value)
}
