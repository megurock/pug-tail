/**
 * Control structures tests
 *
 * Tests component expansion within all Pug control structures:
 * - each loops
 * - if/else conditionals
 * - unless conditionals
 * - case/when statements
 * - while loops
 * - nested structures
 */

import { describe, expect, test } from 'vitest'
import { transform } from '@/transform'
import { loadFixture } from '../helpers/loadFixture.js'
import { normalizeHTML } from '../helpers/normalizeHTML.js'

describe('Control structures with components', () => {
  describe('Each loops', () => {
    test('should expand components inside each loops', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'control-structures',
        'each-loop',
      )
      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
      }

      // Verify components are expanded (no <Card> tags)
      expect(result.html).not.toContain('<Card')
      // Verify correct number of cards
      expect((result.html?.match(/<div class="card">/g) || []).length).toBe(3)
    })
  })

  describe('If/Else conditionals', () => {
    test('should expand components inside if/else blocks', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'control-structures',
        'if-else',
      )
      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
      }

      // Verify components are expanded
      expect(result.html).not.toContain('<Card')
      // Verify correct content (if branch, not else)
      expect(result.html).toContain('Condition True')
      expect(result.html).not.toContain('Condition False')
    })
  })

  describe('Unless conditionals', () => {
    test('should expand components inside unless blocks', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'control-structures',
        'unless',
      )
      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
      }

      // Verify components are expanded
      expect(result.html).not.toContain('<Card')
      // Verify unless block executed
      expect(result.html).toContain('Unless Block')
    })
  })

  describe('Case/When statements', () => {
    test('should expand components inside case/when blocks', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'control-structures',
        'case-when',
      )
      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
      }

      // Verify components are expanded
      expect(result.html).not.toContain('<Card')
      // Verify correct case branch executed
      expect(result.html).toContain('Case Two')
      expect(result.html).not.toContain('Case One')
      expect(result.html).not.toContain('Case Three')
      expect(result.html).not.toContain('Case Default')
    })
  })

  describe('While loops', () => {
    test('should expand components inside while loops', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'control-structures',
        'while-loop',
      )
      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
      }

      // Verify components are expanded
      expect(result.html).not.toContain('<Card')
      // Verify correct number of iterations
      expect((result.html?.match(/<div class="card">/g) || []).length).toBe(3)
      // Verify loop content
      expect(result.html).toContain('Loop 1')
      expect(result.html).toContain('Loop 2')
      expect(result.html).toContain('Loop 3')
    })
  })

  describe('Nested structures', () => {
    test('should expand components inside nested each + if blocks', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'control-structures',
        'nested-each-if',
      )
      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
      }

      // Verify components are expanded
      expect(result.html).not.toContain('<Card')
      // Verify correct number of cards
      expect((result.html?.match(/<div class="card">/g) || []).length).toBe(3)
      // Verify nested logic works
      expect(result.html).toContain('A Even')
      expect(result.html).toContain('B Odd')
      expect(result.html).toContain('C Even')
    })
  })

  describe('Complex nesting', () => {
    test('should expand components inside complex nested structures', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'control-structures',
        'complex-nesting',
      )
      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
      }

      // Verify components are expanded
      expect(result.html).not.toContain('<Card')
      // Verify correct number of cards
      expect((result.html?.match(/<div class="card">/g) || []).length).toBe(3)
      // Verify complex nested logic works
      expect(result.html).toContain('X First')
      expect(result.html).toContain('Y Middle')
      expect(result.html).toContain('Z Last')
    })
  })

  describe('Regression: Component definitions should be removed', () => {
    test('should not leave component definitions in output', () => {
      const { pug } = loadFixture('control-structures', 'each-loop')
      const result = transform(pug, { output: 'html' })

      // Verify component definitions are removed
      expect(result.html).not.toContain('component Card')
      expect(result.html).not.toContain('component ')
    })
  })

  describe('Integration: Multiple control structures', () => {
    test('should handle all control structures in combination', () => {
      // Test fixture that uses multiple control structures
      const pug = `
component Card()
  - const { title } = $props
  .card
    h3= title

- const items = ['A', 'B']
- const show = true

if show
  each item in items
    Card(title=item)
`
      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      expect(result.html).not.toContain('<Card')
      expect((result.html?.match(/<div class="card">/g) || []).length).toBe(2)
      expect(result.html).toContain('A')
      expect(result.html).toContain('B')
    })
  })
})
