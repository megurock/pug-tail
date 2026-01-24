/**
 * AST Traverser
 *
 * A generic AST traversal engine that implements the visitor pattern.
 * Inspired by the-super-tiny-compiler's traverser.
 *
 * The traverser walks through the AST depth-first, calling visitor methods
 * for each node type encountered.
 */

import type {
  Block,
  Case,
  Conditional,
  Each,
  Extends,
  Include,
  InterpolatedTag,
  Node,
  Tag,
  When,
  While,
} from '@/types/pug'
import type { Visitor, VisitorMethods } from '../visitors/visitor'

/**
 * Traverser class for walking through a Pug AST.
 *
 * The traverser visits each node in the tree depth-first, calling the
 * appropriate visitor methods (enter/exit) for each node.
 *
 * @example
 * ```typescript
 * const traverser = new Traverser()
 * const visitor: Visitor = {
 *   Tag: {
 *     enter(node, parent) {
 *       console.log('Visiting tag:', node.name)
 *     }
 *   }
 * }
 * const transformedAst = traverser.traverse(ast, visitor)
 * ```
 */
export class Traverser {
  /**
   * Traverse an AST with a visitor.
   *
   * Walks through the entire tree, calling visitor methods for each node.
   *
   * @param ast - The AST root node to traverse
   * @param visitor - The visitor containing enter/exit hooks for each node type
   * @returns The potentially transformed AST
   */
  traverse(ast: Node, visitor: Visitor): Node {
    const result = this.traverseNode(ast, null, visitor)
    if (result === null) {
      throw new Error('Root node cannot be null')
    }
    return result
  }

  /**
   * Traverse a single node.
   *
   * Calls the visitor's enter method (if present), then traverses children,
   * then calls the exit method (if present).
   *
   * @param node - The current node
   * @param parent - The parent node (null for root)
   * @param visitor - The visitor
   * @returns The potentially transformed node
   */
  private traverseNode(
    node: Node,
    parent: Node | null,
    visitor: Visitor,
  ): Node | null {
    // Get visitor methods for this node type
    const methods = visitor[node.type]

    // Type guard: check if methods is VisitorMethods
    const isVisitorMethods = (value: unknown): value is VisitorMethods => {
      return (
        value !== null &&
        value !== undefined &&
        typeof value === 'object' &&
        ('enter' in value || 'exit' in value)
      )
    }

    // Call enter hook if present
    if (isVisitorMethods(methods) && methods.enter) {
      const result = methods.enter(node, parent)
      // If enter returns a node (or null), use that as the new node
      if (result !== undefined) {
        node = result as Node
      }
    }

    // If node is null (marked for removal), return early
    if (node === null) {
      return null
    }

    // Traverse children based on node type
    node = this.traverseChildren(node, visitor)

    // Call exit hook if present
    if (isVisitorMethods(methods) && methods.exit) {
      const result = methods.exit(node, parent)
      // If exit returns a node (or null), use that as the final node
      if (result !== undefined) {
        node = result as Node
      }
    }

    return node
  }

  /**
   * Traverse children of a node based on its type.
   *
   * Different node types have different child structures.
   * This method handles each type appropriately.
   *
   * @param node - The parent node
   * @param visitor - The visitor
   * @returns The node with potentially transformed children
   */
  private traverseChildren(node: Node, visitor: Visitor): Node {
    switch (node.type) {
      case 'Block':
        return this.traverseBlock(node as Block, visitor)

      case 'Tag':
        return this.traverseTag(node as Tag, visitor)

      case 'InterpolatedTag':
        return this.traverseInterpolatedTag(node as InterpolatedTag, visitor)

      case 'Conditional':
        return this.traverseConditional(node as Conditional, visitor)

      case 'Each':
        return this.traverseEach(node as Each, visitor)

      case 'Case':
        return this.traverseCase(node as Case, visitor)

      case 'When':
        return this.traverseWhen(node as When, visitor)

      case 'While':
        return this.traverseWhile(node as While, visitor)

      case 'Include':
        return this.traverseInclude(node as Include, visitor)

      case 'Extends':
        return this.traverseExtends(node as Extends, visitor)

      // Leaf nodes - no children to traverse
      case 'Text':
      case 'Comment':
      case 'Code':
      case 'Mixin':
      case 'RawInclude':
        return node

      default:
        // Unknown node type - return as is
        return node
    }
  }

  /**
   * Traverse a Block node.
   *
   * A Block contains an array of child nodes.
   */
  private traverseBlock(block: Block, visitor: Visitor): Block {
    const transformedNodes: Node[] = []

    for (const childNode of block.nodes) {
      if (!childNode) continue

      const transformed = this.traverseNode(childNode, block, visitor)

      // Filter out null nodes (marked for removal by visitors)
      if (transformed !== null) {
        transformedNodes.push(transformed)
      }
    }

    return {
      ...block,
      nodes: transformedNodes,
    }
  }

