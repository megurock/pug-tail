/**
 * Tests for deep-clone.ts.
 */

import { describe, expect, test } from 'vitest'
import type { Block, Tag } from '@/types/pug'
import { deepClone, deepCloneBlock, deepCloneNode } from '@/utils/deepClone'

describe('deep-clone', () => {
  describe('deepCloneNode', () => {
    test('should be able to deep clone a Tag node', () => {
      const original: Tag = {
        type: 'Tag',
        name: 'div',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [],
          line: 1,
        },
        attrs: [],
        attributeBlocks: [],
        isInline: false,
        line: 1,
        column: 1,
      }

      const cloned = deepCloneNode(original)

      // Check that the values are equal.
      expect(cloned).toEqual(original)

      // Check that it is an independent object.
      expect(cloned).not.toBe(original)
      expect(cloned.block).not.toBe(original.block)
    })

    test('should not affect the original node after modification of the copy', () => {
      const original: Tag = {
        type: 'Tag',
        name: 'div',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [],
          line: 1,
        },
        attrs: [],
        attributeBlocks: [],
        isInline: false,
        line: 1,
        column: 1,
      }

      const cloned = deepCloneNode(original)

      // Modify the copy.
      cloned.name = 'span'
      cloned.attrs.push({
        name: 'class',
        val: 'test',
        mustEscape: false,
      })

      // Check that the original node has not been changed.
      expect(original.name).toBe('div')
      expect(original.attrs).toHaveLength(0)
    })

    test('should also deep clone nested Blocks', () => {
      const original: Tag = {
        type: 'Tag',
        name: 'div',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [
            {
              type: 'Tag',
              name: 'p',
              selfClosing: false,
              block: {
                type: 'Block',
                nodes: [],
                line: 2,
              },
              attrs: [],
              attributeBlocks: [],
              isInline: false,
              line: 2,
              column: 3,
            },
          ],
          line: 1,
        },
        attrs: [],
        attributeBlocks: [],
        isInline: false,
        line: 1,
        column: 1,
      }

      const cloned = deepCloneNode(original)

      // Check that the nested Block is also independent.
      expect(cloned.block?.nodes[0]).not.toBe(original.block?.nodes[0])
    })
  })

  describe('deepCloneBlock', () => {
    test('should be able to deep clone a Block', () => {
      const original: Block = {
        type: 'Block',
        nodes: [
          {
            type: 'Text',
            val: 'Hello',
            line: 1,
            column: 1,
          },
        ],
        line: 1,
      }

      const cloned = deepCloneBlock(original)

      // Check that the values are equal.
      expect(cloned).toEqual(original)

      // Check that it is an independent object.
      expect(cloned).not.toBe(original)
      expect(cloned.nodes).not.toBe(original.nodes)
    })

    test('should not affect the original Block after modification of the copy', () => {
      const original: Block = {
        type: 'Block',
        nodes: [],
        line: 1,
      }

      const cloned = deepCloneBlock(original)

      // Add a new node to the copy.
      cloned.nodes.push({
        type: 'Text',
        val: 'New',
        line: 2,
        column: 1,
      })

      // Check that the original Block has not been changed.
      expect(original.nodes).toHaveLength(0)
      expect(cloned.nodes).toHaveLength(1)
    })
  })

  describe('deepClone', () => {
    test('should be able to deep clone any object', () => {
      const original = {
        a: 1,
        b: {
          c: 2,
          d: {
            e: 3,
          },
        },
      }

      const cloned = deepClone(original)

      // Check that the values are equal.
      expect(cloned).toEqual(original)

      // Check that it is an independent object.
      expect(cloned).not.toBe(original)
      expect(cloned.b).not.toBe(original.b)
      expect(cloned.b.d).not.toBe(original.b.d)
    })

    test('should be able to deep clone an array', () => {
      const original = [1, [2, [3, 4]]]

      const cloned = deepClone(original)

      // Check that the values are equal.
      expect(cloned).toEqual(original)

      // Check that it is an independent array.
      expect(cloned).not.toBe(original)
      expect(cloned[1]).not.toBe(original[1])
    })
  })
})
