/**
 * Attribute handling tests (Phase 2)
 *
 * Tests basic attribute passing, fallthrough, type preservation, and manual control.
 */

import { describe, expect, test } from 'vitest'
import { transform } from '@/transform'
import { loadFixture } from '../helpers/loadFixture.js'
import { normalizeHTML } from '../helpers/normalizeHTML.js'

describe('Attribute handling (Phase 2)', () => {
  test('should handle basic attributes', () => {
    const { pug, html: expectedHtml } = loadFixture('attributes', 'basic')
    const result = transform(pug, { output: 'html' })

    expect(result.html).toBeDefined()
    if (result.html && expectedHtml) {
      expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
    }

    // Verify that attributes are passed correctly
    expect(result.html).toContain('<h2>Hello</h2>')
    expect(result.html).toContain('Count: 5')
  })

  test('should handle attribute fallthrough', () => {
    const { pug, html: expectedHtml } = loadFixture('attributes', 'fallthrough')
    const result = transform(pug, { output: 'html' })

    expect(result.html).toBeDefined()
    if (result.html && expectedHtml) {
      expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
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
      expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
    }

    // Verify that types are preserved
    expect(result.html).toContain('String: Hello')
    expect(result.html).toContain('Number: 5')
    expect(result.html).toContain('Boolean: true')
    expect(result.html).toContain('Calculation: 15')
  })

  describe('Manual control (Phase 2.5)', () => {
    test('should respect manual attribute control', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'attributes',
        'manual-control',
      )
      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
      }

      // Verify that manual control is respected
      // Attributes should only be on input.field, not on .wrapper
      expect(result.html).toContain('<div class="wrapper">')
      expect(result.html).not.toContain('<div class="wrapper primary">')
      expect(result.html).toContain(
        '<input class="field primary" type="text" placeholder="Enter..." id="my-input"',
      )
    })

    test('should respect manual attrs split', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'attributes',
        'manual-attrs-split',
      )
      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
      }

      // Verify that attrs splitting is respected
      // .btn-wrapper should not have attributes (manual control)
      expect(result.html).toContain('<div class="btn-wrapper">')
      expect(result.html).not.toContain('<div class="btn-wrapper primary">')
      // button should have classes from attrs (primary, btn-large)
      // size prop is consumed and not passed to HTML
      expect(result.html).toContain(
        '<button class="btn primary btn-large" data-test="btn-1">',
      )
    })
  })

  describe('Shorthand Syntax', () => {
    test('should handle basic shorthand', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'attributes',
        'shorthand-basic',
      )
      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
      }

      // Verify shorthand expansion works
      expect(result.html).toContain('<h2>Hello</h2>')
      expect(result.html).toContain('Count: 5')
    })

    test('should handle mixed shorthand and explicit', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'attributes',
        'shorthand-mixed',
      )
      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
      }

      // Verify mixed syntax works
      expect(result.html).toContain('type="submit"')
      expect(result.html).toContain('disabled>')
      expect(result.html).toContain('Submit')
    })

    test('should handle undefined variable', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'attributes',
        'shorthand-undefined',
      )
      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
      }

      // Verify undefined variable doesn't add attribute
      expect(result.html).toContain('<button>Click</button>')
      expect(result.html).not.toContain('disabled')
    })

    test('should handle boolean attributes', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'attributes',
        'shorthand-boolean',
      )
      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
      }

      // Verify boolean attribute handling (correct behavior)
      expect(result.html).toContain('required')
      expect(result.html).not.toContain('disabled')
      expect(result.html).not.toContain('readonly')
    })

    test('should handle props/attrs with shorthand', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'attributes',
        'shorthand-props-attrs',
      )
      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
      }

      // Verify props/attrs integration with shorthand
      expect(result.html).toContain('class="card custom-card"')
      expect(result.html).toContain('<h2>My Title</h2>')
      expect(result.html).toContain('<h3>My Subtitle</h3>')
      expect(result.html).toContain('<p>Content</p>')
    })
  })
})
