/**
 * IncludeFlattenerVisitor
 *
 * Flattens Include and Extends nodes by replacing them with their content.
 *
 * pug-code-gen does not support Include or Extends nodes, so we need to replace
 * them with the actual content from the included/extended files.
 */

import type { Extends, Include, Node } from '@/types/pug'
import type { Visitor, VisitorMethods } from './visitor'

/**
 * A visitor that flattens Include and Extends nodes.
 *
 * This visitor:
 * 1. Detects Include nodes with resolved AST
 * 2. Replaces the Include node with its file.ast content
 * 3. Detects Extends nodes with resolved AST
 * 4. Replaces the Extends node with its file.ast content
 *
 * @example
 * ```typescript
 * const visitor = new IncludeFlattenerVisitor()
 * const traverser = new Traverser()
 * const flattenedAst = traverser.traverse(ast, visitor)
 * // Include and Extends nodes are now replaced with their content
 * ```
 */
export class IncludeFlattenerVisitor implements Visitor {
  [nodeType: string]: VisitorMethods | undefined

  /**
   * Handle Include nodes - replace with their content.
   */
  Include = {
    enter: (node: Node, _parent: Node | null): Node | undefined => {
      const includeNode = node as Include

      // If the include has been resolved with an AST, replace it with that AST
      if (includeNode.file?.ast) {
        return includeNode.file.ast
      }

      // If no AST, keep the node as-is (shouldn't happen in normal usage)
      return node
    },
  }

  /**
   * Handle Extends nodes - replace with their content.
   */
  Extends = {
    enter: (node: Node, _parent: Node | null): Node | undefined => {
      const extendsNode = node as Extends

      // If the extends has been resolved with an AST, replace it with that AST
      if (extendsNode.file?.ast) {
        return extendsNode.file.ast
      }

      // If no AST, keep the node as-is (shouldn't happen in normal usage)
      return node
    },
  }
}
