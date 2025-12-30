import { describe, expect, it } from 'vitest'
import type { ComponentUsage } from '@/types'
import { categorizeAttributes } from '@/utils/attributeCategorizer'

describe('attributeCategorizer', () => {
  describe('categorizeAttributes', () => {
    it('should categorize attributes into props and attrs correctly', () => {
      const callAttributes = new Map([
        ['title', '"Hello"'],
        ['count', '5'],
        ['class', '"my-card"'],
        ['id', '"card-1"'],
      ])

      const usage: ComponentUsage = {
        fromProps: ['title', 'count'],
        fromAttrs: ['class'],
      }

      const result = categorizeAttributes(callAttributes, usage)

      expect(result.props.size).toBe(2)
      expect(result.props.get('title')).toBe('"Hello"')
      expect(result.props.get('count')).toBe('5')

      expect(result.attrs.size).toBe(2)
      expect(result.attrs.get('class')).toBe('"my-card"')
      expect(result.attrs.get('id')).toBe('"card-1"') // Unexpected attributes go to attrs
    })

    it('should handle case where all attributes are props', () => {
      const callAttributes = new Map([
        ['title', '"Hello"'],
        ['count', '5'],
      ])

      const usage: ComponentUsage = {
        fromProps: ['title', 'count'],
        fromAttrs: [],
      }

      const result = categorizeAttributes(callAttributes, usage)

      expect(result.props.size).toBe(2)
      expect(result.attrs.size).toBe(0)
    })

    it('should handle case where all attributes are attrs', () => {
      const callAttributes = new Map([
        ['class', '"my-card"'],
        ['id', '"card-1"'],
      ])

      const usage: ComponentUsage = {
        fromProps: [],
        fromAttrs: ['class', 'id'],
      }

      const result = categorizeAttributes(callAttributes, usage)

      expect(result.props.size).toBe(0)
      expect(result.attrs.size).toBe(2)
    })

    it('should default unexpected attributes to attrs', () => {
      const callAttributes = new Map([
        ['title', '"Hello"'],
        ['data-test', '"test"'],
        ['aria-label', '"Card"'],
      ])

      const usage: ComponentUsage = {
        fromProps: ['title'],
        fromAttrs: [],
      }

      const result = categorizeAttributes(callAttributes, usage)

      expect(result.props.size).toBe(1)
      expect(result.props.get('title')).toBe('"Hello"')

      expect(result.attrs.size).toBe(2)
      expect(result.attrs.get('data-test')).toBe('"test"')
      expect(result.attrs.get('aria-label')).toBe('"Card"')
    })

    it('should handle an empty attribute list', () => {
      const callAttributes = new Map<string, string>()

      const usage: ComponentUsage = {
        fromProps: ['title'],
        fromAttrs: ['class'],
      }

      const result = categorizeAttributes(callAttributes, usage)

      expect(result.props.size).toBe(0)
      expect(result.attrs.size).toBe(0)
    })

    it('should handle an empty usage pattern', () => {
      const callAttributes = new Map([
        ['title', '"Hello"'],
        ['class', '"my-card"'],
      ])

      const usage: ComponentUsage = {
        fromProps: [],
        fromAttrs: [],
      }

      const result = categorizeAttributes(callAttributes, usage)

      expect(result.props.size).toBe(0)
      // All unexpected attributes -> to attrs
      expect(result.attrs.size).toBe(2)
      expect(result.attrs.get('title')).toBe('"Hello"')
      expect(result.attrs.get('class')).toBe('"my-card"')
    })

    it('should handle when only some props are passed', () => {
      const callAttributes = new Map([
        ['title', '"Hello"'],
        // count is not passed
      ])

      const usage: ComponentUsage = {
        fromProps: ['title', 'count'],
        fromAttrs: ['class'],
      }

      const result = categorizeAttributes(callAttributes, usage)

      expect(result.props.size).toBe(1)
      expect(result.props.get('title')).toBe('"Hello"')
      expect(result.props.has('count')).toBe(false)

      expect(result.attrs.size).toBe(0)
    })

    it('should handle a complex pattern', () => {
      const callAttributes = new Map([
        ['title', '"Test"'],
        ['count', '3'],
        ['class', '"my-card"'],
        ['data-test', '"card-test"'],
        ['aria-label', '"Card"'],
        ['id', '"card-1"'],
      ])

      const usage: ComponentUsage = {
        fromProps: ['title', 'count'],
        fromAttrs: ['class', 'id'],
      }

      const result = categorizeAttributes(callAttributes, usage)

      // props: title, count
      expect(result.props.size).toBe(2)
      expect(result.props.get('title')).toBe('"Test"')
      expect(result.props.get('count')).toBe('3')

      // attrs: class, id + unexpected (data-test, aria-label)
      expect(result.attrs.size).toBe(4)
      expect(result.attrs.get('class')).toBe('"my-card"')
      expect(result.attrs.get('id')).toBe('"card-1"')
      expect(result.attrs.get('data-test')).toBe('"card-test"')
      expect(result.attrs.get('aria-label')).toBe('"Card"')
    })
  })
})
