/**
 * Unit tests for extractAttributes function
 */

import { describe, expect, test } from 'vitest'
import type { Tag } from '@/types/pug'
import { extractAttributes } from '@/utils/attributes/extractAttributes'

describe('extractAttributes', () => {
  describe('shorthand syntax', () => {
    test('should expand single shorthand attribute', () => {
      // Card(title) → Map { 'title' => 'title' }
      const callNode: Tag = {
        type: 'Tag',
        name: 'Card',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [],
          line: 1,
        },
        attrs: [
          {
            name: 'title',
            val: true, // ショートハンド: 値がtrue
            mustEscape: false,
          },
        ],
        attributeBlocks: [],
        isInline: false,
        line: 1,
      }

      const result = extractAttributes(callNode)

      expect(result.size).toBe(1)
      expect(result.get('title')).toBe('title')
    })

    test('should expand multiple shorthand attributes', () => {
      // Card(title, disabled) → Map { 'title' => 'title', 'disabled' => 'disabled' }
      const callNode: Tag = {
        type: 'Tag',
        name: 'Card',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [],
          line: 1,
        },
        attrs: [
          {
            name: 'title',
            val: true,
            mustEscape: false,
          },
          {
            name: 'disabled',
            val: true,
            mustEscape: false,
          },
        ],
        attributeBlocks: [],
        isInline: false,
        line: 1,
      }

      const result = extractAttributes(callNode)

      expect(result.size).toBe(2)
      expect(result.get('title')).toBe('title')
      expect(result.get('disabled')).toBe('disabled')
    })

    test('should mix shorthand and explicit attributes', () => {
      // Card(title, type="primary") → Map { 'title' => 'title', 'type' => '"primary"' }
      const callNode: Tag = {
        type: 'Tag',
        name: 'Card',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [],
          line: 1,
        },
        attrs: [
          {
            name: 'title',
            val: true, // ショートハンド
            mustEscape: false,
          },
          {
            name: 'type',
            val: '"primary"', // 明示的な文字列
            mustEscape: true,
          },
        ],
        attributeBlocks: [],
        isInline: false,
        line: 1,
      }

      const result = extractAttributes(callNode)

      expect(result.size).toBe(2)
      expect(result.get('title')).toBe('title')
      expect(result.get('type')).toBe('"primary"')
    })

    test('should handle explicit true/false literals', () => {
      // Card(disabled=true) → Map { 'disabled' => 'true' }
      // Card(disabled=false) → Map { 'disabled' => 'false' }
      const callNodeTrue: Tag = {
        type: 'Tag',
        name: 'Card',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [],
          line: 1,
        },
        attrs: [
          {
            name: 'disabled',
            val: 'true', // 文字列の'true' (明示的なtrue)
            mustEscape: false,
          },
        ],
        attributeBlocks: [],
        isInline: false,
        line: 1,
      }

      const resultTrue = extractAttributes(callNodeTrue)
      expect(resultTrue.get('disabled')).toBe('true')

      const callNodeFalse: Tag = {
        type: 'Tag',
        name: 'Card',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [],
          line: 1,
        },
        attrs: [
          {
            name: 'disabled',
            val: 'false', // 文字列の'false' (明示的なfalse)
            mustEscape: false,
          },
        ],
        attributeBlocks: [],
        isInline: false,
        line: 1,
      }

      const resultFalse = extractAttributes(callNodeFalse)
      expect(resultFalse.get('disabled')).toBe('false')
    })
  })

  describe('backward compatibility', () => {
    test('should handle explicit string attributes unchanged', () => {
      // Card(title="Hello") → Map { 'title' => '"Hello"' }
      const callNode: Tag = {
        type: 'Tag',
        name: 'Card',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [],
          line: 1,
        },
        attrs: [
          {
            name: 'title',
            val: '"Hello"',
            mustEscape: true,
          },
        ],
        attributeBlocks: [],
        isInline: false,
        line: 1,
      }

      const result = extractAttributes(callNode)

      expect(result.size).toBe(1)
      expect(result.get('title')).toBe('"Hello"')
    })

    test('should handle variable references unchanged', () => {
      // Card(title=myTitle) → Map { 'title' => 'myTitle' }
      const callNode: Tag = {
        type: 'Tag',
        name: 'Card',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [],
          line: 1,
        },
        attrs: [
          {
            name: 'title',
            val: 'myTitle',
            mustEscape: false,
          },
        ],
        attributeBlocks: [],
        isInline: false,
        line: 1,
      }

      const result = extractAttributes(callNode)

      expect(result.size).toBe(1)
      expect(result.get('title')).toBe('myTitle')
    })

    test('should handle numeric literals unchanged', () => {
      // Card(count=5) → Map { 'count' => '5' }
      const callNode: Tag = {
        type: 'Tag',
        name: 'Card',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [],
          line: 1,
        },
        attrs: [
          {
            name: 'count',
            val: '5',
            mustEscape: false,
          },
        ],
        attributeBlocks: [],
        isInline: false,
        line: 1,
      }

      const result = extractAttributes(callNode)

      expect(result.size).toBe(1)
      expect(result.get('count')).toBe('5')
    })

    test('should handle empty attributes list', () => {
      // Card() → Map {}
      const callNode: Tag = {
        type: 'Tag',
        name: 'Card',
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
      }

      const result = extractAttributes(callNode)

      expect(result.size).toBe(0)
    })
  })

  describe('edge cases', () => {
    test('should handle complex mixed attributes', () => {
      // Card(title, count=5, disabled, type="primary")
      const callNode: Tag = {
        type: 'Tag',
        name: 'Card',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [],
          line: 1,
        },
        attrs: [
          {
            name: 'title',
            val: true, // ショートハンド
            mustEscape: false,
          },
          {
            name: 'count',
            val: '5',
            mustEscape: false,
          },
          {
            name: 'disabled',
            val: true, // ショートハンド
            mustEscape: false,
          },
          {
            name: 'type',
            val: '"primary"',
            mustEscape: true,
          },
        ],
        attributeBlocks: [],
        isInline: false,
        line: 1,
      }

      const result = extractAttributes(callNode)

      expect(result.size).toBe(4)
      expect(result.get('title')).toBe('title')
      expect(result.get('count')).toBe('5')
      expect(result.get('disabled')).toBe('disabled')
      expect(result.get('type')).toBe('"primary"')
    })
  })
})
