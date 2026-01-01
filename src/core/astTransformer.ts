/**
 * ASTTransformer
 *
 * A class that transforms the Pug AST to expand component definitions and slots.
 */

import walk from 'pug-walk'
import type { NodeLocation, SlotDefinition } from '@/types'
import type {
  Block,
  Case,
  Conditional,
  Each,
  Extends,
  Include,
  Node,
  Tag,
} from '@/types/pug'
import { getNodeLocationObject, isCapitalizedTag } from '@/utils/astHelpers'
import {
  addAttributeFallthrough,
  createAttributesCode,
  extractAttributes,
  findSingleRootElement,
  hasAnyAttributeBlocks,
  hasMultipleRoots,
} from '@/utils/attributes'
import {
  extractComponentDefinition,
  extractSlotName,
  isComponentDefinitionNode,
  isSlotDefinitionNode,
} from '@/utils/componentDetector'
import { deepCloneBlock } from '@/utils/deepClone'
import type { ComponentRegistry } from './componentRegistry'
import { ErrorHandler, type ErrorHandlerOptions } from './errorHandler'
import type { SlotResolver } from './slotResolver'

/**
 * A class that transforms the AST to expand components and slots.
 *
 * Processing flow:
 * 1. Detect and register component definitions.
 * 2. Expand component calls.
 * 3. Remove component definition nodes.
 *
 * @example
 * ```typescript
 * const registry = new ComponentRegistry()
 * const resolver = new SlotResolver()
 * const transformer = new ASTTransformer(registry, resolver)
 *
 * const transformedAst = transformer.transform(ast)
 * ```
 */
export class ASTTransformer {
  private registry: ComponentRegistry
  private resolver: SlotResolver
  private errorHandler: ErrorHandler
  private callStack: string[] = [] // For recursion detection

  constructor(
    registry: ComponentRegistry,
    resolver: SlotResolver,
    options: ErrorHandlerOptions = {},
  ) {
    this.registry = registry
    this.resolver = resolver
    this.errorHandler = new ErrorHandler(options)
  }

  /**
   * Transforms the AST.
   *
   * @param ast - The AST to transform.
   * @returns The transformed AST (a pure Pug AST with components and slots expanded).
   *
   * @example
   * ```typescript
   * const transformed = transformer.transform(ast)
   * ```
   */
  transform(ast: Node): Node {
    // 1. Detect and register component definitions.
    this.detectAndRegisterComponents(ast)

    // 2. Expand component calls.
    const transformed = this.expandComponents(ast)

    // 3. Remove component definition nodes.
    const withoutDefinitions = this.removeComponentDefinitions(transformed)

    // 4. Flatten Include nodes (replace with their content)
    return this.flattenIncludes(withoutDefinitions)
  }

  /**
   * Detects and registers component definitions.
   *
   * Detects all component definitions within the AST and
   * registers them with the ComponentRegistry.
   * Also processes Include and Extends nodes to register components from included/extended files.
   *
   * @param ast - The AST to search.
   */
  private detectAndRegisterComponents(ast: Node): void {
    walk(ast, (node: Node) => {
      // Register component definitions in the current AST
      if (isComponentDefinitionNode(node)) {
        const definition = extractComponentDefinition(node, this.errorHandler)
        this.registry.register(definition)
      }

      // Process Include and Extends nodes to register components from included/extended files
      // pug-load adds file.ast property to Include and Extends nodes
      if (node.type === 'Include' || node.type === 'Extends') {
        const fileNode = node as Include | Extends
        if (fileNode.file?.ast) {
          const fileAst = fileNode.file.ast
          // Recursively detect and register components in the included/extended AST
          this.detectAndRegisterComponents(fileAst)
        }
      }
    })
  }

