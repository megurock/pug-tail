/**
 * Detects and extracts $dataFiles declarations from Pug AST
 */

import { parse } from '@babel/parser'
import type { Block, Node } from '@/types/pug'

/**
 * Detects $dataFiles declaration in Pug AST
 * Example: - const $dataFiles = ['data/common.json', 'data/about.json']
 *
 * @param ast - Pug AST
 * @returns Array of file paths to load
 */
export function detectDataFiles(ast: Block): string[] {
  const dataFiles: string[] = []

  function visitNode(node: Node | Block): void {
    if (node.type === 'Code' && !node.buffer) {
      const files = extractDataFilesFromCode(node.val)
      dataFiles.push(...files)
    }

    if ('nodes' in node && node.nodes) {
      for (const child of node.nodes) {
        visitNode(child)
      }
    }

    if ('block' in node && node.block) {
      visitNode(node.block)
    }
  }

  visitNode(ast)
  return dataFiles
}

/**
 * Extracts file paths from $dataFiles declaration
 *
 * @param code - JavaScript code string
 * @returns Array of file paths
 */
function extractDataFilesFromCode(code: string): string[] {
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript'],
    })

    const files: string[] = []

    for (const statement of ast.program.body) {
      if (statement.type === 'VariableDeclaration') {
        for (const declaration of statement.declarations) {
          if (
            declaration.id.type === 'Identifier' &&
            declaration.id.name === '$dataFiles' &&
            declaration.init?.type === 'ArrayExpression'
          ) {
            for (const element of declaration.init.elements) {
              if (element?.type === 'StringLiteral') {
                files.push(element.value)
              }
            }
          }
        }
      }
    }

    return files
  } catch {
    // Ignore parse errors
    return []
  }
}

/**
 * Removes $dataFiles declaration from Pug AST
 *
 * @param ast - Pug AST (mutated in place)
 */
export function removeDataFilesDeclaration(ast: Block): void {
  function visitNode(node: Node | Block): void {
    if ('nodes' in node && node.nodes) {
      node.nodes = node.nodes.filter((child) => {
        if (child.type === 'Code' && !child.buffer) {
          return !isDataFilesDeclaration(child.val)
        }
        return true
      })

      for (const child of node.nodes) {
        visitNode(child)
      }
    }

    if ('block' in node && node.block) {
      visitNode(node.block)
    }
  }

  visitNode(ast)
}

/**
 * Checks if code is a $dataFiles declaration
 *
 * @param code - JavaScript code string
 * @returns True if code declares $dataFiles
 */
function isDataFilesDeclaration(code: string): boolean {
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript'],
    })

    return ast.program.body.some((statement) => {
      if (statement.type === 'VariableDeclaration') {
        return statement.declarations.some((declaration) => {
          return (
            declaration.id.type === 'Identifier' &&
            declaration.id.name === '$dataFiles'
          )
        })
      }
      return false
    })
  } catch {
    return false
  }
}
