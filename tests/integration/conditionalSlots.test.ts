/**
 * Conditional slots tests
 *
 * Tests slot detection and expansion within control structures (if, else, each, case, while).
 * This is a critical feature for real-world component flexibility.
 */

import { describe, expect, test } from 'vitest'
import { transform } from '@/transform'
import { loadFixture } from '../helpers/loadFixture.js'

describe('Conditional slots', () => {
  describe('Slots inside if statements', () => {
    test('should detect and expand slots inside if blocks', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'conditional-slots',
        'if-slot',
      )

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify slot content is properly inserted
      expect(result.html).toContain('Main content')
      expect(result.html).toContain('Footer content')
    })
  })

  describe('Slots inside if-else statements', () => {
    test('should detect same slot name in different if-else branches', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'conditional-slots',
        'if-else-slot',
      )

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify all three alert types work with the same slot name
      expect(result.html).toContain('Something went wrong!')
      expect(result.html).toContain('Operation completed successfully!')
      expect(result.html).toContain('This is an informational message.')
      // Verify icons are rendered
      expect(result.html).toContain('❌')
      expect(result.html).toContain('✅')
      expect(result.html).toContain('ℹ️')
    })
  })

  describe('Slots inside each loops', () => {
    test('should detect slots inside each loops', () => {
      const { pug, html: expectedHtml } = loadFixture(
        'conditional-slots',
        'each-slot',
      )

      const result = transform(pug, { output: 'html' })

      expect(result.html).toBeDefined()
      if (result.html && expectedHtml) {
        const normalize = (str: string) =>
          str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()

        expect(normalize(result.html)).toBe(normalize(expectedHtml))
      }

      // Verify slot is replicated for each iteration
      expect((result.html?.match(/<strong>Item<\/strong>/g) || []).length).toBe(
        2,
      )
    })
  })

  describe('Error messages', () => {
    test('should provide helpful error when using undefined slot in conditional', () => {
      const pug = `
component Card()
  - const { hasFooter = false } = $props
  .card
    slot(content)
    if hasFooter
      slot(footer)

Card(hasFooter=true)
  slot(content)
    p Content
  slot(nonexistent)
    p Wrong slot name
`

      expect(() => transform(pug, { output: 'html' })).toThrow(/not defined/)
    })
  })
})