  /**
   * Expands component calls.
   *
   * Detects all component calls within the AST and
   * replaces them with the corresponding component definitions.
   * Also processes Include and Extends nodes to expand components in included/extended files.
   *
   * @param ast - The AST to transform.
   * @returns The transformed AST.
   */
  private expandComponents(ast: Node): Node {
    if (ast.type === 'Block') {
      return this.expandComponentsInBlock(ast)
    }

    if (ast.type === 'Tag' && ast.block) {
      const expandedBlock = this.expandComponentsInBlock(ast.block)
      return {
        ...ast,
        block: expandedBlock,
      }
    }

    // Process Include and Extends nodes to expand components in included/extended AST
    if (ast.type === 'Include' || ast.type === 'Extends') {
      const fileNode = ast as Include | Extends
      if (fileNode.file?.ast) {
        const expandedFileAst = this.expandComponents(fileNode.file.ast)
        return {
          ...fileNode,
          file: {
            ...fileNode.file,
            ast: expandedFileAst,
          },
        } as Node
      }
    }

    return ast
  }

  /**
   * Expands component calls within a Block.
   *
   * @param block - The Block to transform.
   * @returns The transformed Block.
   */
  private expandComponentsInBlock(block: Block): Block {
    const result: Block = {
      type: 'Block',
      nodes: [],
      line: block.line,
      column: block.column,
      filename: block.filename,
    }

    for (const node of block.nodes) {
      if (this.isComponentCall(node)) {
        // Expand the component call and add its nodes.
        const expanded = this.expandComponentCall(node)
        // Recursively expand component calls within the expanded Block.
        const fullyExpanded = this.expandComponentsInBlock(expanded)
        result.nodes.push(...fullyExpanded.nodes)
      } else {
        // If it's not a component call, process it recursively.
        const processed = this.expandComponents(node)
        result.nodes.push(processed)
      }
    }

    return result
  }

  /**
   * Expands an individual component call.
   *
   * @param callNode - The component call node.
   * @returns The expanded AST (Block).
   * @throws {ExtendedPugTailError} If the component is not found, or if a recursive call is detected.
   */
  private expandComponentCall(callNode: Node): Block {
    if (callNode.type !== 'Tag') {
      const location = getNodeLocationObject(callNode)
      throw this.errorHandler.unexpectedNodeType('Tag', callNode.type, location)
    }

    const componentName = this.extractCallName(callNode as Tag)
    const location = getNodeLocationObject(callNode)

    // Recursion check
    if (this.callStack.includes(componentName)) {
      throw this.errorHandler.recursiveComponentCall(
        componentName,
        this.callStack,
        location,
      )
    }

    this.callStack.push(componentName)

    try {
      // Get the component definition.
      const component = this.registry.get(componentName)
      if (!component) {
        const available = this.registry.getNames()
        throw this.errorHandler.componentNotFound(
          componentName,
          location,
          available,
        )
      }

      // Extract slots from the call site.
      const providedSlots = this.resolver.extractProvidedSlots(callNode)

      // Copy the component and replace slots.
      const componentBodyCopy = deepCloneBlock(component.body)

      // Phase 2: Extract and inject attributes
      const attributes = extractAttributes(callNode as Tag)
      this.injectAttributes(componentBodyCopy, attributes, componentName)

      const result = this.replaceSlots(
        componentBodyCopy,
        providedSlots,
        component.slots,
        location,
      )

      return result
    } finally {
      this.callStack.pop()
    }
  }

