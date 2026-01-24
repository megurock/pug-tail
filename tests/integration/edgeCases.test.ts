/**
 * Edge case tests
 *
 * Tests unusual scenarios, edge cases, and complex control flow.
 */

import { describe, expect, test } from 'vitest'
import { transform } from '@/transform'
import { loadFixture } from '../helpers/loadFixture.js'
import { normalizeHTML } from '../helpers/normalizeHTML.js'

describe('Edge cases', () => {
  test('should handle empty component', () => {
    const { pug, html: expectedHtml } = loadFixture(
      'edge-cases',
      'empty-component',
    )
    const result = transform(pug, { output: 'html' })

    expect(result.html).toBeDefined()
    if (result.html && expectedHtml) {
      expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
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
      expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
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
      expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
    }

    // Verify that multiple root elements are preserved
    expect(result.html).toContain('<header>Header</header>')
    expect(result.html).toContain('<main>Content</main>')
    expect(result.html).toContain('<footer>Footer</footer>')
    // Attributes are not passed to root elements (fallthrough disabled)
    expect(result.html).not.toContain('my-layout')
  })

  test('should handle slot in conditional (if/else)', () => {
    const { pug, html: expectedHtml } = loadFixture(
      'edge-cases',
      'conditional-slot',
    )
    const result = transform(pug, { output: 'html' })

    expect(result.html).toBeDefined()
    if (result.html && expectedHtml) {
      expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
    }

    // Verify that slot is correctly expanded in conditional
    expect(result.html).toContain('<button class="btn-primary">')
    expect(result.html).toContain('Click Me')
    expect(result.html).not.toContain('<slot>')
    expect(result.html).not.toContain('</slot>')
  })

  test('should handle each loop in component', () => {
    const { pug, html: expectedHtml } = loadFixture('edge-cases', 'each-loop')
    const result = transform(pug, { output: 'html' })

    expect(result.html).toBeDefined()
    if (result.html && expectedHtml) {
      expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
    }

    // Verify that each loop correctly iterates and renders items
    expect(result.html).toContain('<ul')
    expect(result.html).toContain('<li>Apple</li>')
    expect(result.html).toContain('<li>Banana</li>')
    expect(result.html).toContain('<li>Cherry</li>')
    // Should have 3 list items (one for each item in array)
    const matches = result.html?.match(/<li>[^<]+<\/li>/g)
    expect(matches).toHaveLength(3)
  })

  test('should handle unless condition in component', () => {
    const { pug, html: expectedHtml } = loadFixture(
      'edge-cases',
      'unless-condition',
    )
    const result = transform(pug, { output: 'html' })

    expect(result.html).toBeDefined()
    if (result.html && expectedHtml) {
      expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
    }

    // Verify that unless condition works correctly
    expect(result.html).toContain('<div class="alert">')
    expect(result.html).toContain('This should be visible')
  })

  test('should handle while loop in component', () => {
    const { pug, html: expectedHtml } = loadFixture('edge-cases', 'while-loop')
    const result = transform(pug, { output: 'html' })

    expect(result.html).toBeDefined()
    if (result.html && expectedHtml) {
      expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
    }

    // Verify that while loop correctly iterates
    expect(result.html).toContain('<ul')
    expect(result.html).toContain('<li>0</li>')
    expect(result.html).toContain('<li>1</li>')
    expect(result.html).toContain('<li>2</li>')
    // Should have 3 list items (0, 1, 2)
    const matches = result.html?.match(/<li>\d+<\/li>/g)
    expect(matches).toHaveLength(3)
  })
})
