/**
 * Visitor pattern types for AST traversal.
 *
 * Based on the visitor pattern from the-super-tiny-compiler.
 * Each visitor can define enter/exit methods for different node types.
 */

import type { Node } from '@/types/pug'

/**
 * Methods that can be defined for each node type in a visitor.
 *
 * - `enter`: Called when entering a node (before traversing children)
 * - `exit`: Called when exiting a node (after traversing children)
 *
 * Both methods can optionally return a replacement node, or undefined to keep the original.
 */
export interface VisitorMethods {
  /**
   * Called when entering a node (before children are visited).
   *
   * @param node - The current node being visited
   * @param parent - The parent node (null for root)
   * @returns A replacement node, or undefined to keep the original
   */
  enter?(node: Node, parent: Node | null): Node | undefined

  /**
   * Called when exiting a node (after children have been visited).
   *
   * @param node - The current node being visited
   * @param parent - The parent node (null for root)
   * @returns A replacement node, or undefined to keep the original
   */
  exit?(node: Node, parent: Node | null): Node | undefined
}

/**
 * A visitor object that defines transformation logic for AST nodes.
 *
 * Each property key corresponds to a Pug node type (e.g., 'Tag', 'Block', 'Conditional').
 * The value is a VisitorMethods object with optional enter/exit methods.
 *
 * @example
 * ```typescript
 * const visitor: Visitor = {
 *   Tag: {
 *     enter: (node, parent) => {
 *       // Transform or analyze the tag node
 *       return modifiedNode
 *     }
 *   },
 *   Block: {
 *     exit: (node, parent) => {
 *       // Process block after children are visited
 *     }
 *   }
 * }
 * ```
 */
export interface Visitor {
  /**
   * Allow indexing by node type name.
   * This enables dynamic dispatch based on node.type.
   */
  [nodeType: string]: unknown

  // Common Pug node types
  Block?: VisitorMethods
  Tag?: VisitorMethods
  Text?: VisitorMethods
  Code?: VisitorMethods
  Comment?: VisitorMethods

  // Control flow nodes
  Conditional?: VisitorMethods
  Each?: VisitorMethods
  Case?: VisitorMethods
  When?: VisitorMethods
  While?: VisitorMethods

  // File inclusion nodes
  Include?: VisitorMethods
  Extends?: VisitorMethods
  NamedBlock?: VisitorMethods
  BlockStatement?: VisitorMethods

  // Other nodes
  Mixin?: VisitorMethods
  MixinBlock?: VisitorMethods
  Doctype?: VisitorMethods
  Filter?: VisitorMethods
  InterpolatedTag?: VisitorMethods
  FileReference?: VisitorMethods
}

/**
 * Base visitor class (optional - can be extended for convenience).
 *
 * Provides a no-op implementation that can be selectively overridden.
 *
 * @example
 * ```typescript
 * class MyVisitor extends BaseVisitor {
 *   Tag = {
 *     enter: (node, parent) => {
 *       // Only override what you need
 *     }
 *   }
 * }
 * ```
 */
export abstract class BaseVisitor implements Visitor {
  [nodeType: string]: unknown
}
