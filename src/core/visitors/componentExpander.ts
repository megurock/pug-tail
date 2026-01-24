/**
 * ComponentExpanderVisitor
 *
 * Expands component calls by replacing them with the component's body content.
 *
 * This visitor handles:
 * - Component call detection
 * - Recursion detection
 * - Component body cloning
 * - Slot extraction and replacement
 * - Attribute injection (props/attrs)
 * - Nested component expansion
 */

import type { ComponentDefinition, NodeLocation, SlotDefinition } from '@/types'
import type {
  Block,
  Case,
  Code,
  Conditional,
  Each,
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
  extractSlotName,
  isSlotDefinitionNode,
} from '@/utils/componentDetector'
import { deepCloneBlock } from '@/utils/deepClone'
import {
  createAttrsCode,
  createPropsCode,
  extractReferencedVariables,
} from '@/utils/usageDetector'
import type { ComponentRegistry } from '../componentRegistry'
import type { ErrorHandler } from '../errorHandler'
import { SlotResolver } from '../slotResolver'
import type { Visitor } from './visitor'

/**
 * Options for ComponentExpanderVisitor
 */
export interface ComponentExpanderOptions {
  /** Enable debug output */
  debug?: boolean
}

/**
 * A visitor that expands component calls.
 *
 * When a component call (capitalized tag) is encountered, this visitor:
 * 1. Retrieves the component definition from the registry
 * 2. Clones the component body
 * 3. Extracts provided slots from the call site
 * 4. Injects attributes (as props/attrs or attributes object)
 * 5. Replaces slot definitions with provided content
 * 6. Returns the expanded Block
 *
 * @example
 * ```typescript
 * const registry = new ComponentRegistry()
 * const errorHandler = new ErrorHandler()
 * const visitor = new ComponentExpanderVisitor(registry, errorHandler)
 * const traverser = new Traverser()
 * const expandedAst = traverser.traverse(ast, visitor)
 * ```
 */
export class ComponentExpanderVisitor implements Visitor {
  // Index signature required by Visitor interface, but TypeScript doesn't allow mixing it with private members
  [nodeType: string]: unknown
  private callStack: string[] = [] // For recursion detection
  private slotResolver: SlotResolver

  constructor(
    private registry: ComponentRegistry,
    private errorHandler: ErrorHandler,
    options: ComponentExpanderOptions = {},
  ) {
    this.slotResolver = new SlotResolver({
      filename: options.debug ? 'debug' : undefined,
    })
  }

  /**
   * Handle Block nodes - expand component calls within blocks.
   *
   * This is where we handle the main expansion logic. When we encounter
   * a Block, we check each child node to see if it's a component call.
   */
  Block = {
    enter: (node: Node, _parent: Node | null): Node => {
      const block = node as Block

      // Process each node in the block
      const newNodes: Node[] = []

      for (const childNode of block.nodes) {
        if (!childNode) continue

        // Check if this is a component call
        if (this.isComponentCall(childNode)) {
          // Expand the component call
          const expanded = this.expandComponentCall(childNode as Tag)

          // Add all nodes from the expanded block
          newNodes.push(...expanded.nodes)
        } else {
          // Not a component call, keep as-is
          newNodes.push(childNode)
        }
      }

      return {
        ...block,
        nodes: newNodes,
      }
    },
  }

  /**
   * Determines if a node is a component call.
   *
   * A component call is a Tag node with a capitalized name.
   */
  private isComponentCall(node: Node): boolean {
    return isCapitalizedTag(node)
  }

