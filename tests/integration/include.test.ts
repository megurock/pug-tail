/**
 * Include and extends tests
 *
 * Tests Pug's include and extends features with components.
 */

import { describe, expect, test } from 'vitest'
import { transform } from '@/transform'
import { loadFixture } from '../helpers/loadFixture.js'
import { normalizeHTML } from '../helpers/normalizeHTML.js'

describe('Include and extends', () => {
  describe('Include', () => {
    test('should handle basic include', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'include',
        'basic-include',
      )
      const result = transform(pug, {
        output: 'html',
        filename: 'tests/fixtures/include/basic-include.pug',
      })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
      }

      // Verify that included component is correctly expanded
      expect(result.html).toContain('<div class="card">')
      expect(result.html).toContain('<h1>My Custom Title</h1>')
      expect(result.html).toContain('<p>This is my custom content</p>')
    })

    test('should handle multiple includes', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'include',
        'multiple-includes',
      )
      const result = transform(pug, {
        output: 'html',
        filename: 'tests/fixtures/include/multiple-includes.pug',
      })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
      }

      // Verify that multiple included components are correctly expanded
      expect(result.html).toContain('<div class="card">')
      expect(result.html).toContain('<h1>Contact Form</h1>')
      expect(result.html).toContain('<button class="btn">Submit</button>')
    })
  })

  describe('Extends', () => {
    test('should handle extends with layout component', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'include',
        'extends-layout',
      )
      const result = transform(pug, {
        output: 'html',
        filename: 'tests/fixtures/include/extends-layout.pug',
      })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
      }

      // Verify that extended layout component is correctly expanded
      expect(result.html).toContain('<title>My Page with Extends</title>')
      expect(result.html).toContain('<h1>Main Content</h1>')
      expect(result.html).toContain('<p>© 2024 My Site</p>')
    })

    test('should handle extends with multiple components', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'include',
        'extends-components',
      )
      const result = transform(pug, {
        output: 'html',
        filename: 'tests/fixtures/include/extends-components.pug',
      })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
      }

      // Verify that extended components are correctly expanded
      expect(result.html).toContain('<div class="container">')
      expect(result.html).toContain('<section class="section">')
      expect(result.html).toContain('<h2>About Us</h2>')
      expect(result.html).toContain(
        '<p>We are a company that uses pug-tail</p>',
      )
    })
  })
})
