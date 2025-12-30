/**
 * Tests for ast-helpers.ts.
 */

import { describe, expect, test } from 'vitest'
import type { Block, Tag, Text } from '@/types/pug'
import {
  filterNodes,
  findNode,
  getAttributeNames,
  getAttributeValue,
  getChildNodes,
  getFirstTextContent,
  getNodeLocation,
  isBlockNode,
  isCapitalizedTag,
  isTagNode,
  isTagWithName,
  isTextNode,
} from '@/utils/astHelpers'

describe('ast-helpers', () => {
  describe('type guards', () => {
    test('isTagNode: should correctly identify a Tag node', () => {
      const tagNode: Tag = {
        type: 'Tag',
        name: 'div',
        selfClosing: false,
        block: { type: 'Block', nodes: [], line: 1 },
        attrs: [],
        attributeBlocks: [],
        isInline: false,
        line: 1,
        column: 1,
      }

      const textNode: Text = {
        type: 'Text',
        val: 'Hello',
        line: 1,
        column: 1,
      }

      expect(isTagNode(tagNode)).toBe(true)
      expect(isTagNode(textNode)).toBe(false)
    })

    test('isBlockNode: should correctly identify a Block node', () => {
      const blockNode: Block = {
        type: 'Block',
        nodes: [],
        line: 1,
      }

      const textNode: Text = {
        type: 'Text',
        val: 'Hello',
        line: 1,
        column: 1,
      }

      expect(isBlockNode(blockNode)).toBe(true)
      expect(isBlockNode(textNode)).toBe(false)
    })

    test('isTextNode: should correctly identify a Text node', () => {
      const textNode: Text = {
        type: 'Text',
        val: 'Hello',
        line: 1,
        column: 1,
      }

      const tagNode: Tag = {
        type: 'Tag',
        name: 'div',
        selfClosing: false,
        block: { type: 'Block', nodes: [], line: 1 },
        attrs: [],
        attributeBlocks: [],
        isInline: false,
        line: 1,
        column: 1,
      }

      expect(isTextNode(textNode)).toBe(true)
      expect(isTextNode(tagNode)).toBe(false)
    })

    test('isTagWithName: should correctly identify a Tag with a specific name', () => {
      const slotNode: Tag = {
        type: 'Tag',
        name: 'slot',
        selfClosing: false,
        block: { type: 'Block', nodes: [], line: 1 },
        attrs: [],
        attributeBlocks: [],
        isInline: false,
        line: 1,
        column: 1,
      }

      const divNode: Tag = {
        type: 'Tag',
        name: 'div',
        selfClosing: false,
        block: { type: 'Block', nodes: [], line: 1 },
        attrs: [],
        attributeBlocks: [],
        isInline: false,
        line: 1,
        column: 1,
      }

      expect(isTagWithName(slotNode, 'slot')).toBe(true)
      expect(isTagWithName(slotNode, 'div')).toBe(false)
      expect(isTagWithName(divNode, 'slot')).toBe(false)
    })

    test('isCapitalizedTag: should correctly identify a Tag starting with a capital letter', () => {
      const cardNode: Tag = {
        type: 'Tag',
        name: 'Card',
        selfClosing: false,
        block: { type: 'Block', nodes: [], line: 1 },
        attrs: [],
        attributeBlocks: [],
        isInline: false,
        line: 1,
        column: 1,
      }

      const divNode: Tag = {
        type: 'Tag',
        name: 'div',
        selfClosing: false,
        block: { type: 'Block', nodes: [], line: 1 },
        attrs: [],
        attributeBlocks: [],
        isInline: false,
        line: 1,
        column: 1,
      }

      expect(isCapitalizedTag(cardNode)).toBe(true)
      expect(isCapitalizedTag(divNode)).toBe(false)
    })
  })

  describe('attribute helpers', () => {
    test('getAttributeValue: should get an attribute value', () => {
      const attrs = [
        { name: 'class', val: "'card'", mustEscape: false },
        { name: 'id', val: "'main'", mustEscape: false },
        { name: 'disabled', val: true, mustEscape: true },
      ]

      expect(getAttributeValue(attrs, 'class')).toBe("'card'")
      expect(getAttributeValue(attrs, 'id')).toBe("'main'")
      expect(getAttributeValue(attrs, 'disabled')).toBe(true)
      expect(getAttributeValue(attrs, 'notfound')).toBeUndefined()
    })

    test('getAttributeValue: should handle undefined attrs', () => {
      expect(getAttributeValue(undefined, 'class')).toBeUndefined()
    })

    test('getAttributeNames: should get a list of attribute names', () => {
      const attrs = [
        { name: 'class', val: "'card'", mustEscape: false },
        { name: 'id', val: "'main'", mustEscape: false },
        { name: 'disabled', val: true, mustEscape: true },
      ]

      const names = getAttributeNames(attrs)

      expect(names).toEqual(['class', 'id', 'disabled'])
    })

    test('getAttributeNames: should handle undefined attrs', () => {
      expect(getAttributeNames(undefined)).toEqual([])
    })
  })

  describe('block helpers', () => {
    test('getChildNodes: should get child nodes', () => {
      const block: Block = {
        type: 'Block',
        nodes: [
          { type: 'Text', val: 'Hello', line: 1, column: 1 },
          { type: 'Text', val: 'World', line: 2, column: 1 },
        ],
        line: 1,
      }

      const children = getChildNodes(block)

      expect(children).toHaveLength(2)
      expect(children[0]?.type).toBe('Text')
    })

    test('getChildNodes: should handle undefined block', () => {
      expect(getChildNodes(undefined)).toEqual([])
    })

    test('getChildNodes: should handle empty nodes', () => {
      const block: Block = {
        type: 'Block',
        nodes: [],
        line: 1,
      }

      expect(getChildNodes(block)).toEqual([])
    })
  })

  describe('location helpers', () => {
    test('getNodeLocation: should get full location information', () => {
      const node: Tag = {
        type: 'Tag',
        name: 'div',
        selfClosing: false,
        block: { type: 'Block', nodes: [], line: 1 },
        attrs: [],
        attributeBlocks: [],
        isInline: false,
        line: 10,
        column: 5,
        filename: 'test.pug',
      }

      expect(getNodeLocation(node)).toBe('test.pug:10:5')
    })

    test('getNodeLocation: should handle missing filename', () => {
      const node: Tag = {
        type: 'Tag',
        name: 'div',
        selfClosing: false,
        block: { type: 'Block', nodes: [], line: 1 },
        attrs: [],
        attributeBlocks: [],
        isInline: false,
        line: 10,
        column: 5,
      }

      expect(getNodeLocation(node)).toBe('10:5')
    })

    test('getNodeLocation: should handle missing location information', () => {
      const node: Block = {
        type: 'Block',
        nodes: [],
        line: 0,
      }

      // line: 0 exists, so it should be output.
      expect(getNodeLocation(node)).toBe('0')
    })
  })

  describe('content helpers', () => {
    test('getFirstTextContent: should get the content of the first Text node', () => {
      const node: Tag = {
        type: 'Tag',
        name: 'p',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [{ type: 'Text', val: 'Hello World', line: 1, column: 1 }],
          line: 1,
        },
        attrs: [],
        attributeBlocks: [],
        isInline: false,
        line: 1,
        column: 1,
      }

      expect(getFirstTextContent(node)).toBe('Hello World')
    })

    test('getFirstTextContent: should handle no Text node', () => {
      const node: Tag = {
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

      expect(getFirstTextContent(node)).toBeUndefined()
    })

    test('getFirstTextContent: should handle no block', () => {
      const node: Tag = {
        type: 'Tag',
        name: 'div',
        selfClosing: true,
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

      expect(getFirstTextContent(node)).toBeUndefined()
    })
  })

  describe('filter and find helpers', () => {
    test('filterNodes: should filter nodes that match the condition', () => {
      const block: Block = {
        type: 'Block',
        nodes: [
          {
            type: 'Tag',
            name: 'slot',
            selfClosing: false,
            block: { type: 'Block', nodes: [], line: 2 },
            attrs: [],
            attributeBlocks: [],
            isInline: false,
            line: 2,
            column: 1,
          },
          { type: 'Text', val: 'Hello', line: 3, column: 1 },
          {
            type: 'Tag',
            name: 'slot',
            selfClosing: false,
            block: { type: 'Block', nodes: [], line: 4 },
            attrs: [],
            attributeBlocks: [],
            isInline: false,
            line: 4,
            column: 1,
          },
        ],
        line: 1,
      }

      const slots = filterNodes(block, (node) => isTagWithName(node, 'slot'))

      expect(slots).toHaveLength(2)
      expect(
        slots.every((n) => isTagNode(n) && (n as Tag).name === 'slot'),
      ).toBe(true)
    })

    test('findNode: should get the first node found', () => {
      const block: Block = {
        type: 'Block',
        nodes: [
          { type: 'Text', val: 'Hello', line: 2, column: 1 },
          {
            type: 'Tag',
            name: 'slot',
            selfClosing: false,
            block: { type: 'Block', nodes: [], line: 3 },
            attrs: [],
            attributeBlocks: [],
            isInline: false,
            line: 3,
            column: 1,
          },
          {
            type: 'Tag',
            name: 'div',
            selfClosing: false,
            block: { type: 'Block', nodes: [], line: 4 },
            attrs: [],
            attributeBlocks: [],
            isInline: false,
            line: 4,
            column: 1,
          },
        ],
        line: 1,
      }

      const firstSlot = findNode(block, (node) => isTagWithName(node, 'slot'))

      expect(firstSlot).toBeDefined()
      if (firstSlot && isTagNode(firstSlot)) {
        expect(firstSlot.name).toBe('slot')
      }
    })

    test('findNode: should handle not found case', () => {
      const block: Block = {
        type: 'Block',
        nodes: [{ type: 'Text', val: 'Hello', line: 2, column: 1 }],
        line: 1,
      }

      const result = findNode(block, (node) => isTagWithName(node, 'slot'))

      expect(result).toBeUndefined()
    })
  })
})
