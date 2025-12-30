import { describe, expect, it } from 'vitest'
import { transform } from '@/transform'
import { loadFixture } from '../helpers/loadFixture.js'

describe('Phase 3: props/attrs identifiers', () => {
  describe('Basic functionality', () => {
    it('should handle basic props/attrs usage', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'props-attrs',
        'basic-props-attrs',
      )
      const result = transform(pug, { output: 'html' })
      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()
        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }
    })

    it('should apply default values', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'props-attrs',
        'default-values',
      )
      const result = transform(pug, { output: 'html' })
      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()
        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }
    })

    it('should handle renaming (class: className)', () => {
      const { pug, html: expectedHtml } = loadFixture('props-attrs', 'rename')
      const result = transform(pug, { output: 'html' })
      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()
        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }
    })

    it('should handle partial props specification', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'props-attrs',
        'partial-props',
      )
      const result = transform(pug, { output: 'html' })
      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()
        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }
    })
  })

  describe('Automatic fallthrough', () => {
    it('should automatically categorize unexpected attributes to attrs', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'props-attrs',
        'unexpected-attrs',
      )
      const result = transform(pug, { output: 'html' })
      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()
        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }
    })
  })

  describe('Caching', () => {
    it('should handle multiple calls to the same Component', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'props-attrs',
        'multiple-calls',
      )
      const result = transform(pug, { output: 'html' })
      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()
        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }
    })
  })

  describe('Scope isolation', () => {
    it('should not cause $props collision between multiple components', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'props-attrs',
        'multiple-components-scope',
      )
      const result = transform(pug, { output: 'html' })
      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()
        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }
    })
  })

  describe('Compatibility', () => {
    it('should be compatible with legacy attribute handling', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'props-attrs',
        'legacy-attributes',
      )
      const result = transform(pug, { output: 'html' })
      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()
        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }
    })

    it('should support manual attribute forwarding', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'props-attrs',
        'manual-attributes-forwarding',
      )
      const result = transform(pug, { output: 'html' })
      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()
        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }
    })
  })
})
