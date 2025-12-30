/**
 * Babel integration utilities for Phase 3
 * Extracts variable names from JavaScript destructuring patterns
 */

import { parse } from '@babel/parser'
import type { NodePath } from '@babel/traverse'
import traverseModule from '@babel/traverse'
import type { ObjectProperty, VariableDeclarator } from '@babel/types'

// Handle both ESM and CommonJS exports
// @babel/traverse exports a default function, but the import might be wrapped
const traverse =
  typeof traverseModule === 'function'
    ? traverseModule
    : (traverseModule as { default: typeof traverseModule }).default

/**
 * Extracts variable names from object destructuring in JavaScript code
 * Supports: default values, renaming, and complex patterns
 *
 * @param code - JavaScript code string (e.g., "const { title, count } = props")
 * @returns Array of original property names (not renamed variables)
 *
 * @example
 * extractDestructuredVars("const { title } = $props")
 * // → ['title']
 *
 * @example
 * extractDestructuredVars("const { title = 'Default' } = $props")
 * // → ['title']
 *
 * @example
 * extractDestructuredVars("const { class: className } = $attrs")
 * // → ['class']  ← Returns the original key name
 *
 * @example
 * extractDestructuredVars("const { title = 'Default', class: className = 'card' } = $props")
 * // → ['title', 'class']
 */
export function extractDestructuredVars(code: string): string[] {
  try {
    // Parse JavaScript code into AST
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript'], // Support TypeScript syntax
    })

    const vars: string[] = []

    // Traverse AST to find variable declarations
    traverse(ast, {
      VariableDeclarator(path: NodePath<VariableDeclarator>) {
        // Check if it's object destructuring: const { ... } = ...
        if (path.node.id.type === 'ObjectPattern') {
          // Iterate through each property in the destructuring
          for (const prop of path.node.id.properties) {
            if (prop.type === 'ObjectProperty') {
              // Extract the original key name (not the renamed variable)
              const keyName = getPropertyKeyName(prop)
              if (keyName) {
                vars.push(keyName)
              }
            }
            // Note: RestElement (...rest) is not extracted as it doesn't map to a specific key
          }
        }
      },
    })

    return vars
  } catch (_error) {
    // If parsing fails, return empty array
    // This can happen if the code is not valid JavaScript
    console.warn(
      `Failed to parse JavaScript code: ${code}`,
      _error instanceof Error ? _error.message : _error,
    )
    return []
  }
}

/**
 * Gets the property key name from an ObjectProperty node
 * Handles both Identifier and Literal keys
 *
 * @param prop - ObjectProperty node from Babel AST
 * @returns The property key name
 *
 * @example
 * // Identifier key: { title }
 * prop.key.type === 'Identifier' → 'title'
 *
 * @example
 * // Literal key: { "data-test": dataTest }
 * prop.key.type === 'StringLiteral' → 'data-test'
 */
function getPropertyKeyName(prop: ObjectProperty): string | null {
  if (prop.key.type === 'Identifier') {
    // Normal property: { title }
    return prop.key.name
  }

  if (prop.key.type === 'StringLiteral') {
    // String literal property: { "data-test": dataTest }
    return prop.key.value
  }

  if (prop.key.type === 'NumericLiteral') {
    // Numeric property: { 0: first } (rare but possible)
    return String(prop.key.value)
  }

  // Unknown key type
  return null
}

/**
 * Detects which identifier ($props or $attrs) is being destructured from
 *
 * @param code - JavaScript code string
 * @returns 'props', 'attrs', or null if neither
 *
 * @example
 * detectDestructuringSource("const { title } = $props")
 * // → 'props'
 *
 * @example
 * detectDestructuringSource("const { class: className } = $attrs")
 * // → 'attrs'
 *
 * @example
 * detectDestructuringSource("const { title } = attributes")
 * // → null (not $props or $attrs)
 */
export function detectDestructuringSource(
  code: string,
): 'props' | 'attrs' | null {
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript'],
    })

    let source: 'props' | 'attrs' | null = null

    traverse(ast, {
      VariableDeclarator(path: NodePath<VariableDeclarator>) {
        if (
          path.node.id.type === 'ObjectPattern' &&
          path.node.init?.type === 'Identifier'
        ) {
          const initName = path.node.init.name
          if (initName === '$props') {
            source = 'props'
          } else if (initName === '$attrs') {
            source = 'attrs'
          }
        }
      },
    })

    return source
  } catch (_error) {
    return null
  }
}
