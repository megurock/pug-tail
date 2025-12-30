/**
 * Usage pattern detector for Phase 3
 * Detects which attributes are used from props/attrs in a component
 */

import type { ComponentUsage } from '@/types'
import type { Block, Code, Conditional } from '@/types/pug'
import {
  detectDestructuringSource,
  extractDestructuredVars,
} from './babelHelpers'

/**
 * Detects which attributes are used from $props/$attrs in a component body
 *
 * This function analyzes the component body to find:
 * - `const { ... } = $props` statements
 * - `const { ... } = $attrs` statements
 *
 * @param componentBody - The component body Block node
 * @returns ComponentUsage object with fromProps and fromAttrs arrays
 *
 * @example
 * // Component:
 * // component Card()
 * //   - const { title, count } = $props
 * //   - const { class: className } = $attrs
 *
 * detectAttributeUsage(componentBody)
 * // → { fromProps: ['title', 'count'], fromAttrs: ['class'] }
 */
export function detectAttributeUsage(componentBody: Block): ComponentUsage {
  const fromProps: string[] = []
  const fromAttrs: string[] = []

  // Walk through all nodes in the component body
  walkNodes(componentBody, (node) => {
    if (node.type === 'Code') {
      const code = node.val

      // Detect which identifier ($props or $attrs) is being destructured from
      const source = detectDestructuringSource(code)

      if (source === 'props') {
        // Extract variable names from $props destructuring
        const vars = extractDestructuredVars(code)
        fromProps.push(...vars)
      } else if (source === 'attrs') {
        // Extract variable names from $attrs destructuring
        const vars = extractDestructuredVars(code)
        fromAttrs.push(...vars)
      }
    }
  })

  // Remove duplicates (in case the same property is destructured multiple times)
  return {
    fromProps: Array.from(new Set(fromProps)),
    fromAttrs: Array.from(new Set(fromAttrs)),
  }
}

/**
 * Walks through all nodes in a Block, including nested blocks
 *
 * @param block - The Block node to walk
 * @param callback - Function to call for each node
 */
function walkNodes(
  block: Block,
  callback: (node: Block['nodes'][number]) => void,
): void {
  if (!block.nodes) return

  for (const node of block.nodes) {
    callback(node)

    // Recursively walk nested blocks
    if ('block' in node && node.block) {
      walkNodes(node.block, callback)
    }

    // Handle Conditional nodes (if/else)
    if (node.type === 'Conditional') {
      if (node.consequent) {
        walkNodes(node.consequent, callback)
      }
      if (node.alternate) {
        if (node.alternate.type === 'Block') {
          walkNodes(node.alternate, callback)
        } else if (node.alternate.type === 'Conditional') {
          // Handle else if: recursively walk the Conditional
          const conditionalNode = node.alternate as Conditional
          if (conditionalNode.consequent) {
            walkNodes(conditionalNode.consequent, callback)
          }
          if (conditionalNode.alternate) {
            // Recursively handle nested else if or else
            walkConditional(conditionalNode)
          }
        }
      }
    }

    function walkConditional(conditional: Conditional): void {
      if (conditional.consequent) {
        walkNodes(conditional.consequent, callback)
      }
      if (conditional.alternate) {
        if (conditional.alternate.type === 'Block') {
          walkNodes(conditional.alternate, callback)
        } else if (conditional.alternate.type === 'Conditional') {
          walkConditional(conditional.alternate)
        }
      }
    }

    // Handle Each nodes
    if (node.type === 'Each' && node.block) {
      walkNodes(node.block, callback)
    }

    // Handle Case/When nodes
    if (node.type === 'Case') {
      if (node.block) {
        walkNodes(node.block, callback)
      }
    }
  }
}

/**
 * Checks if a value is a JavaScript variable reference (not a literal)
 * @param value - The value to check
 * @returns true if it looks like a variable reference
 */
export function isVariableReference(value: string): boolean {
  const trimmed = value.trim()

  // Exclude boolean literals
  if (trimmed === 'true' || trimmed === 'false') return false

  // Exclude null and undefined
  if (trimmed === 'null' || trimmed === 'undefined') return false

  // Exclude pug-tail reserved identifiers
  if (trimmed === '$props' || trimmed === '$attrs') return false

  // Exclude numeric literals (integers and floats)
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return false

  // Exclude string literals (single or double quotes)
  if (/^["'].*["']$/.test(trimmed)) return false

  // Exclude template literals
  if (/^`.*`$/.test(trimmed)) return false

  // Valid variable name pattern
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(trimmed)
}

/**
 * Creates JavaScript code for props object
 * Simple object literal - TDZ handling is done at the block level
 *
 * @param props - Map of property names to values
 * @param paramPrefix - Optional prefix for renamed parameters (for TDZ avoidance)
 * @returns Array of Code nodes for props initialization
 */
export function createPropsCode(
  props: Map<string, string>,
  paramPrefix?: string,
): Code[] {
  const pairs = Array.from(props.entries())
    .map(([key, value]) => {
      // If paramPrefix is provided and value is a variable reference, use renamed param
      if (paramPrefix && isVariableReference(value)) {
        return `"${key}": ${paramPrefix}${value.trim()}`
      }
      return `"${key}": ${value}`
    })
    .join(', ')

  return [
    {
      type: 'Code',
      val: `const $props = {${pairs}}`,
      buffer: false,
      mustEscape: false,
      isInline: false,
      line: 0,
      column: 0,
      filename: '',
    },
  ]
}

/**
 * Creates JavaScript code for attrs object
 * Simple object literal - TDZ handling is done at the block level
 *
 * @param attrs - Map of attribute names to values
 * @param paramPrefix - Optional prefix for renamed parameters (for TDZ avoidance)
 * @returns Array of Code nodes for attrs initialization
 */
export function createAttrsCode(
  attrs: Map<string, string>,
  paramPrefix?: string,
): Code[] {
  const pairs = Array.from(attrs.entries())
    .map(([key, value]) => {
      // If paramPrefix is provided and value is a variable reference, use renamed param
      if (paramPrefix && isVariableReference(value)) {
        return `"${key}": ${paramPrefix}${value.trim()}`
      }
      return `"${key}": ${value}`
    })
    .join(', ')

  return [
    {
      type: 'Code',
      val: `const $attrs = {${pairs}}`,
      buffer: false,
      mustEscape: false,
      isInline: false,
      line: 0,
      column: 0,
      filename: '',
    },
  ]
}

/**
 * Extracts all variable references from props and attrs maps
 *
 * @param props - Map of property names to values
 * @param attrs - Map of attribute names to values
 * @returns Set of variable names that are referenced
 */
export function extractReferencedVariables(
  props: Map<string, string>,
  attrs: Map<string, string>,
): Set<string> {
  const vars = new Set<string>()

  for (const value of props.values()) {
    if (isVariableReference(value)) {
      vars.add(value.trim())
    }
  }

  for (const value of attrs.values()) {
    if (isVariableReference(value)) {
      vars.add(value.trim())
    }
  }

  return vars
}
