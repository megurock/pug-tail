/**
 * ASTTransformer
 *
 * A class that transforms the Pug AST to expand component definitions and slots.
 */

import walk from 'pug-walk'
import type { ComponentDefinition, NodeLocation, SlotDefinition } from '@/types'
import type {
  Block,
  Case,
  Code,
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
import { getNodeLocationObject, isCapitalizedTag } from '@/utils/astHelpers'
import { categorizeAttributes } from '@/utils/attributeCategorizer'
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
import { analyzeComponentScope } from '@/utils/scopeAnalyzer'
import {
  createAttrsCode,
  createPropsCode,
  detectAttributeUsage,
  extractReferencedVariables,
} from '@/utils/usageDetector'
import type { ComponentRegistry } from './componentRegistry'
import { ErrorHandler, type ErrorHandlerOptions } from './errorHandler'
import type { SlotResolver } from './slotResolver'

/**
 * Configuration options for ASTTransformer.
 */
export interface ASTTransformerOptions extends ErrorHandlerOptions {
  /** Validation configuration */
  validation?: {
    /** How to handle external variable references. Default: 'error' (strict mode). */
    scopeIsolation?: 'error' | 'warn' | 'off'
    /** Additional global variables to allow (beyond standard JavaScript globals). */
    allowedGlobals?: string[]
  }
  /** Enable debug output */
  debug?: boolean
}

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
  private config: ASTTransformerOptions

  constructor(
    registry: ComponentRegistry,
    resolver: SlotResolver,
    options: ASTTransformerOptions = {},
  ) {
    this.registry = registry
    this.resolver = resolver
    this.errorHandler = new ErrorHandler(options)
    this.config = options
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
   * Phase 3: Analyzes usage patterns (props/attrs) for each component.
   *
   * @param ast - The AST to search.
   */
  private detectAndRegisterComponents(ast: Node): void {
    walk(ast, (node: Node) => {
      // Register component definitions in the current AST
      if (isComponentDefinitionNode(node)) {
        const definition = extractComponentDefinition(node, this.errorHandler)

        // Phase 3: Detect usage patterns (props/attrs)
        const usage = detectAttributeUsage(definition.body)

        // Only set usage if props or attrs are actually used
        // This maintains Phase 2 compatibility
        if (usage.fromProps.length > 0 || usage.fromAttrs.length > 0) {
          definition.usage = usage

          // Fix mustEscape for props/attrs derived variables
          this.fixMustEscapeForPropsAttrs(definition.body, usage)
        }
        // If neither props nor attrs are used, leave usage undefined
        // to fall back to Phase 2 mode (attributes)

        // Scope Isolation: Analyze component scope
        const scopeAnalysis = analyzeComponentScope(
          definition.body,
          this.config.validation,
        )
        definition.scopeAnalysis = scopeAnalysis

        // Validate scope isolation (default: strict mode)
        const mode = this.config.validation?.scopeIsolation ?? 'error'
        if (mode !== 'off' && scopeAnalysis.externalReferences.size > 0) {
          for (const varName of scopeAnalysis.externalReferences) {
            const error = this.errorHandler.externalVariableReference(
              varName,
              definition.name,
              definition.location,
            )

            if (mode === 'error') {
              throw error // Strict mode: throw error
            } else {
              console.warn(error.message) // Warn mode: log warning
            }
          }
        }

        this.registry.register(definition)

        // Debug: Log registered component
        if (this.config.debug) {
          console.log(`[DEBUG] Registered component: ${definition.name}`)
          console.log(
            `  - Slots: ${Array.from(definition.slots.keys()).join(', ') || 'none'}`,
          )
          console.log(
            `  - Location: ${definition.location.filename}:${definition.location.line}`,
          )
        }
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
   * Also processes Include, Extends, and all Pug control structures to expand components within them.
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

    // Handle Each nodes (each loops)
    if (ast.type === 'Each') {
      const each = ast as Each
      const expandedBlock = each.block
        ? this.expandComponentsInBlock(each.block)
        : each.block
      const expandedAlternate = each.alternate
        ? this.expandComponentsInBlock(each.alternate)
        : each.alternate
      return {
        ...each,
        block: expandedBlock,
        alternate: expandedAlternate,
      }
    }

    // Handle Conditional nodes (if/unless/else)
    if (ast.type === 'Conditional') {
      const conditional = ast as Conditional
      const expandedConsequent = conditional.consequent
        ? this.expandComponentsInBlock(conditional.consequent)
        : conditional.consequent
      // alternate can be Block or Conditional (else if) or null
      let expandedAlternate: Block | Conditional | null = conditional.alternate
      if (conditional.alternate) {
        if (conditional.alternate.type === 'Block') {
          expandedAlternate = this.expandComponentsInBlock(
            conditional.alternate,
          )
        } else if (conditional.alternate.type === 'Conditional') {
          // Recursively handle else if
          expandedAlternate = this.expandComponents(
            conditional.alternate,
          ) as Conditional
        }
      }
      return {
        ...conditional,
        consequent: expandedConsequent,
        alternate: expandedAlternate,
      }
    }

    // Handle Case nodes (case/when statements)
    if (ast.type === 'Case') {
      const caseNode = ast as Case
      const expandedBlock = caseNode.block
        ? this.expandComponentsInBlock(caseNode.block)
        : caseNode.block
      return {
        ...caseNode,
        block: expandedBlock,
      }
    }

    // Handle When nodes (when branches inside case)
    if (ast.type === 'When') {
      const whenNode = ast as When
      const expandedBlock = whenNode.block
        ? this.expandComponentsInBlock(whenNode.block)
        : whenNode.block
      return {
        ...whenNode,
        block: expandedBlock,
      }
    }

    // Handle While nodes (while loops)
    if (ast.type === 'While') {
      const whileNode = ast as While
      const expandedBlock = whileNode.block
        ? this.expandComponentsInBlock(whileNode.block)
        : whileNode.block
      return {
        ...whileNode,
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

      // Phase 2/3: Extract and inject attributes
      const attributes = extractAttributes(callNode as Tag)

      this.injectAttributes(componentBodyCopy, attributes, component)

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
    // Debug: Log component and slot information
    if (process.env.DEBUG || this.config.debug) {
      console.log(`[DEBUG] replaceSlots called:`)
      console.log(
        `  - Provided slots: ${Array.from(providedSlots.keys()).join(', ') || 'none'}`,
      )
      console.log(
        `  - Defined slots: ${Array.from(slotDefinitions.keys()).join(', ') || 'none'}`,
      )
      console.log(
        `  - Call location: ${callLocation.filename}:${callLocation.line}`,
      )
    }

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
      const newNodes: Node[] = []

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

          // Replace the slot node with the Block's nodes (expand inline).
          newNodes.push(...replacement.nodes)
        } else {
          newNodes.push(node)
        }
      }

      // Update the block's nodes array
      block.nodes = newNodes

      // Now traverse child nodes
      for (const node of block.nodes) {
        if (!node) continue

        // Recursively traverse child nodes.
        // Skip slot nodes inside component call nodes (they are provided slots, not definitions).
        if (node.type === 'Tag' && node.block) {
          // If this is a component call node, skip traversing its block
          // because slots inside component calls are provided slots, not slot definitions.
          if (/^[A-Z]/.test(node.name)) {
            // Component call nodes are skipped (don't traverse their block)
            continue
          }
          // For regular tags, traverse their block normally
          traverse(node.block)
        } else if (node.type === 'InterpolatedTag') {
          // Handle InterpolatedTag (dynamic tags like #{tagName})
          const interpolatedTag = node as InterpolatedTag
          if (interpolatedTag.block) {
            traverse(interpolatedTag.block)
          }
        } else if (node.type === 'Block') {
          traverse(node)
        } else if (node.type === 'Conditional') {
          // Handle if/else: traverse both consequent and alternate
          const conditional = node as Conditional
          if (conditional.consequent) {
            traverse(conditional.consequent)
          }
          if (conditional.alternate) {
            // alternate can be Block or Conditional (else if)
            if (conditional.alternate.type === 'Block') {
              traverse(conditional.alternate)
            } else if (conditional.alternate.type === 'Conditional') {
              // For else if, traverse the Conditional node recursively
              // by processing it as a node (not a block)
              const altConditional = conditional.alternate
              if (altConditional.consequent) {
                traverse(altConditional.consequent)
              }
              if (altConditional.alternate) {
                if (altConditional.alternate.type === 'Block') {
                  traverse(altConditional.alternate)
                } else if (altConditional.alternate.type === 'Conditional') {
                  // Recursively handle nested else if
                  // This will be handled by the outer if (node.type === 'Conditional')
                  // when we process nodes in the block
                  // For now, we need to manually traverse it
                  const handleConditional = (cond: Conditional): void => {
                    if (cond.consequent) {
                      traverse(cond.consequent)
                    }
                    if (cond.alternate) {
                      if (cond.alternate.type === 'Block') {
                        traverse(cond.alternate)
                      } else if (cond.alternate.type === 'Conditional') {
                        handleConditional(cond.alternate)
                      }
                    }
                  }
                  handleConditional(altConditional.alternate)
                }
              }
            }
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
        } else if (node.type === 'When') {
          // Handle when branches: traverse block
          const whenNode = node as When
          if (whenNode.block) {
            traverse(whenNode.block)
          }
        } else if (node.type === 'While') {
          // Handle while loops: traverse block
          const whileNode = node as While
          if (whileNode.block) {
            traverse(whileNode.block)
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
   * Phase 2/3 implementation:
   * - Phase 3 (with usage): Categorizes attributes into props/attrs and injects both
   * - Phase 2 (no usage): Injects attributes object (backward compatible)
   *
   * Phase 2.5 features:
   * 1. Checks if developer has manually written &attributes anywhere in the component.
   *    If found, respects manual control and skips automatic fallthrough.
   * 2. Otherwise, automatically adds &attributes to the single root element for
   *    attribute fallthrough.
   * 3. Warns if there are multiple root elements (fallthrough disabled).
   *
   * Phase 3: Wraps component in block scope to prevent variable conflicts when multiple
   * components are called in the same scope. Uses const instead of var for block scoping.
   *
   * @param componentBody - The component body Block (already cloned)
   * @param attributes - Map of attribute names to JavaScript expression values
   * @param component - The component definition (includes usage patterns for Phase 3)
   */
  private injectAttributes(
    componentBody: Block,
    attributes: Map<string, string>,
    component: ComponentDefinition,
  ): void {
    // Phase 3: If component has usage patterns, categorize and inject props/attrs
    if (component.usage) {
      const { props, attrs } = categorizeAttributes(attributes, component.usage)

      // Phase 4: Extract all referenced variables for TDZ avoidance
      const referencedVars = extractReferencedVariables(props, attrs)
      const paramPrefix = referencedVars.size > 0 ? '__pug_arg_' : undefined

      // Phase 3.5/4: Create props/attrs code with renamed parameters
      const propsCodes = createPropsCode(props, paramPrefix)
      const attrsCodes = createAttrsCode(attrs, paramPrefix)

      // If there are referenced variables, wrap in IIFE for TDZ avoidance
      if (referencedVars.size > 0) {
        // IIFE pattern: ((__pug_arg_var1, __pug_arg_var2) => { ... })(var1, var2)
        const paramNames = Array.from(referencedVars).map(
          (v) => `__pug_arg_${v}`,
        )
        const argNames = Array.from(referencedVars)

        const iifeStart: Code = {
          type: 'Code',
          val: `;((${paramNames.join(', ')}) => {`,
          buffer: false,
          mustEscape: false,
          isInline: false,
          line: 0,
          column: 0,
          filename: '',
        }

        const iifeEnd: Code = {
          type: 'Code',
          val: `})(${argNames.join(', ')})`,
          buffer: false,
          mustEscape: false,
          isInline: false,
          line: 0,
          column: 0,
          filename: '',
        }

        // Insert codes in reverse order (unshift adds to front)
        for (let i = attrsCodes.length - 1; i >= 0; i--) {
          const code = attrsCodes[i]
          if (code) componentBody.nodes.unshift(code)
        }
        for (let i = propsCodes.length - 1; i >= 0; i--) {
          const code = propsCodes[i]
          if (code) componentBody.nodes.unshift(code)
        }
        componentBody.nodes.unshift(iifeStart)
        componentBody.nodes.push(iifeEnd)
      } else {
        // No referenced variables, use simple block scope
        const blockStart: Code = {
          type: 'Code',
          val: '{',
          buffer: false,
          mustEscape: false,
          isInline: false,
          line: 0,
          column: 0,
          filename: '',
        }

        const blockEnd: Code = {
          type: 'Code',
          val: '}',
          buffer: false,
          mustEscape: false,
          isInline: false,
          line: 0,
          column: 0,
          filename: '',
        }

        // Insert codes in reverse order (unshift adds to front)
        for (let i = attrsCodes.length - 1; i >= 0; i--) {
          const code = attrsCodes[i]
          if (code) componentBody.nodes.unshift(code)
        }
        for (let i = propsCodes.length - 1; i >= 0; i--) {
          const code = propsCodes[i]
          if (code) componentBody.nodes.unshift(code)
        }
        componentBody.nodes.unshift(blockStart)
        componentBody.nodes.push(blockEnd)
      }
    } else {
      // Phase 2: No usage patterns, inject attributes object (backward compatible)
      // Phase 3.5: No void() needed - createAttributesCode will handle variable references
      const attributesCode = createAttributesCode(attributes)
      componentBody.nodes.unshift(attributesCode)
    }

    // Phase 2.5: Check if developer has manually written &attributes anywhere
    if (hasAnyAttributeBlocks(componentBody)) {
      // Developer has manually controlled attributes, respect their choice
      // Do not add automatic fallthrough
      return
    }

    // Phase 2.5: Handle automatic attribute fallthrough
    const singleRoot = findSingleRootElement(componentBody)

    if (singleRoot) {
      // Single root element: automatically add &attributes
      // Phase 3: use 'attrs', Phase 2: use 'attributes'
      if (component.usage) {
        // Phase 3: Exclude attributes that are explicitly used from attrs
        // (they are already consumed, so don't include them in automatic fallthrough)
        // Note: We still inject the full attrs object for explicit use,
        // but for automatic fallthrough, we need to exclude fromAttrs attributes
        // This is handled by creating a filtered attrs object
        // However, since we can't modify the attrs object after injection,
        // we need to check if the root element already has explicit attributes
        // that match fromAttrs, and if so, we should not add automatic fallthrough
        // OR: We need to modify the approach to exclude fromAttrs from automatic fallthrough

        // For now, check if any fromAttrs attributes are explicitly set on the root element
        const fromAttrsSet = new Set(component.usage.fromAttrs)
        const hasExplicitAttrs = singleRoot.attrs?.some((attr) =>
          fromAttrsSet.has(attr.name),
        )

        if (!hasExplicitAttrs) {
          // No explicit attrs on root, safe to add automatic fallthrough
          addAttributeFallthrough(singleRoot, '$attrs')
        }
        // If hasExplicitAttrs, don't add automatic fallthrough to avoid duplication
      } else {
        // Phase 2: use 'attributes'
        addAttributeFallthrough(singleRoot, 'attributes')
      }
    } else if (hasMultipleRoots(componentBody)) {
      // Multiple root elements: warn and disable fallthrough
      console.warn(
        `[pug-tail] Component "${component.name}" has multiple root elements. ` +
          `Attribute fallthrough is disabled. ` +
          `Use &attributes($attrs) explicitly if needed.`,
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
   * Fixes mustEscape for attributes that use props/attrs derived variables.
   *
   * When an attribute value references a variable from $props or $attrs destructuring,
   * we need to set mustEscape to false to prevent pug-code-gen from calling pug.escape()
   * on the value, which would convert booleans to strings.
   *
   * @param componentBody - The component body Block
   * @param usage - The detected usage patterns (fromProps and fromAttrs)
   */
  private fixMustEscapeForPropsAttrs(
    componentBody: Block,
    usage: { fromProps: string[]; fromAttrs: string[] },
  ): void {
    const propsVars = new Set(usage.fromProps)
    const attrsVars = new Set(usage.fromAttrs)
    const allVars = new Set([...propsVars, ...attrsVars])

    // Recursively traverse the component body and fix mustEscape
    const fixNode = (node: Node): void => {
      if (node.type === 'Tag') {
        const tag = node as Tag

        // Fix mustEscape for attributes
        if (tag.attrs) {
          for (const attr of tag.attrs) {
            // Check if attribute value is a simple variable reference from props/attrs
            if (typeof attr.val === 'string' && allVars.has(attr.val.trim())) {
              attr.mustEscape = false
            }
          }
        }

        // Recursively process child block
        if (tag.block) {
          fixBlock(tag.block)
        }
      } else if (node.type === 'Block') {
        fixBlock(node as Block)
      } else if (node.type === 'Conditional') {
        const conditional = node as Conditional
        if (conditional.consequent) fixBlock(conditional.consequent)
        if (conditional.alternate) {
          if (conditional.alternate.type === 'Block') {
            fixBlock(conditional.alternate)
          } else if (conditional.alternate.type === 'Conditional') {
            fixNode(conditional.alternate)
          }
        }
      } else if (node.type === 'Each') {
        const each = node as Each
        if (each.block) fixBlock(each.block)
        if (each.alternate) fixBlock(each.alternate)
      } else if (node.type === 'Case') {
        const caseNode = node as Case
        if (caseNode.block) fixBlock(caseNode.block)
      } else if (node.type === 'When') {
        const whenNode = node as When
        if (whenNode.block) fixBlock(whenNode.block)
      } else if (node.type === 'While') {
        const whileNode = node as While
        if (whileNode.block) fixBlock(whileNode.block)
      }
    }

    const fixBlock = (block: Block): void => {
      for (const node of block.nodes) {
        if (node) fixNode(node)
      }
    }

    fixBlock(componentBody)
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
