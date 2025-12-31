/**
 * Fixture-based integration tests
 *
 * Verifies the behavior of the transform function using actual fixture files.
 */

import { describe, expect, test } from 'vitest'
import { transform } from '@/transform'
import { loadFixture } from '../helpers/load-fixture.js'

describe('transform with fixtures', () => {
  describe('simple cases', () => {
    test('should transform simple-component fixture', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'simple',
        'simple-component',
      )

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        // Normalize HTML (ignore whitespace and line break differences)
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify that component definitions and slots are removed
      expect(result.html).not.toContain('component')
      expect(result.html).not.toContain('slot(')
    })
  })

  describe('slots', () => {
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

    describe('default and fallback behavior', () => {
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
        const { pug, html: expectedHtml } = loadFixture(
          'slots',
          'empty-default',
        )

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
        const { pug, html: expectedHtml } = loadFixture(
          'slots',
          'nested-default',
        )

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

        // デフォルトスロットの内容が使用されることを確認
        expect(result.html).toContain('Click me')
        expect(result.html).not.toContain('Submit')
      })

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
  })

  describe('nested components', () => {
    test('should handle nested component calls', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'nested',
        'nested-components',
      )

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify that nested components are correctly expanded
      expect(result.html).toContain('<div class="container">')
      expect(result.html).toContain('<div class="card">')
      expect(result.html).toContain('Nested content')
    })
  })

  describe('complex cases', () => {
    test('should handle multiple components with complex structure', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'complex',
        'multiple-components',
      )

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify that multiple components are correctly expanded
      expect(result.html).toContain('Site Title')
      expect(result.html).toContain('Article Title')
      expect(result.html).toContain('Article content')
      expect(result.html).toContain('Submit')
      expect(result.html).toContain('Link 1')
      expect(result.html).toContain('Link 2')
      expect(result.html).toContain('Copyright 2024')
    })
  })

  describe('edge cases', () => {
    test('should handle empty component', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'edge-cases',
        'empty-component',
      )

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify that empty component is correctly expanded
      expect(result.html).toContain('<div class="empty">')
    })

    test('should handle partial slot provision', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'edge-cases',
        'partial-slots',
      )

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify that provided slots and default slots are correctly used
      expect(result.html).toContain('<h1>Title</h1>')
      expect(result.html).toContain('Default Body')
      expect(result.html).toContain('Default Footer')
    })

    test('should handle multiple root elements', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'edge-cases',
        'multiple-roots',
      )

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify that multiple root elements are preserved
      expect(result.html).toContain('<header>Header</header>')
      expect(result.html).toContain('<main>Content</main>')
      expect(result.html).toContain('<footer>Footer</footer>')
      // Attributes are not passed to root elements (fallthrough disabled)
      expect(result.html).not.toContain('my-layout')
    })
  })

  describe('attributes', () => {
    test('should handle basic attributes', () => {
      const { pug, html: expectedHtml } = loadFixture('attributes', 'basic')

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify that attributes are passed correctly
      expect(result.html).toContain('<h2>Hello</h2>')
      expect(result.html).toContain('Count: 5')
    })

    test('should handle attribute fallthrough', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'attributes',
        'fallthrough',
      )

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify that attributes are passed through to root element
      expect(result.html).toContain('class="card my-card"')
      expect(result.html).toContain('id="card-1"')
      expect(result.html).toContain('data-test="value"')
    })

    test('should preserve attribute types', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'attributes',
        'type-preservation',
      )

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify that types are preserved
      expect(result.html).toContain('String: Hello')
      expect(result.html).toContain('Number: 5')
      expect(result.html).toContain('Boolean: true')
      expect(result.html).toContain('Calculation: 15')
    })
  })
})
