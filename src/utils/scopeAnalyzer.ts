/**
 * Scope Analyzer
 *
 * Analyzes component scope to detect external variable references.
 * This is used to enforce component scope isolation.
 */

import * as parser from '@babel/parser'
import traverseModule from '@babel/traverse'
import * as t from '@babel/types'
import type { ScopeAnalysisResult, ValidationConfig } from '@/types'
import type {
  Block,
  Case,
  Code,
  Conditional,
  Each,
  Node,
  Tag,
} from '@/types/pug'

// Handle @babel/traverse default export for both ESM and CJS
const traverse =
  typeof traverseModule === 'function'
    ? traverseModule
    : (traverseModule as { default: typeof traverseModule }).default

/**
 * Standard JavaScript globals that are always allowed.
 */
const ALLOWED_GLOBALS = new Set([
  // JavaScript standard objects
  'console',
  'Math',
  'Date',
  'JSON',
  'Object',
  'Array',
  'String',
  'Number',
  'Boolean',
  'RegExp',
  'Error',
  'Promise',
  'Set',
  'Map',
  'WeakMap',
  'WeakSet',
  'Symbol',
  'BigInt',
  'Proxy',
  'Reflect',

  // Global values
  'undefined',
  'null',
  'true',
  'false',
  'NaN',
  'Infinity',

  // Environment-agnostic global
  'globalThis',

  // Pug built-ins
  'attributes',
  'block',

  // pug-tail special keywords
  '$props',
  '$attrs',
])

/**
 * Analyzes the scope of a component body to detect external variable references.
 *
 * @param componentBody - The component body Block to analyze.
 * @param config - Validation configuration (for custom allowed globals).
 * @returns Scope analysis result containing declared variables, referenced variables, and external references.
 */
export function analyzeComponentScope(
  componentBody: Block,
  config: ValidationConfig = {},
): ScopeAnalysisResult {
  const result: ScopeAnalysisResult = {
    declaredVariables: new Set(),
    referencedVariables: new Set(),
    propsVariables: new Set(),
    attrsVariables: new Set(),
    slotVariables: new Set(),
    externalReferences: new Set(),
  }

  // Walk through all nodes in the component body
  walkBlock(componentBody, result)

  // Calculate external references:
  // Any referenced variable that is not declared, from props, from attrs, a global, or custom allowed global
  for (const varName of result.referencedVariables) {
    if (
      !result.declaredVariables.has(varName) &&
      !result.propsVariables.has(varName) &&
      !result.attrsVariables.has(varName) &&
      !result.slotVariables.has(varName) &&
      !ALLOWED_GLOBALS.has(varName) &&
      !(config.allowedGlobals || []).includes(varName)
    ) {
      result.externalReferences.add(varName)
    }
  }

  return result
}

/**
 * Walks through a Block and collects variable information.
 */
function walkBlock(block: Block, result: ScopeAnalysisResult): void {
  for (const node of block.nodes) {
    walkNode(node, result)
  }
}

/**
 * Walks through a Node and collects variable information.
 */
function walkNode(node: Node, result: ScopeAnalysisResult): void {
  if (node.type === 'Code') {
    analyzeCodeNode(node as Code, result)
  } else if (node.type === 'Tag') {
    const tag = node as Tag
    if (tag.block) {
      walkBlock(tag.block, result)
    }
  } else if (node.type === 'Block') {
    walkBlock(node as Block, result)
  } else if (node.type === 'Conditional') {
    const conditional = node as Conditional
    if (conditional.test) {
      // Analyze the test expression
      analyzeExpression(conditional.test, result)
    }
    if (conditional.consequent) {
      walkBlock(conditional.consequent, result)
    }
    if (conditional.alternate) {
      walkNode(conditional.alternate, result)
    }
  } else if (node.type === 'Each') {
    const each = node as Each
    // Each loop creates its own scope for loop variables
    // We need to track these as declared variables
    if (each.val) {
      result.declaredVariables.add(each.val)
    }
    if (each.key) {
      result.declaredVariables.add(each.key)
    }
    // Analyze the object being iterated
    if (each.obj) {
      analyzeExpression(each.obj, result)
    }
    if (each.block) {
      walkBlock(each.block, result)
    }
    if (each.alternate) {
      walkBlock(each.alternate, result)
    }
  } else if (node.type === 'Case') {
    const caseNode = node as Case
    analyzeExpression(caseNode.expr, result)
    if (caseNode.block) {
      walkBlock(caseNode.block, result)
    }
  }
}

/**
 * Analyzes a Code node to extract variable declarations and references.
 */
function analyzeCodeNode(code: Code, result: ScopeAnalysisResult): void {
  const codeValue = code.val.trim()

  // Special handling for $props and $attrs destructuring
  if (codeValue.includes('$props')) {
    extractPropsVariables(codeValue, result)
  }
  if (codeValue.includes('$attrs')) {
    extractAttrsVariables(codeValue, result)
  }

  // Try to parse as JavaScript and extract identifiers
  try {
    analyzeJavaScriptCode(codeValue, result)
  } catch {
    // If parsing fails, use fallback simple extraction
    extractIdentifiersSimple(codeValue, result)
  }
}

/**
 * Analyzes JavaScript code using Babel parser.
 */
