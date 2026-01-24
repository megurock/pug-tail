/**
 * Tests for Traverser
 *
 * Tests the generic AST traversal engine with visitor pattern.
 */

import { beforeEach, describe, expect, test } from 'vitest'
import { Traverser } from '@/core/compiler/traverser'
import type { Visitor } from '@/core/visitors/visitor'
import type { Block, Conditional, Node, Tag } from '@/types/pug'

describe('Traverser', () => {
  let traverser: Traverser

  beforeEach(() => {
    traverser = new Traverser()
  })

  // Helper: Creates a simple Block node
  function createBlock(nodes: Node[] = []): Block {
    return {
      type: 'Block',
      nodes,
      line: 1,
      column: 1,
    }
  }

  // Helper: Creates a simple Tag node
  function createTag(name: string, block?: Block): Tag {
    return {
      type: 'Tag',
      name,
      selfClosing: false,
      block: block ?? createBlock(),
      attrs: [],
      attributeBlocks: [],
      isInline: false,
      line: 1,
      column: 1,
    }
  }

  // Helper: Creates a Conditional node
  function createConditional(
    consequent: Block,
    alternate?: Block | Conditional,
  ): Conditional {
    return {
      type: 'Conditional',
      test: 'true',
      consequent,
      alternate: alternate || null,
      line: 1,
      column: 1,
    }
  }

  describe('traverse()', () => {
    test('should traverse a simple Block node', () => {
      const ast = createBlock()
      const visitor: Visitor = {}

      const result = traverser.traverse(ast, visitor)

      expect(result).toBeDefined()
      expect(result.type).toBe('Block')
    })

    test('should call enter hook when visiting a node', () => {
      const ast = createBlock()
      const enterCalls: string[] = []

      const visitor: Visitor = {
        Block: {
          enter(node) {
            enterCalls.push(node.type)
            return undefined
          },
        },
      }

      traverser.traverse(ast, visitor)

      expect(enterCalls).toEqual(['Block'])
    })

    test('should call exit hook after visiting a node', () => {
      const ast = createBlock()
      const calls: string[] = []

      const visitor: Visitor = {
        Block: {
          enter() {
            calls.push('enter')
            return undefined
          },
          exit() {
            calls.push('exit')
            return undefined
          },
        },
      }

      traverser.traverse(ast, visitor)

      expect(calls).toEqual(['enter', 'exit'])
    })

    test('should visit nodes in depth-first order', () => {
      // Create a tree: Block > Tag > Block
      const innerBlock = createBlock()
      const tag = createTag('div', innerBlock)
      const outerBlock = createBlock([tag])

      const visitOrder: string[] = []

      const visitor: Visitor = {
        Block: {
          enter(_node) {
            visitOrder.push(`Block:enter`)
            return undefined
          },
        },
        Tag: {
          enter(node) {
            visitOrder.push(`Tag:enter:${(node as Tag).name}`)
            return undefined
          },
        },
      }

      traverser.traverse(outerBlock, visitor)

      // Should visit outer block, then tag, then inner block
      expect(visitOrder).toEqual([
        'Block:enter',
        'Tag:enter:div',
        'Block:enter',
      ])
    })

    test('should call enter before children and exit after children', () => {
      const innerBlock = createBlock()
      const tag = createTag('div', innerBlock)
      const outerBlock = createBlock([tag])

      const calls: string[] = []

      const visitor: Visitor = {
        Block: {
          enter(_node) {
            calls.push('Block:enter')
            return undefined
          },
          exit(_node) {
            calls.push('Block:exit')
            return undefined
          },
        },
        Tag: {
          enter(_node) {
            calls.push('Tag:enter')
            return undefined
          },
          exit(_node) {
            calls.push('Tag:exit')
            return undefined
          },
        },
      }

      traverser.traverse(outerBlock, visitor)

      expect(calls).toEqual([
        'Block:enter', // Outer block enter
        'Tag:enter', // Tag enter
        'Block:enter', // Inner block enter
        'Block:exit', // Inner block exit
        'Tag:exit', // Tag exit
        'Block:exit', // Outer block exit
      ])
    })

    test('should pass parent node to visitor methods', () => {
      const tag = createTag('div')
      const block = createBlock([tag])

      let tagParent: Node | null = null

      const visitor: Visitor = {
        Tag: {
          enter(_node, parent) {
            tagParent = parent
            return undefined
          },
        },
      }

      traverser.traverse(block, visitor)

      expect(tagParent).toBe(block)
    })

    test('should pass null as parent for root node', () => {
      const block = createBlock()

      let rootParent: Node | null | undefined

      const visitor: Visitor = {
        Block: {
          enter(_node, parent) {
            if (rootParent === undefined) {
              rootParent = parent
            }
            return undefined
          },
        },
      }

      traverser.traverse(block, visitor)

      expect(rootParent).toBe(null)
    })
  })

  describe('node replacement', () => {
    test('should replace node when enter returns a new node', () => {
      const tag = createTag('div')
      const block = createBlock([tag])

      const visitor: Visitor = {
        Tag: {
          enter(_node) {
            // Replace div with span
            return createTag('span')
          },
        },
      }

      const result = traverser.traverse(block, visitor) as Block

      expect(result.nodes).toHaveLength(1)
      expect((result.nodes[0] as Tag).name).toBe('span')
    })

    test('should replace node when exit returns a new node', () => {
      const tag = createTag('div')
      const block = createBlock([tag])

      const visitor: Visitor = {
        Tag: {
          exit(_node) {
            // Replace div with span
            return createTag('span')
          },
        },
      }

      const result = traverser.traverse(block, visitor) as Block

      expect(result.nodes).toHaveLength(1)
      expect((result.nodes[0] as Tag).name).toBe('span')
    })

    test('should use node from enter when traversing children', () => {
      const innerBlock = createBlock()
      const tag = createTag('div', innerBlock)
      const outerBlock = createBlock([tag])

      const visitedTags: string[] = []

      const visitor: Visitor = {
        Tag: {
          enter(node) {
            visitedTags.push((node as Tag).name)
            // Replace div with span
            return createTag('span', (node as Tag).block)
          },
        },
      }

      const result = traverser.traverse(outerBlock, visitor) as Block

      // Should visit 'div' then transform it to 'span'
      expect(visitedTags).toEqual(['div'])
      expect((result.nodes[0] as Tag).name).toBe('span')
    })
  })

  describe('conditional nodes', () => {
    test('should traverse Conditional consequent and alternate', () => {
      const consequentBlock = createBlock([createTag('div')])
      const alternateBlock = createBlock([createTag('span')])
      const conditional = createConditional(consequentBlock, alternateBlock)
      const ast = createBlock([conditional])

      const visitedTags: string[] = []

      const visitor: Visitor = {
        Tag: {
          enter(node) {
            visitedTags.push((node as Tag).name)
            return undefined
          },
        },
      }

      traverser.traverse(ast, visitor)

      expect(visitedTags).toEqual(['div', 'span'])
    })

    test('should handle else if (nested Conditional)', () => {
      const firstBlock = createBlock([createTag('div')])
      const secondBlock = createBlock([createTag('span')])
      const elseIfConditional = createConditional(secondBlock)
      const ifConditional = createConditional(firstBlock, elseIfConditional)
      const ast = createBlock([ifConditional])

      const visitedTags: string[] = []

      const visitor: Visitor = {
        Tag: {
          enter(node) {
            visitedTags.push((node as Tag).name)
            return undefined
          },
        },
      }

      traverser.traverse(ast, visitor)

      expect(visitedTags).toEqual(['div', 'span'])
    })
  })

  describe('multiple children', () => {
    test('should visit all children in a Block', () => {
      const tag1 = createTag('div')
      const tag2 = createTag('span')
      const tag3 = createTag('p')
      const block = createBlock([tag1, tag2, tag3])

      const visitedTags: string[] = []

      const visitor: Visitor = {
        Tag: {
          enter(node) {
            visitedTags.push((node as Tag).name)
            return undefined
          },
        },
      }

      traverser.traverse(block, visitor)

      expect(visitedTags).toEqual(['div', 'span', 'p'])
    })

    test('should preserve node order after transformation', () => {
      const tag1 = createTag('div')
      const tag2 = createTag('span')
      const block = createBlock([tag1, tag2])

      const visitor: Visitor = {
        Tag: {
          enter(node) {
            const tagNode = node as Tag
            // Uppercase the tag name
            return createTag(tagNode.name.toUpperCase(), tagNode.block)
          },
        },
      }

      const result = traverser.traverse(block, visitor) as Block

      expect(result.nodes).toHaveLength(2)
      expect((result.nodes[0] as Tag).name).toBe('DIV')
      expect((result.nodes[1] as Tag).name).toBe('SPAN')
    })
  })

  describe('empty visitor', () => {
    test('should not throw with empty visitor', () => {
      const ast = createBlock([createTag('div')])
      const visitor: Visitor = {}

      expect(() => {
        traverser.traverse(ast, visitor)
      }).not.toThrow()
    })

    test('should return original AST when visitor does nothing', () => {
      const tag = createTag('div')
      const ast = createBlock([tag])
      const visitor: Visitor = {}

      const result = traverser.traverse(ast, visitor) as Block

      expect(result.nodes).toHaveLength(1)
      expect((result.nodes[0] as Tag).name).toBe('div')
    })
  })

  describe('complex AST traversal', () => {
    test('should handle deeply nested structures', () => {
      // Create: Block > Tag > Block > Tag > Block
      const level3Block = createBlock()
      const level2Tag = createTag('span', level3Block)
      const level2Block = createBlock([level2Tag])
      const level1Tag = createTag('div', level2Block)
      const level1Block = createBlock([level1Tag])

      const depth: number[] = []
      let currentDepth = 0

      const visitor: Visitor = {
        Block: {
          enter() {
            currentDepth++
            depth.push(currentDepth)
            return undefined
          },
          exit() {
            currentDepth--
            return undefined
          },
        },
      }

      traverser.traverse(level1Block, visitor)

      // Should visit 3 blocks at depths 1, 2, 3
      expect(depth).toEqual([1, 2, 3])
    })
  })
})