  /**
   * Replaces slots.
   *
   * Replaces slot nodes within a component definition with the provided
   * slot content or default content.
   *
   * @param componentBody - The Block of the component body.
   * @param providedSlots - A Map of provided slots.
   * @param slotDefinitions - A Map of slot definitions within the component.
   * @param callLocation - The location of the component call (for error reporting).
   * @returns A Block with slots replaced.
   * @throws {ExtendedPugTailError} If a provided slot does not exist in the definition.
   */
  private replaceSlots(
    componentBody: Block,
    providedSlots: Map<string, Block>,
    slotDefinitions: Map<string, SlotDefinition>,
    callLocation: NodeLocation,
  ): Block {
    // Check if the provided slots exist in the definition.
    // Note: 'default' slot can be provided even if not explicitly defined
    // (when component has unnamed slot or when direct children are provided)
    for (const [slotName] of providedSlots) {
      if (!slotDefinitions.has(slotName)) {
        // Allow 'default' slot to be provided even if not explicitly defined
        // This supports unnamed slots and direct child content
        if (slotName === 'default') {
          continue
        }
        const availableSlots = Array.from(slotDefinitions.keys())
        throw this.errorHandler.slotNotDefined(
          slotName,
          callLocation,
          availableSlots,
        )
      }
    }

    const result = deepCloneBlock(componentBody)
    const transformer = this // Capture 'this'

    // Traverse and replace all slot nodes within the Block.
    function traverse(block: Block): void {
      for (let i = 0; i < block.nodes.length; i++) {
        const node = block.nodes[i]
        if (!node) continue

        if (isSlotDefinitionNode(node)) {
          const slotName = extractSlotName(node)

          // Use the provided slot or the default.
          let replacement: Block

          if (providedSlots.has(slotName)) {
            const provided = providedSlots.get(slotName)
            if (provided) {
              replacement = provided
            } else {
              // Fallback: use the default slot.
              replacement = transformer.getDefaultSlotBlock(
                slotName,
                slotDefinitions,
                node,
              )
            }
          } else {
            // Use the default slot.
            replacement = transformer.getDefaultSlotBlock(
              slotName,
              slotDefinitions,
              node,
            )
          }

          // Replace the slot node.
          block.nodes[i] = replacement
        }

        // Recursively traverse child nodes.
        if (node.type === 'Tag' && node.block) {
          traverse(node.block)
        } else if (node.type === 'Block') {
          traverse(node)
        } else if (node.type === 'Conditional') {
          // Handle if/else: traverse both consequent and alternate
          const conditional = node as Conditional
          if (conditional.consequent) {
            traverse(conditional.consequent)
          }
          if (conditional.alternate) {
            traverse(conditional.alternate)
          }
        } else if (node.type === 'Each') {
          // Handle each loops: traverse block and alternate
          const each = node as Each
          if (each.block) {
            traverse(each.block)
          }
          if (each.alternate) {
            traverse(each.alternate)
          }
        } else if (node.type === 'Case') {
          // Handle case/when: traverse block
          const caseNode = node as Case
          if (caseNode.block) {
            traverse(caseNode.block)
          }
        }
      }
    }

    traverse(result)
    return result
  }

  /**
   * Gets the Block for the default slot.
   *
   * @param slotName - The name of the slot.
   * @param slotDefinitions - A Map of slot definitions.
   * @param slotNode - The slot node (for fallback location).
   * @returns The Block for the default slot.
   */
  private getDefaultSlotBlock(
    slotName: string,
    slotDefinitions: Map<string, SlotDefinition>,
    slotNode: Tag,
  ): Block {
    const slotDef = slotDefinitions.get(slotName)
    if (slotDef?.placeholder?.block) {
      return deepCloneBlock(slotDef.placeholder.block)
    }

    // If the slot definition is not found, return an empty Block.
    return {
      type: 'Block',
      nodes: [],
      line: slotNode.line,
      column: slotNode.column,
      filename: slotNode.filename,
    }
  }

  /**
   * Determines if a node is a component call node.
   *
   * @param node - The node to check.
   * @returns True if the node is a component call.
   */
  private isComponentCall(node: Node): boolean {
    return isCapitalizedTag(node)
  }

  /**
   * Extracts the component name from a component call node.
   *
   * @param callNode - The component call node.
   * @returns The component name (e.g., 'Card').
   */
  private extractCallName(callNode: Tag): string {
    return callNode.name
  }