  /**
   * Expands an individual component call.
   *
   * @param callNode - The component call node (Tag with capitalized name)
   * @returns The expanded Block containing the component's content
   */
  private expandComponentCall(callNode: Tag): Block {
    const componentName = callNode.name
    const location = getNodeLocationObject(callNode)

    // Recursion detection
    if (this.callStack.includes(componentName)) {
      throw this.errorHandler.recursiveComponentCall(
        componentName,
        this.callStack,
        location,
      )
    }

    this.callStack.push(componentName)

    try {
      // Get the component definition
      const component = this.registry.get(componentName)
      if (!component) {
        const available = this.registry.getNames()
        throw this.errorHandler.componentNotFound(
          componentName,
          location,
          available,
        )
      }

      // Clone the component body (deep copy)
      const componentBodyCopy = deepCloneBlock(component.body)

      // Extract provided slots from the call site
      const providedSlots = this.slotResolver.extractProvidedSlots(callNode)

      // Extract attributes from the call site
      const attributes = extractAttributes(callNode)

      // Inject attributes into the component body
      this.injectAttributes(componentBodyCopy, attributes, component)

      // Replace slots with provided content
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
   * Injects attributes into the component body.
   *
   * Phase 2/3 implementation:
   * - Phase 3 (with usage): Categorizes attributes into props/attrs and injects both
   * - Phase 2 (no usage): Injects attributes object (backward compatible)
   *
   * Phase 2.5 features:
   * 1. Checks if developer has manually written &attributes anywhere in the component.
   * 2. Otherwise, automatically adds &attributes to the single root element.
   * 3. Warns if there are multiple root elements (fallthrough disabled).
   *
   * @param componentBody - The component body Block (already cloned)
   * @param attributes - Map of attribute names to JavaScript expression values
   * @param component - The component definition (includes usage patterns)
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
      const attributesCode = createAttributesCode(attributes)
      componentBody.nodes.unshift(attributesCode)
    }

    // Phase 2.5: Check if developer has manually written &attributes anywhere
    if (hasAnyAttributeBlocks(componentBody)) {
      // Developer has manually controlled attributes, respect their choice
      return
    }

    // Phase 2.5: Handle automatic attribute fallthrough
    const singleRoot = findSingleRootElement(componentBody)

    if (singleRoot) {
      // Single root element: automatically add &attributes
      if (component.usage) {
        // Phase 3: use '$attrs'
        const fromAttrsSet = new Set(component.usage.fromAttrs)
        const hasExplicitAttrs = singleRoot.attrs?.some((attr) =>
          fromAttrsSet.has(attr.name),
        )

        if (!hasExplicitAttrs) {
          addAttributeFallthrough(singleRoot, '$attrs')
        }
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
  }

  /**
   * Replaces slots within a component body.
   *
   * @param componentBody - The component body Block
   * @param providedSlots - Map of provided slot content
   * @param slotDefinitions - Map of slot definitions within the component
   * @param callLocation - Location of the component call (for error reporting)
   * @returns The Block with slots replaced
   */
  private replaceSlots(
    componentBody: Block,
    providedSlots: Map<string, Block>,
    slotDefinitions: Map<string, SlotDefinition>,
    callLocation: NodeLocation,
  ): Block {
    // Check if provided slots exist in the definition
    for (const [slotName] of providedSlots) {
      if (!slotDefinitions.has(slotName)) {
        // Allow 'default' slot to be provided even if not explicitly defined
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

    // Traverse and replace all slot nodes
    const traverse = (block: Block): void => {
      const newNodes: Node[] = []

      for (const node of block.nodes) {
        if (!node) continue

        if (isSlotDefinitionNode(node)) {
          const slotName = extractSlotName(node as Tag)

          // Get replacement content
          let replacement: Block

          if (providedSlots.has(slotName)) {
            const provided = providedSlots.get(slotName)
            if (provided) {
              replacement = provided
            } else {
              // Use default
              replacement = this.getDefaultSlotBlock(
                slotName,
                slotDefinitions,
                node as Tag,
              )
            }
          } else {
            // Use default
            replacement = this.getDefaultSlotBlock(
              slotName,
              slotDefinitions,
              node as Tag,
            )
          }

          // Replace slot with its content (inline expansion)
          newNodes.push(...replacement.nodes)
        } else {
          newNodes.push(node)
        }
      }

      block.nodes = newNodes

      // Recursively traverse child nodes
      for (const node of block.nodes) {
        if (!node) continue

        // Skip component calls (their slots are provided slots, not definitions)
        if (node.type === 'Tag' && /^[A-Z]/.test((node as Tag).name)) {
          continue
        }

        // Traverse blocks in various node types
        if (node.type === 'Tag' && (node as Tag).block) {
          const tagBlock = (node as Tag).block
          if (tagBlock) traverse(tagBlock)
        } else if (
          node.type === 'InterpolatedTag' &&
          (node as InterpolatedTag).block
        ) {
          const interpolatedBlock = (node as InterpolatedTag).block
          if (interpolatedBlock) traverse(interpolatedBlock)
        } else if (node.type === 'Block') {
          traverse(node as Block)
        } else if (node.type === 'Conditional') {
          const conditional = node as Conditional
          if (conditional.consequent) traverse(conditional.consequent)
          if (conditional.alternate) {
            if (conditional.alternate.type === 'Block') {
              traverse(conditional.alternate)
            } else if (conditional.alternate.type === 'Conditional') {
              // Recursively handle else if
              const handleConditional = (cond: Conditional): void => {
                if (cond.consequent) traverse(cond.consequent)
                if (cond.alternate) {
                  if (cond.alternate.type === 'Block') {
                    traverse(cond.alternate)
                  } else if (cond.alternate.type === 'Conditional') {
                    handleConditional(cond.alternate)
                  }
                }
              }
              handleConditional(conditional.alternate)
            }
          }
        } else if (node.type === 'Each') {
          const each = node as Each
          if (each.block) traverse(each.block)
          if (each.alternate) traverse(each.alternate)
        } else if (node.type === 'Case') {
          const caseNode = node as Case
          if (caseNode.block) traverse(caseNode.block)
        } else if (node.type === 'When') {
          const whenNode = node as When
          if (whenNode.block) traverse(whenNode.block)
        } else if (node.type === 'While') {
          const whileNode = node as While
          if (whileNode.block) traverse(whileNode.block)
        }
      }
    }

    traverse(result)
    return result
  }

  /**
   * Gets the default slot content.
   *
   * @param slotName - The slot name
   * @param slotDefinitions - Map of slot definitions
   * @param slotNode - The slot node (for fallback location)
   * @returns The default slot Block
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

    // Return empty block if no default
    return {
      type: 'Block',
      nodes: [],
      line: slotNode.line,
      column: slotNode.column,
      filename: slotNode.filename,
    }
  }
}
