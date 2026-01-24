/**
 * Tests for DefinitionRemoverVisitor
 */

import { beforeEach, describe, expect, test } from 'vitest'
import { Traverser } from '@/core/compiler/traverser'
import { DefinitionRemoverVisitor } from '@/core/visitors/definitionRemover'
import type { Block, Tag } from '@/types/pug'

describe('DefinitionRemoverVisitor', () => {
  let traverser: Traverser
  let visitor: DefinitionRemoverVisitor

  beforeEach(() => {
    traverser = new Traverser()
    visitor = new DefinitionRemoverVisitor()
  })

  // Helper: Creates a Block node
  function createBlock(nodes: import('@/types/pug').Node[] = []): Block {
    return {
      type: 'Block',
      nodes,
      line: 1,
      column: 1,
    }
  }

  // Helper: Creates a Tag node
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

  describe('component definition removal', () => {
    test('should remove component definition nodes', () => {
      // Create AST with a component definition
      const componentDef = createTag('component', createBlock())
      const ast = createBlock([componentDef])

      const result = traverser.traverse(ast, visitor) as Block

      // Component definition should be removed
      expect(result.nodes).toHaveLength(0)
    })

    test('should keep non-component nodes', () => {
      const regularTag = createTag('div')
      const ast = createBlock([regularTag])

      const result = traverser.traverse(ast, visitor) as Block

      // Regular tag should be kept
      expect(result.nodes).toHaveLength(1)
      expect((result.nodes[0] as Tag).name).toBe('div')
    })

    test('should remove only component definitions, keep others', () => {
      const componentDef = createTag('component', createBlock())
      const regularTag1 = createTag('div')
      const regularTag2 = createTag('span')

      const ast = createBlock([regularTag1, componentDef, regularTag2])

      const result = traverser.traverse(ast, visitor) as Block

      // Should have 2 nodes (component removed)
      expect(result.nodes).toHaveLength(2)
      expect((result.nodes[0] as Tag).name).toBe('div')
      expect((result.nodes[1] as Tag).name).toBe('span')
    })

    test('should remove multiple component definitions', () => {
      const componentDef1 = createTag('component', createBlock())
      const componentDef2 = createTag('component', createBlock())
      const regularTag = createTag('div')

      const ast = createBlock([componentDef1, regularTag, componentDef2])

      const result = traverser.traverse(ast, visitor) as Block

      // Should have 1 node (both components removed)
      expect(result.nodes).toHaveLength(1)
      expect((result.nodes[0] as Tag).name).toBe('div')
    })
  })

  describe('nested components', () => {
    test('should remove nested component definitions', () => {
      // Create nested structure with component definition inside
      const componentDef = createTag('component', createBlock())
      const innerBlock = createBlock([componentDef])
      const outerTag = createTag('div', innerBlock)
      const ast = createBlock([outerTag])

      const result = traverser.traverse(ast, visitor) as Block

      // Outer div should remain
      expect(result.nodes).toHaveLength(1)
      const outerTagResult = result.nodes[0] as Tag
      expect(outerTagResult.name).toBe('div')

      // Inner component should be removed
      expect(outerTagResult.block?.nodes).toHaveLength(0)
    })

    test('should handle deeply nested component definitions', () => {
      // Create: Block > Tag > Block > Component > Block > Tag
      const deepTag = createTag('span')
      const deepBlock = createBlock([deepTag])
      const componentDef = createTag('component', deepBlock)
      const middleBlock = createBlock([componentDef])
      const middleTag = createTag('div', middleBlock)
      const ast = createBlock([middleTag])

      const result = traverser.traverse(ast, visitor) as Block

      // Should keep outer structure but remove component
      expect(result.nodes).toHaveLength(1)
      const middleTagResult = result.nodes[0] as Tag
      expect(middleTagResult.name).toBe('div')
      expect(middleTagResult.block?.nodes).toHaveLength(0)
    })
  })

  describe('empty blocks', () => {
    test('should handle empty blocks', () => {
      const ast = createBlock([])

      const result = traverser.traverse(ast, visitor) as Block

      expect(result.nodes).toHaveLength(0)
    })

    test('should result in empty block after removing all components', () => {
      const componentDef1 = createTag('component', createBlock())
      const componentDef2 = createTag('component', createBlock())
      const ast = createBlock([componentDef1, componentDef2])

      const result = traverser.traverse(ast, visitor) as Block

      expect(result.nodes).toHaveLength(0)
    })
  })

  describe('node preservation', () => {
    test('should preserve node order', () => {
      const tag1 = createTag('div')
      const componentDef = createTag('component', createBlock())
      const tag2 = createTag('span')
      const tag3 = createTag('p')

      const ast = createBlock([tag1, componentDef, tag2, tag3])

      const result = traverser.traverse(ast, visitor) as Block

      expect(result.nodes).toHaveLength(3)
      expect((result.nodes[0] as Tag).name).toBe('div')
      expect((result.nodes[1] as Tag).name).toBe('span')
      expect((result.nodes[2] as Tag).name).toBe('p')
    })

    test('should preserve node properties', () => {
      const tag = createTag('div')
      tag.attrs = [{ name: 'class', val: '"container"', mustEscape: false }]
      tag.line = 42
      tag.column = 7

      const ast = createBlock([tag])

      const result = traverser.traverse(ast, visitor) as Block

      const resultTag = result.nodes[0] as Tag
      expect(resultTag.attrs).toEqual([
        { name: 'class', val: '"container"', mustEscape: false },
      ])
      expect(resultTag.line).toBe(42)
      expect(resultTag.column).toBe(7)
    })
  })

  describe('integration with Traverser', () => {
    test('should work with traverser traverse method', () => {
      const componentDef = createTag('component', createBlock())
      const regularTag = createTag('div')
      const ast = createBlock([componentDef, regularTag])

      const result = traverser.traverse(ast, visitor) as Block

      expect(result.nodes).toHaveLength(1)
      expect((result.nodes[0] as Tag).name).toBe('div')
    })

    test('should be composable with other visitors', () => {
      // This tests that the visitor can be used in a pipeline
      // For now, just test it works standalone
      const componentDef = createTag('component', createBlock())
      const ast = createBlock([componentDef])

      const result = traverser.traverse(ast, visitor) as Block

      expect(result.nodes).toHaveLength(0)
    })
  })
})
