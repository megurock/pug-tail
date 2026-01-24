/**
 * ComponentDetectorVisitor
 *
 * Detects component definitions in the AST and registers them.
 *
 * This visitor scans for component definition nodes (tags with name 'component')
 * and registers them with the ComponentRegistry. It also handles Include and
 * Extends nodes to detect components in included/extended files.
 */

import type { Block, Node, Tag } from '@/types/pug'
import {
  extractComponentDefinition,
  isComponentDefinitionNode,
} from '@/utils/componentDetector'
import { analyzeComponentScope } from '@/utils/scopeAnalyzer'
import { detectAttributeUsage } from '@/utils/usageDetector'
import type { ComponentRegistry } from '../componentRegistry'
import type { ErrorHandler } from '../errorHandler'

/**
 * Options for ComponentDetectorVisitor
 */
export interface ComponentDetectorOptions {
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
 * A visitor that detects and registers component definitions.
 *
 * This visitor:
 * 1. Detects component definition nodes
 * 2. Extracts component metadata (name, slots, body)
 * 3. Analyzes usage patterns (props/attrs)
 * 4. Validates scope isolation
 * 5. Registers components with the registry
 * 6. Recursively processes Include/Extends nodes
 *
 * @example
 * ```typescript
 * const registry = new ComponentRegistry()
 * const errorHandler = new ErrorHandler()
 * const visitor = new ComponentDetectorVisitor(registry, errorHandler)
 * const traverser = new Traverser()
 * traverser.traverse(ast, visitor)
 * // Components are now registered in the registry
 * ```
 */
export class ComponentDetectorVisitor {
  constructor(
    private registry: ComponentRegistry,
    private errorHandler: ErrorHandler,
    private options: ComponentDetectorOptions = {},
  ) {}

  /**
   * Handle Tag nodes - detect component definitions.
   */
  Tag = {
    enter: (node: Node, _parent: Node | null): Node | undefined => {
      if (!isComponentDefinitionNode(node)) {
        return undefined
      }

      // Extract component definition
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
        this.options.validation,
      )
      definition.scopeAnalysis = scopeAnalysis

      // Validate scope isolation (default: strict mode)
      const mode = this.options.validation?.scopeIsolation ?? 'error'
      if (mode !== 'off' && scopeAnalysis.externalReferences.size > 0) {
        for (const varName of scopeAnalysis.externalReferences) {
          const error = this.errorHandler.externalVariableReference(
            varName,
            definition.name,
            definition.location,
          )

          if (mode === 'error') {
            throw error // Strict mode: throw error
          }
          // Warn mode: log warning
          console.warn(error.message)
        }
      }

      // Register the component
      this.registry.register(definition)

      // Debug: Log registered component
      if (this.options.debug) {
        console.log(`[DEBUG] Registered component: ${definition.name}`)
        console.log(
          `  - Slots: ${Array.from(definition.slots.keys()).join(', ') || 'none'}`,
        )
        console.log(
          `  - Location: ${definition.location.filename}:${definition.location.line}`,
        )
      }

      return undefined
    },
  }

  /**
   * Handle Include nodes - recursively detect components in included files.
   *
   * Note: We don't need to manually traverse the included AST here because
   * the Traverser already does this automatically in traverseInclude().
   * This enter hook exists only as a placeholder and for potential future use.
   */
  Include = {
    enter: (_node: Node, _parent: Node | null): Node | undefined => {
      // The Traverser handles Include.file.ast traversal automatically
      // No additional action needed here
      return undefined
    },
  }

  /**
   * Handle Extends nodes - recursively detect components in extended files.
   *
   * Note: We don't need to manually traverse the extended AST here because
   * the Traverser already does this automatically in traverseExtends().
   * This enter hook exists only as a placeholder and for potential future use.
   */
  Extends = {
    enter: (_node: Node, _parent: Node | null): Node | undefined => {
      // The Traverser handles Extends.file.ast traversal automatically
      // No additional action needed here
      return undefined
    },
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
        const conditional = node as import('@/types/pug').Conditional
        if (conditional.consequent) fixBlock(conditional.consequent)
        if (conditional.alternate) {
          if (conditional.alternate.type === 'Block') {
            fixBlock(conditional.alternate as import('@/types/pug').Block)
          } else if (conditional.alternate.type === 'Conditional') {
            fixNode(conditional.alternate as import('@/types/pug').Conditional)
          }
        }
      } else if (node.type === 'Each') {
        const each = node as import('@/types/pug').Each
        if (each.block) fixBlock(each.block)
        if (each.alternate) fixBlock(each.alternate)
      } else if (node.type === 'Case') {
        const caseNode = node as import('@/types/pug').Case
        if (caseNode.block) fixBlock(caseNode.block)
      } else if (node.type === 'When') {
        const whenNode = node as import('@/types/pug').When
        if (whenNode.block) fixBlock(whenNode.block)
      } else if (node.type === 'While') {
        const whileNode = node as import('@/types/pug').While
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
}
