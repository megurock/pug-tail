/**
 * DefinitionRemoverVisitor
 *
 * Removes component definition nodes from the AST.
 *
 * After components have been detected and registered, their definition nodes
 * need to be removed from the AST since they are not valid Pug and should not
 * be passed to pug-code-gen.
 */

import type { Node } from '@/types/pug'
import { isComponentDefinitionNode } from '@/utils/componentDetector'
import type { Visitor, VisitorMethods } from './visitor'

/**
 * A visitor that removes component definition nodes.
 *
 * This visitor:
 * 1. Detects component definition tags
 * 2. Marks them for removal (returns null)
 * 3. The Traverser filters out null nodes from blocks
 *
 * @example
 * ```typescript
 * const visitor = new DefinitionRemoverVisitor()
 * const traverser = new Traverser()
 * const cleanedAst = traverser.traverse(ast, visitor)
 * // Component definitions are now removed
 * ```
 */
export class DefinitionRemoverVisitor implements Visitor {
  [nodeType: string]: VisitorMethods | undefined

  /**
   * Handle Tag nodes - remove component definitions.
   */
  Tag = {
    enter: (node: Node, _parent: Node | null): Node | undefined => {
      if (isComponentDefinitionNode(node)) {
        // Return null to mark this node for removal
        // The Traverser will filter out null nodes
        return null as unknown as undefined
      }
      // Keep the node as-is (don't return anything, use original)
      return undefined
    },
  }
}
