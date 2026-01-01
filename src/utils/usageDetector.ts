/**
 * Usage pattern detector for Phase 3
 * Detects which attributes are used from props/attrs in a component
 */

import type { ComponentUsage } from '@/types'
import type { Block, Code } from '@/types/pug'
import {
  detectDestructuringSource,
  extractDestructuredVars,
} from './babelHelpers'

/**
 * Detects which attributes are used from props/attrs in a component body
 *
 * This function analyzes the component body to find:
 * - `const { ... } = props` statements
 * - `const { ... } = attrs` statements
 *
 * @param componentBody - The component body Block node
 * @returns ComponentUsage object with fromProps and fromAttrs arrays
 *
 * @example
 * // Component:
 * // component Card()
 * //   - const { title, count } = props
 * //   - const { class: className } = attrs
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

      // Detect which identifier (props or attrs) is being destructured from
      const source = detectDestructuringSource(code)

      if (source === 'props') {
        // Extract variable names from props destructuring
        const vars = extractDestructuredVars(code)
        fromProps.push(...vars)
      } else if (source === 'attrs') {
        // Extract variable names from attrs destructuring
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
        walkNodes(node.alternate, callback)
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
 * Creates JavaScript code for props object
 *
 * @param props - Map of property names to values
 * @returns Code node with `const props = {...}` statement
 *
 * @example
 * createPropsCode(new Map([['title', '"Hello"'], ['count', '5']]))
 * // → { type: 'Code', val: 'const props = {"title": "Hello", "count": 5}', ... }
 */
export function createPropsCode(props: Map<string, string>): Code {
  const pairs = Array.from(props.entries())
    .map(([key, value]) => `"${key}": ${value}`)
    .join(', ')

  return {
    type: 'Code',
    val: `const props = {${pairs}}`,
    buffer: false,
    mustEscape: false,
    isInline: false,
    line: 0,
    column: 0,
    filename: '',
  }
}

/**
 * Creates JavaScript code for attrs object
 *
 * @param attrs - Map of attribute names to values
 * @returns Code node with `const attrs = {...}` statement
 *
 * @example
 * createAttrsCode(new Map([['class', '"my-card"'], ['id', '"card-1"']]))
 * // → { type: 'Code', val: 'const attrs = {"class": "my-card", "id": "card-1"}', ... }
 */
export function createAttrsCode(attrs: Map<string, string>): Code {
  const pairs = Array.from(attrs.entries())
    .map(([key, value]) => `"${key}": ${value}`)
    .join(', ')

  return {
    type: 'Code',
    val: `const attrs = {${pairs}}`,
    buffer: false,
    mustEscape: false,
    isInline: false,
    line: 0,
    column: 0,
    filename: '',
  }
}