  /**
   * Injects attributes into the component body.
   *
   * Phase 2.5 implementation:
   * 1. Inserts a Code node at the beginning of the component body to make
   *    the attributes object available.
   * 2. Checks if developer has manually written &attributes anywhere in the component.
   *    If found, respects manual control and skips automatic fallthrough.
   * 3. Otherwise, automatically adds &attributes to the single root element for
   *    attribute fallthrough.
   * 4. Warns if there are multiple root elements (fallthrough disabled).
   *
   * @param componentBody - The component body Block (already cloned)
   * @param attributes - Map of attribute names to JavaScript expression values
   * @param componentName - The component name (for warning messages)
   */
  private injectAttributes(
    componentBody: Block,
    attributes: Map<string, string>,
    componentName: string,
  ): void {
    // 1. Create and insert the attributes Code node at the beginning
    const attributesCode = createAttributesCode(attributes)
    componentBody.nodes.unshift(attributesCode)

    // 2. Check if developer has manually written &attributes anywhere
    if (hasAnyAttributeBlocks(componentBody)) {
      // Developer has manually controlled attributes, respect their choice
      // Do not add automatic fallthrough
      return
    }

    // 3. Handle automatic attribute fallthrough
    const singleRoot = findSingleRootElement(componentBody)

    if (singleRoot) {
      // Single root element: automatically add &attributes
      addAttributeFallthrough(singleRoot)
    } else if (hasMultipleRoots(componentBody)) {
      // Multiple root elements: warn and disable fallthrough
      console.warn(
        `[pug-tail] Component "${componentName}" has multiple root elements. ` +
          `Attribute fallthrough is disabled. ` +
          `Use &attributes(attrs) explicitly if needed.`,
      )
    }
    // If there are no root elements (empty component), do nothing
  }

  /**
   * Removes component definition nodes.
   *
   * Removes component definition nodes from the transformed AST.
   * Also processes Include and Extends nodes to remove component definitions from included/extended files.
   *
   * @param ast - The AST to transform.
   * @returns An AST with component definition nodes removed.
   */
  private removeComponentDefinitions(ast: Node): Node {
    if (ast.type === 'Block') {
      const result: Block = {
        type: 'Block',
        nodes: [],
        line: ast.line,
        column: ast.column,
        filename: ast.filename,
      }

      for (const node of ast.nodes) {
        if (!isComponentDefinitionNode(node)) {
          // If it's not a component definition, process it recursively.
          const processed = this.removeComponentDefinitions(node)
          result.nodes.push(processed)
        }
        // Skip if it is a component definition.
      }

      return result
    }

    if (ast.type === 'Tag' && ast.block) {
      const processedBlock = this.removeComponentDefinitions(ast.block) as Block
      return {
        ...ast,
        block: processedBlock,
      }
    }

    // Process Include and Extends nodes to remove component definitions from included/extended AST
    if (ast.type === 'Include' || ast.type === 'Extends') {
      const fileNode = ast as Include | Extends
      if (fileNode.file?.ast) {
        const processedFileAst = this.removeComponentDefinitions(
          fileNode.file.ast,
        )
        return {
          ...fileNode,
          file: {
            ...fileNode.file,
            ast: processedFileAst,
          },
        } as Node
      }
    }

    // Return other nodes as is.
    return ast
  }

  /**
   * Flattens Include and Extends nodes by replacing them with their content.
   *
   * pug-code-gen does not support Include or Extends nodes, so we need to replace them
   * with the actual content from the included/extended files.
   *
   * @param ast - The AST to transform.
   * @returns An AST with Include and Extends nodes replaced by their content.
   */
  private flattenIncludes(ast: Node): Node {
    if (ast.type === 'Block') {
      const result: Block = {
        type: 'Block',
        nodes: [],
        line: ast.line,
        column: ast.column,
        filename: ast.filename,
      }

      for (const node of ast.nodes) {
        if (node.type === 'Include' || node.type === 'Extends') {
          const fileNode = node as Include | Extends
          if (fileNode.file?.ast) {
            // Replace Include/Extends node with its content
            const fileAst = fileNode.file.ast as Block
            // Recursively flatten includes/extends in the included/extended content
            const flattenedFile = this.flattenIncludes(fileAst) as Block
            // Add all nodes from the included/extended file
            result.nodes.push(...flattenedFile.nodes)
          }
        } else {
          // Process node recursively
          const processed = this.flattenIncludes(node)
          result.nodes.push(processed)
        }
      }

      return result
    }

    if (ast.type === 'Tag' && ast.block) {
      const flattenedBlock = this.flattenIncludes(ast.block) as Block
      return {
        ...ast,
        block: flattenedBlock,
      }
    }

    // Return other nodes as is.
    return ast
  }
}