  /**
   * Traverse a Tag node.
   *
   * A Tag may have a block child, attributes block, and code.
   */
  private traverseTag(tag: Tag, visitor: Visitor): Tag {
    const result = { ...tag }

    // Traverse the tag's block if it exists
    if (tag.block) {
      const transformedBlock = this.traverseNode(tag.block, tag, visitor)
      result.block = transformedBlock as Block
    }

    // Note: We don't traverse attributes, as they are not AST nodes
    // They are plain objects representing attribute name/value pairs

    return result
  }

  /**
   * Traverse an InterpolatedTag node.
   *
   * Similar to Tag, but the tag name is an expression.
   */
  private traverseInterpolatedTag(
    tag: InterpolatedTag,
    visitor: Visitor,
  ): InterpolatedTag {
    const result = { ...tag }

    if (tag.block) {
      const transformedBlock = this.traverseNode(tag.block, tag, visitor)
      result.block = transformedBlock as Block
    }

    return result
  }

  /**
   * Traverse a Conditional node (if/unless/else).
   *
   * A Conditional has a consequent (if true) and optionally an alternate (else).
   * The alternate can be another Conditional (else if) or a Block (else).
   */
  private traverseConditional(
    conditional: Conditional,
    visitor: Visitor,
  ): Conditional {
    const result = { ...conditional }

    // Traverse consequent (the "then" branch)
    if (conditional.consequent) {
      const transformedConsequent = this.traverseNode(
        conditional.consequent,
        conditional,
        visitor,
      )
      result.consequent = transformedConsequent as Block
    }

    // Traverse alternate (the "else" branch)
    if (conditional.alternate) {
      if (conditional.alternate.type === 'Block') {
        const transformedAlternate = this.traverseNode(
          conditional.alternate,
          conditional,
          visitor,
        )
        result.alternate = transformedAlternate as Block
      } else if (conditional.alternate.type === 'Conditional') {
        // Handle else if
        const transformedAlternate = this.traverseNode(
          conditional.alternate,
          conditional,
          visitor,
        )
        result.alternate = transformedAlternate as Conditional
      }
    }

    return result
  }

  /**
   * Traverse an Each node (each loop).
   *
   * An Each has a main block and optionally an alternate (else) block.
   */
  private traverseEach(each: Each, visitor: Visitor): Each {
    const result = { ...each }

    // Traverse main loop block
    if (each.block) {
      const transformedBlock = this.traverseNode(each.block, each, visitor)
      result.block = transformedBlock as Block
    }

    // Traverse alternate (else) block
    if (each.alternate) {
      const transformedAlternate = this.traverseNode(
        each.alternate,
        each,
        visitor,
      )
      result.alternate = transformedAlternate as Block
    }

    return result
  }

  /**
   * Traverse a Case node (case/when statement).
   *
   * A Case has a block containing When nodes.
   */
  private traverseCase(caseNode: Case, visitor: Visitor): Case {
    const result = { ...caseNode }

    if (caseNode.block) {
      const transformedBlock = this.traverseNode(
        caseNode.block,
        caseNode,
        visitor,
      )
      result.block = transformedBlock as Block
    }

    return result
  }

  /**
   * Traverse a When node (when branch in case statement).
   *
   * A When has a block that executes when its condition matches.
   */
  private traverseWhen(whenNode: When, visitor: Visitor): When {
    const result = { ...whenNode }

    if (whenNode.block) {
      const transformedBlock = this.traverseNode(
        whenNode.block,
        whenNode,
        visitor,
      )
      result.block = transformedBlock as Block
    }

    return result
  }

  /**
   * Traverse a While node (while loop).
   *
   * A While has a block that executes repeatedly.
   */
  private traverseWhile(whileNode: While, visitor: Visitor): While {
    const result = { ...whileNode }

    if (whileNode.block) {
      const transformedBlock = this.traverseNode(
        whileNode.block,
        whileNode,
        visitor,
      )
      result.block = transformedBlock as Block
    }

    return result
  }

  /**
   * Traverse an Include node.
   *
   * An Include may have a file.ast that should be traversed.
   */
  private traverseInclude(include: Include, visitor: Visitor): Include {
    const result = { ...include }

    // If the include has been resolved with an AST, traverse it
    if (include.file?.ast) {
      const transformedAst = this.traverseNode(
        include.file.ast,
        include,
        visitor,
      )
      result.file = {
        ...include.file,
        ast: transformedAst as Block,
      }
    }

    return result
  }

  /**
   * Traverse an Extends node.
   *
   * An Extends may have a file.ast that should be traversed.
   */
  private traverseExtends(extendsNode: Extends, visitor: Visitor): Extends {
    const result = { ...extendsNode }

    // If the extends has been resolved with an AST, traverse it
    if (extendsNode.file?.ast) {
      const transformedAst = this.traverseNode(
        extendsNode.file.ast,
        extendsNode,
        visitor,
      )
      result.file = {
        ...extendsNode.file,
        ast: transformedAst as Block,
      }
    }

    return result
  }
}