function analyzeJavaScriptCode(
  code: string,
  result: ScopeAnalysisResult,
): void {
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['typescript'],
  })

  traverse(ast, {
    VariableDeclarator(path) {
      // Extract declared variable names
      if (t.isIdentifier(path.node.id)) {
        result.declaredVariables.add(path.node.id.name)
      } else if (t.isObjectPattern(path.node.id)) {
        // Handle destructuring: const { a, b } = ...
        for (const prop of path.node.id.properties) {
          if (t.isObjectProperty(prop) && t.isIdentifier(prop.value)) {
            result.declaredVariables.add(prop.value.name)
          } else if (t.isRestElement(prop) && t.isIdentifier(prop.argument)) {
            result.declaredVariables.add(prop.argument.name)
          }
        }
      } else if (t.isArrayPattern(path.node.id)) {
        // Handle array destructuring: const [a, b] = ...
        for (const element of path.node.id.elements) {
          if (element && t.isIdentifier(element)) {
            result.declaredVariables.add(element.name)
          }
        }
      }
    },
    // biome-ignore lint/suspicious/noExplicitAny: Babel traverse path type is complex
    Identifier(path: any) {
      // Skip if this is a binding (declaration) identifier
      if (path.isBindingIdentifier()) {
        return
      }

      const parent = path.parent as t.Node
      const node = path.node as t.Identifier

      // Skip property names in object literals
      if (
        t.isObjectProperty(parent) &&
        parent.key === node &&
        !parent.computed
      ) {
        return
      }

      // Skip property names in member expressions
      if (
        t.isMemberExpression(parent) &&
        parent.property === node &&
        !parent.computed
      ) {
        return
      }

      // This is a referenced identifier
      result.referencedVariables.add(node.name)
    },
  })
}

/**
 * Extracts variables from $props destructuring.
 * Example: const { title, content } = $props
 * Example with defaults: const { title, count = 0 } = $props
 */
function extractPropsVariables(
  code: string,
  result: ScopeAnalysisResult,
): void {
  // Match destructuring patterns: const { a, b } = $props
  const destructureMatch = code.match(/const\s+{([^}]+)}\s*=\s*\$props/)
  if (!destructureMatch) {
    return
  }

  const variablesStr = destructureMatch[1]
  if (!variablesStr) {
    return
  }

  const variables = variablesStr
    .split(',')
    .map((v) => {
      // Handle renaming and defaults: { a: b = default } -> extract 'b'
      // Handle defaults: { a = default } -> extract 'a'
      const v_trimmed = v.trim()

      // Remove default value: "count = 0" -> "count"
      const withoutDefault = v_trimmed.split('=')[0]?.trim()
      if (!withoutDefault) return undefined

      // Handle renaming: "class: className" -> "className"
      const parts = withoutDefault.split(':')
      return parts.length > 1 ? parts[1]?.trim() : parts[0]?.trim()
    })
    .filter((v): v is string => v !== undefined && v.length > 0)

  for (const varName of variables) {
    result.propsVariables.add(varName)
    result.declaredVariables.add(varName)
  }
}

/**
 * Extracts variables from $attrs destructuring.
 * Example: const { class: className } = $attrs
 * Example with defaults: const { class: className = "default" } = $attrs
 */
function extractAttrsVariables(
  code: string,
  result: ScopeAnalysisResult,
): void {
  // Match destructuring patterns: const { a, b } = $attrs
  const destructureMatch = code.match(/const\s+{([^}]+)}\s*=\s*\$attrs/)
  if (!destructureMatch) {
    return
  }

  const variablesStr = destructureMatch[1]
  if (!variablesStr) {
    return
  }

  const variables = variablesStr
    .split(',')
    .map((v) => {
      // Handle renaming and defaults: { a: b = default } -> extract 'b'
      // Handle defaults: { a = default } -> extract 'a'
      const v_trimmed = v.trim()

      // Remove default value: "className = 'card'" -> "className"
      const withoutDefault = v_trimmed.split('=')[0]?.trim()
      if (!withoutDefault) return undefined

      // Handle renaming: "class: className" -> "className"
      const parts = withoutDefault.split(':')
      return parts.length > 1 ? parts[1]?.trim() : parts[0]?.trim()
    })
    .filter((v): v is string => v !== undefined && v.length > 0)

  for (const varName of variables) {
    result.attrsVariables.add(varName)
    result.declaredVariables.add(varName)
  }
}

/**
 * Fallback: Simple regex-based identifier extraction.
 */
function extractIdentifiersSimple(
  code: string,
  result: ScopeAnalysisResult,
): void {
  // Extract identifiers using a simple regex
  const identifierRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g
  let match = identifierRegex.exec(code)

  while (match !== null) {
    const identifier = match[1]
    if (identifier) {
      result.referencedVariables.add(identifier)
    }
    match = identifierRegex.exec(code)
  }

  // Detect variable declarations
  const declarationRegex = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g
  match = declarationRegex.exec(code)
  while (match !== null) {
    const identifier = match[1]
    if (identifier) {
      result.declaredVariables.add(identifier)
    }
    match = declarationRegex.exec(code)
  }
}

/**
 * Analyzes a Pug expression string to extract referenced identifiers.
 */
function analyzeExpression(expr: string, result: ScopeAnalysisResult): void {
  try {
    analyzeJavaScriptCode(expr, result)
  } catch {
    extractIdentifiersSimple(expr, result)
  }
}

/**
 * Checks if an identifier is allowed (not an external reference).
 *
 * @param name - The identifier name to check.
 * @param scopeAnalysis - The scope analysis result.
 * @param config - The validation configuration.
 * @returns True if the identifier is allowed, false otherwise.
 */
export function isAllowedIdentifier(
  name: string,
  scopeAnalysis: ScopeAnalysisResult,
  config: ValidationConfig,
): boolean {
  return (
    ALLOWED_GLOBALS.has(name) ||
    scopeAnalysis.declaredVariables.has(name) ||
    scopeAnalysis.propsVariables.has(name) ||
    scopeAnalysis.attrsVariables.has(name) ||
    scopeAnalysis.slotVariables.has(name) ||
    (config.allowedGlobals || []).includes(name)
  )
}
