/**
 * Tests for IncludeFlattenerVisitor
 */

import { beforeEach, describe, expect, test } from 'vitest'
import { Traverser } from '@/core/compiler/traverser'
import { IncludeFlattenerVisitor } from '@/core/visitors/includeFlattener'
import type { Block, Node, Tag } from '@/types/pug'
import { assertDefined } from '@/utils/astHelpers'

describe('IncludeFlattenerVisitor', () => {
  let traverser: Traverser
  let visitor: IncludeFlattenerVisitor

  beforeEach(() => {
    traverser = new Traverser()
    visitor = new IncludeFlattenerVisitor()
  })

  // Helper: Creates a Block node
  function createBlock(nodes: Node[] = []): Block {
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

  // Helper: Creates an Include node with AST
  function createInclude(ast: Block): Node {
    return {
      type: 'Include',
      file: {
        ast,
      },
      line: 1,
      column: 1,
    } as Node
  }

  // Helper: Creates an Extends node with AST
  function createExtends(ast: Block): Node {
    return {
      type: 'Extends',
      file: {
        ast,
      },
      line: 1,
      column: 1,
    } as Node
  }

  describe('Include flattening', () => {
    test('should replace Include node with its AST content', () => {
      // Create an include with a nested AST
      const includedTag = createTag('div')
      const includedAst = createBlock([includedTag])
      const includeNode = createInclude(includedAst)

      const ast = createBlock([includeNode])

      const result = traverser.traverse(ast, visitor) as Block

      // Include node should be replaced with its content
      expect(result.nodes).toHaveLength(1)
      const firstNode = assertDefined(result.nodes[0], 'Expected first node')
      expect(firstNode.type).toBe('Block')

      const replacedBlock = firstNode as Block
      expect(replacedBlock).toBeDefined()
      expect(replacedBlock.nodes).toHaveLength(1)
      const extendedTag = assertDefined(
        replacedBlock.nodes[0],
        'Expected extended tag',
      )
      expect((extendedTag as Tag).name).toBe('div')
    })

    test('should handle multiple Include nodes', () => {
      const include1Tag = createTag('div')
      const include1Ast = createBlock([include1Tag])
      const include1 = createInclude(include1Ast)

      const include2Tag = createTag('span')
      const include2Ast = createBlock([include2Tag])
      const include2 = createInclude(include2Ast)

      const ast = createBlock([include1, include2])

      const result = traverser.traverse(ast, visitor) as Block

      // Both includes should be replaced
      expect(result.nodes).toHaveLength(2)
      const firstNode = assertDefined(result.nodes[0], 'Expected first node')
      const secondNode = assertDefined(result.nodes[1], 'Expected second node')
      expect(firstNode.type).toBe('Block')
      expect(secondNode.type).toBe('Block')
    })

    test('should handle Include without AST', () => {
      const includeNode: Node = {
        type: 'Include',
        file: null,
        block: null,
        line: 1,
        column: 1,
      } as unknown as Node

      const ast = createBlock([includeNode])

      const result = traverser.traverse(ast, visitor) as Block

      // Include without AST should remain
      expect(result.nodes).toHaveLength(1)
      const firstNode = assertDefined(result.nodes[0], 'Expected first node')
      expect(firstNode.type).toBe('Include')
    })

    test('should handle nested Includes', () => {
      // Create nested structure: Include > Block > Include > Block > Tag
      const innerTag = createTag('span')
      const innerAst = createBlock([innerTag])
      const innerInclude = createInclude(innerAst)

      const middleAst = createBlock([innerInclude])
      const outerInclude = createInclude(middleAst)

      const ast = createBlock([outerInclude])

      const result = traverser.traverse(ast, visitor) as Block

      // Should flatten all includes
      expect(result.nodes).toHaveLength(1)
      const firstNode = assertDefined(result.nodes[0], 'Expected first node')
      expect(firstNode.type).toBe('Block')

      const outerBlock = firstNode as Block
      expect(outerBlock).toBeDefined()
      expect(outerBlock.nodes).toHaveLength(1)
      const outerFirstNode = assertDefined(
        outerBlock.nodes[0],
        'Expected outer block first node',
      )
      expect(outerFirstNode.type).toBe('Block')

      const innerBlock = outerFirstNode as Block
      expect(innerBlock).toBeDefined()
      expect(innerBlock.nodes).toHaveLength(1)
      const nestedTag = assertDefined(
        innerBlock.nodes[0],
        'Expected nested tag',
      )
      expect((nestedTag as Tag).name).toBe('span')
    })
  })

  describe('Extends flattening', () => {
    test('should replace Extends node with its AST content', () => {
      // Create an extends with a nested AST
      const extendedTag = createTag('div')
      const extendedAst = createBlock([extendedTag])
      const extendsNode = createExtends(extendedAst)

      const ast = createBlock([extendsNode])

      const result = traverser.traverse(ast, visitor) as Block

      // Extends node should be replaced with its content
      expect(result.nodes).toHaveLength(1)
      const firstNode = assertDefined(result.nodes[0], 'Expected first node')
      expect(firstNode.type).toBe('Block')

      const replacedBlock = firstNode as Block
      expect(replacedBlock).toBeDefined()
      expect(replacedBlock.nodes).toHaveLength(1)
      const innerTag = assertDefined(
        replacedBlock.nodes[0],
        'Expected inner tag',
      )
      expect((innerTag as Tag).name).toBe('div')
    })

    test('should handle multiple Extends nodes', () => {
      const extends1Tag = createTag('div')
      const extends1Ast = createBlock([extends1Tag])
      const extends1 = createExtends(extends1Ast)

      const extends2Tag = createTag('span')
      const extends2Ast = createBlock([extends2Tag])
      const extends2 = createExtends(extends2Ast)

      const ast = createBlock([extends1, extends2])

      const result = traverser.traverse(ast, visitor) as Block

      // Both extends should be replaced
      expect(result.nodes).toHaveLength(2)
      const firstNode = assertDefined(result.nodes[0], 'Expected first node')
      const secondNode = assertDefined(result.nodes[1], 'Expected second node')
      expect(firstNode.type).toBe('Block')
      expect(secondNode.type).toBe('Block')
    })

    test('should handle Extends without AST', () => {
      const extendsNode: Node = {
        type: 'Extends',
        file: null,
        block: createBlock(),
        line: 1,
        column: 1,
      } as unknown as Node

      const ast = createBlock([extendsNode])

      const result = traverser.traverse(ast, visitor) as Block

      // Extends without AST should remain
      expect(result.nodes).toHaveLength(1)
      const firstNode = assertDefined(result.nodes[0], 'Expected first node')
      expect(firstNode.type).toBe('Extends')
    })
  })

  describe('mixed Include and Extends', () => {
    test('should handle both Include and Extends nodes', () => {
      const includeTag = createTag('div')
      const includeAst = createBlock([includeTag])
      const includeNode = createInclude(includeAst)

      const extendsTag = createTag('span')
      const extendsAst = createBlock([extendsTag])
      const extendsNode = createExtends(extendsAst)

      const ast = createBlock([includeNode, extendsNode])

      const result = traverser.traverse(ast, visitor) as Block

      // Both should be replaced
      expect(result.nodes).toHaveLength(2)
      const firstNode = assertDefined(result.nodes[0], 'Expected first node')
      const secondNode = assertDefined(result.nodes[1], 'Expected second node')
      expect(firstNode.type).toBe('Block')
      expect(secondNode.type).toBe('Block')
    })

    test('should preserve non-Include/Extends nodes', () => {
      const regularTag = createTag('p')

      const includeTag = createTag('div')
      const includeAst = createBlock([includeTag])
      const includeNode = createInclude(includeAst)

      const ast = createBlock([regularTag, includeNode])

      const result = traverser.traverse(ast, visitor) as Block

      // Regular tag should be preserved, include should be replaced
      expect(result.nodes).toHaveLength(2)
      const firstNode = assertDefined(result.nodes[0], 'Expected first node')
      const secondNode = assertDefined(result.nodes[1], 'Expected second node')
      expect((firstNode as Tag).name).toBe('p')
      expect(secondNode.type).toBe('Block')
    })
  })

  describe('complex structures', () => {
    test('should handle Include inside Tag', () => {
      const includedTag = createTag('span')
      const includedAst = createBlock([includedTag])
      const includeNode = createInclude(includedAst)

      const outerBlock = createBlock([includeNode])
      const outerTag = createTag('div', outerBlock)
      const ast = createBlock([outerTag])

      const result = traverser.traverse(ast, visitor) as Block

      // Structure should be: Block > Tag(div) > Block > Block > Tag(span)
      expect(result.nodes).toHaveLength(1)
      const firstNode = assertDefined(result.nodes[0], 'Expected first node')
      const divTag = firstNode as Tag
      expect(divTag).toBeDefined()
      expect(divTag.name).toBe('div')
      const divBlock = assertDefined(divTag.block, 'Expected div block')
      expect(divBlock.nodes).toHaveLength(1)

      const innerBlockNode = assertDefined(
        divBlock.nodes[0],
        'Expected inner block node',
      )
      const innerBlock = innerBlockNode as Block
      expect(innerBlock).toBeDefined()
      expect(innerBlock.type).toBe('Block')
      expect(innerBlock.nodes).toHaveLength(1)
      const spanTag = assertDefined(innerBlock.nodes[0], 'Expected span tag')
      expect((spanTag as Tag).name).toBe('span')
    })

    test('should handle empty Include AST', () => {
      const emptyAst = createBlock([])
      const includeNode = createInclude(emptyAst)
      const ast = createBlock([includeNode])

      const result = traverser.traverse(ast, visitor) as Block

      // Include should be replaced with empty block
      expect(result.nodes).toHaveLength(1)
      const firstNode = assertDefined(result.nodes[0], 'Expected first node')
      expect(firstNode.type).toBe('Block')
      expect((firstNode as Block).nodes).toHaveLength(0)
    })

    test('should handle Include with multiple nodes', () => {
      const tag1 = createTag('div')
      const tag2 = createTag('span')
      const tag3 = createTag('p')
      const includedAst = createBlock([tag1, tag2, tag3])
      const includeNode = createInclude(includedAst)

      const ast = createBlock([includeNode])

      const result = traverser.traverse(ast, visitor) as Block

      expect(result.nodes).toHaveLength(1)
      const firstNode = assertDefined(result.nodes[0], 'Expected first node')
      const replacedBlock = firstNode as Block
      expect(replacedBlock).toBeDefined()
      expect(replacedBlock.nodes).toHaveLength(3)
      const resultTag1 = assertDefined(replacedBlock.nodes[0], 'Expected tag1')
      const resultTag2 = assertDefined(replacedBlock.nodes[1], 'Expected tag2')
      const resultTag3 = assertDefined(replacedBlock.nodes[2], 'Expected tag3')
      expect((resultTag1 as Tag).name).toBe('div')
      expect((resultTag2 as Tag).name).toBe('span')
      expect((resultTag3 as Tag).name).toBe('p')
    })
  })

  describe('integration', () => {
    test('should work with other visitors', () => {
      // This tests that the visitor can be used in a pipeline
      const includedTag = createTag('div')
      const includedAst = createBlock([includedTag])
      const includeNode = createInclude(includedAst)
      const ast = createBlock([includeNode])

      const result = traverser.traverse(ast, visitor) as Block

      expect(result.nodes).toHaveLength(1)
      const firstNode = assertDefined(result.nodes[0], 'Expected first node')
      expect(firstNode.type).toBe('Block')
    })
  })
})
