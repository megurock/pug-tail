/**
 * Slot system tests
 *
 * Tests named slots, default slots, slot fallback behavior, and slot nesting.
 */

import { describe, expect, test } from 'vitest'
import { transform } from '@/transform'
import { loadFixture } from '../helpers/loadFixture.js'

describe('Slot system', () => {
  describe('Basic slot functionality', () => {
    test('should handle multiple slots', () => {
      const { pug, html: expectedHtml } = loadFixture('slots', 'multiple-slots')

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify that each slot's content is correctly placed
      expect(result.html).toContain('<h1>Title</h1>')
      expect(result.html).toContain('<p>Content</p>')
      expect(result.html).toContain('<button>OK</button>')
    })

    test('should use default slot content when no slot is provided', () => {
      const { pug, html: expectedHtml } = loadFixture('slots', 'default-slot')

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify that default slot content is used
      expect(result.html).toContain('No message provided')
    })
  })

  describe('Default and fallback behavior', () => {
    test('should use all default slots when none are provided', () => {
      const { pug, html: expectedHtml } = loadFixture('slots', 'all-defaults')

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify that all default slots are used
      expect(result.html).toContain('Default Title')
      expect(result.html).toContain('Default content here')
      expect(result.html).toContain('Default footer text')
    })

    test('should mix provided slots with default slots', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'slots',
        'mixed-default-provided',
      )

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify that provided slot takes precedence and defaults are used for the rest
      expect(result.html).toContain('<h1>Custom Header</h1>')
      expect(result.html).toContain('Default Body')
      expect(result.html).toContain('Default Footer')
      // Default header is not used
      expect(result.html).not.toContain('Default Header')
    })

    test('should handle empty default slot when slot is provided', () => {
      const { pug, html: expectedHtml } = loadFixture('slots', 'empty-default')

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify that the provided slot is used
      expect(result.html).toContain('Custom content')
    })

    test('should handle empty default slot when no slot is provided', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'slots',
        'empty-default-no-provided',
      )

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify that empty default slot is used and container becomes empty
      expect(result.html).toContain('<div class="container">')
      expect(result.html).not.toContain('Custom content')
    })

    test('should handle nested default slot content', () => {
      const { pug, html: expectedHtml } = loadFixture('slots', 'nested-default')

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify that provided slot takes precedence and nested default is not used
      expect(result.html).toContain('<h1>Custom Header</h1>')
      expect(result.html).toContain('Default body content')
      // Nested default header content is not used
      expect(result.html).not.toContain('Default Header Title')
      expect(result.html).not.toContain('Default subtitle')
    })
  })

  describe('Named "default" slot', () => {
    test('should handle slot named "default" with provided content', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'slots',
        'default-slot-name',
      )

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify that the provided slot is used
      expect(result.html).toContain('Submit')
      expect(result.html).not.toContain('Click me')
    })

    test('should handle slot named "default" with fallback to default content', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'slots',
        'default-slot-name-no-provided',
      )

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify that default slot content is used
      expect(result.html).toContain('Click me')
      expect(result.html).not.toContain('Submit')
    })
  })

  describe('Unnamed slots', () => {
    test('should handle unnamed slot (default slot) with direct child content', () => {
      const { pug, html: expectedHtml } = loadFixture('slots', 'unnamed-slot')

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify that direct child elements are placed in unnamed slot
      expect(result.html).toContain('<p>Hello!</p>')
    })
  })

  describe('Component in component with slot', () => {
    test('should handle slot passing when calling component inside component definition', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'nested',
        'component-in-component-with-slot',
      )

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify that slot content from Outer is passed to Inner
      expect(result.html).toContain('Outer Start')
      expect(result.html).toContain('Content from Outer')
      expect(result.html).toContain('Outer End')
      // Default content should not appear
      expect(result.html).not.toContain('Default Inner Content')
    })
  })
})
