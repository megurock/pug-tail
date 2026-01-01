import { describe, expect, it } from 'vitest'
import { transform } from '@/transform'
import { loadFixture } from '../helpers/load-fixture.js'

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

  describe('Compatibility', () => {
    it('should maintain Phase 2 compatibility (using attributes)', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'props-attrs',
        'phase2-compatibility',
      )
      const result = transform(pug, { output: 'html' })
      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()
        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }
    })

    it('should integrate with Phase 2.5 (manual control)', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'props-attrs',
        'phase25-integration',
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
