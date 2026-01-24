/**
 * Tests for Visitor interface
 *
 * Tests the visitor pattern interface and base class.
 */

import { describe, expect, test } from 'vitest'
import {
  BaseVisitor,
  type Visitor,
  type VisitorMethods,
} from '@/core/visitors/visitor'
import type { Block, Node, Tag } from '@/types/pug'

describe('Visitor Interface', () => {
  describe('VisitorMethods', () => {
    test('should allow enter method only', () => {
      const methods: VisitorMethods = {
        enter(_node, _parent) {
          // Valid
          return undefined
        },
      }

      expect(methods.enter).toBeDefined()
      expect(methods.exit).toBeUndefined()
    })

    test('should allow exit method only', () => {
      const methods: VisitorMethods = {
        exit(_node, _parent) {
          // Valid
          return undefined
        },
      }

      expect(methods.enter).toBeUndefined()
      expect(methods.exit).toBeDefined()
    })

    test('should allow both enter and exit methods', () => {
      const methods: VisitorMethods = {
        enter(_node, _parent) {
          // Valid
          return undefined
        },
        exit(_node, _parent) {
          // Valid
          return undefined
        },
      }

      expect(methods.enter).toBeDefined()
      expect(methods.exit).toBeDefined()
    })

    test('enter can return a Node', () => {
      const dummyNode: Block = {
        type: 'Block',
        nodes: [],
        line: 1,
      }

      const methods: VisitorMethods = {
        enter(_node, _parent): Node {
          return dummyNode
        },
      }

      const result = methods.enter?.(dummyNode, null)
      expect(result).toBe(dummyNode)
    })

    test('enter can return void', () => {
      const dummyNode: Block = {
        type: 'Block',
        nodes: [],
        line: 1,
      }

      const methods: VisitorMethods = {
        enter(_node, _parent) {
          // Do nothing
          return undefined
        },
      }

      const result = methods.enter?.(dummyNode, null)
      expect(result).toBeUndefined()
    })
  })

  describe('Visitor', () => {
    test('should allow specific node type methods', () => {
      const visitor: Visitor = {
        Block: {
          enter(node, _parent) {
            expect(node.type).toBe('Block')
            return undefined
          },
        },
        Tag: {
          enter(node, _parent) {
            expect(node.type).toBe('Tag')
            return undefined
          },
        },
      }

      expect(visitor.Block).toBeDefined()
      expect(visitor.Tag).toBeDefined()
    })

    test('should allow arbitrary node type methods via index signature', () => {
      const visitor: Visitor = {
        CustomNode: {
          enter(_node: Node, _parent: Node | null) {
            // Valid via index signature
            return undefined
          },
        },
      }

      expect(visitor.CustomNode).toBeDefined()
    })

    test('should allow empty visitor', () => {
      const visitor: Visitor = {}

      expect(Object.keys(visitor)).toHaveLength(0)
    })

    test('should allow partial visitor (only some node types)', () => {
      const visitor: Visitor = {
        Tag: {
          enter(_node, _parent) {
            // Only handle tags
            return undefined
          },
        },
      }

      expect(visitor.Tag).toBeDefined()
      expect(visitor.Block).toBeUndefined()
    })

    test('should support all Pug node types', () => {
      const visitor: Visitor = {
        Block: {
          enter() {
            return undefined
          },
        },
        Tag: {
          enter() {
            return undefined
          },
        },
        Text: {
          enter() {
            return undefined
          },
        },
        Comment: {
          enter() {
            return undefined
          },
        },
        BlockComment: {
          enter() {
            return undefined
          },
        },
        Code: {
          enter() {
            return undefined
          },
        },
        Conditional: {
          enter() {
            return undefined
          },
        },
        Each: {
          enter() {
            return undefined
          },
        },
        Case: {
          enter() {
            return undefined
          },
        },
        When: {
          enter() {
            return undefined
          },
        },
        While: {
          enter() {
            return undefined
          },
        },
        Mixin: {
          enter() {
            return undefined
          },
        },
        MixinBlock: {
          enter() {
            return undefined
          },
        },
        Include: {
          enter() {
            return undefined
          },
        },
        NamedBlock: {
          enter() {
            return undefined
          },
        },
        Extends: {
          enter() {
            return undefined
          },
        },
        RawInclude: {
          enter() {
            return undefined
          },
        },
        FileReference: {
          enter() {
            return undefined
          },
        },
        YieldBlock: {
          enter() {
            return undefined
          },
        },
        Doctype: {
          enter() {
            return undefined
          },
        },
        Filter: {
          enter() {
            return undefined
          },
        },
        InterpolatedTag: {
          enter() {
            return undefined
          },
        },
        EachOf: {
          enter() {
            return undefined
          },
        },
      }

      // All node types should be defined
      expect(visitor.Block).toBeDefined()
      expect(visitor.Tag).toBeDefined()
      expect(visitor.Conditional).toBeDefined()
      expect(visitor.Include).toBeDefined()
      // ... etc
    })
  })

  describe('BaseVisitor', () => {
    test('should be extendable', () => {
      class TestVisitor extends BaseVisitor {
        Tag = {
          enter(node: Node, _parent: Node | null) {
            return node
          },
        }
      }

      const visitor = new TestVisitor()

      expect(visitor.Tag).toBeDefined()
      expect(visitor.Tag?.enter).toBeDefined()
    })

    test('should allow multiple node type handlers', () => {
      class TestVisitor extends BaseVisitor {
        Block = {
          enter(node: Node) {
            return node
          },
        }

        Tag = {
          enter(node: Node) {
            return node
          },
        }
      }

      const visitor = new TestVisitor()

      expect(visitor.Block).toBeDefined()
      expect(visitor.Tag).toBeDefined()
    })

    test('should allow both enter and exit in subclass', () => {
      class TestVisitor extends BaseVisitor {
        Tag = {
          enter(_node: Node, _parent: Node | null) {
            // enter logic
            return undefined
          },
          exit(_node: Node, _parent: Node | null) {
            // exit logic
            return undefined
          },
        }
      }

      const visitor = new TestVisitor()

      expect(visitor.Tag?.enter).toBeDefined()
      expect(visitor.Tag?.exit).toBeDefined()
    })

    test('should work with Visitor type', () => {
      class TestVisitor extends BaseVisitor {
        Tag = {
          enter(node: Node) {
            const tag = node as Tag
            return {
              ...tag,
              name: tag.name.toUpperCase(),
            }
          },
        }
      }

      const visitor: Visitor = new TestVisitor()

      expect(visitor.Tag).toBeDefined()
    })
  })

  describe('TypeScript type checking', () => {
    test('should enforce correct method signatures', () => {
      // This test is mainly for compile-time type checking
      const visitor: Visitor = {
        Tag: {
          // Should accept Node and Node | null
          enter(node: Node, _parent: Node | null): Node | undefined {
            return node
          },
          // Same for exit
          exit(node: Node, _parent: Node | null): Node | undefined {
            return node
          },
        },
      }

      expect(visitor.Tag).toBeDefined()
    })

    test('should allow undefined visitor methods', () => {
      const visitor: Visitor = {
        Tag: undefined,
        Block: {
          enter(_node) {
            // Only Block defined
            return undefined
          },
        },
      }

      expect(visitor.Tag).toBeUndefined()
      expect(visitor.Block).toBeDefined()
    })
  })
})
