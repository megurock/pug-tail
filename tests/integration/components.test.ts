/**
 * Component transformation tests
 *
 * Tests basic component definition, expansion, and nesting behavior.
 */

import { describe, expect, test } from 'vitest'
import { transform } from '@/transform'
import { loadFixture } from '../helpers/loadFixture.js'
import { normalizeHTML } from '../helpers/normalizeHTML.js'

describe('Component transformation', () => {
  describe('Basic components', () => {
    test('should transform simple component', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'components',
        'simple-component',
      )
      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
      }

      // Verify that component definitions and slots are removed
      expect(result.html).not.toContain('component')
      expect(result.html).not.toContain('slot(')
    })
  })

  describe('Nested components', () => {
    test('should handle nested component calls', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'nested',
        'nested-components',
      )
      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
      }

      // Verify that nested components are correctly expanded
      expect(result.html).toContain('<div class="container">')
      expect(result.html).toContain('<div class="card">')
      expect(result.html).toContain('Nested content')
    })
  })

  describe('Complex structures', () => {
    test('should handle multiple components with complex structure', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'complex',
        'multiple-components',
      )
      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        expect(normalizeHTML(result.html)).toBe(normalizeHTML(expectedHtml))
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
})
