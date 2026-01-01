/**
 * Unit tests for frontmatter parser.
 */

import { describe, expect, it } from 'vitest'
import { parseFrontmatter } from '../../../src/cli/frontmatterParser'

describe('frontmatterParser', () => {
  describe('parseFrontmatter', () => {
    it('should parse valid frontmatter', () => {
      const source = `---
title: My Page
year: 2025
---
doctype html
html
  head
    title= title`

      const result = parseFrontmatter(source)

      expect(result.hasFrontmatter).toBe(true)
      expect(result.data).toEqual({
        title: 'My Page',
        year: 2025,
      })
      expect(result.content).toBe(`doctype html
html
  head
    title= title`)
    })

    it('should handle file without frontmatter', () => {
      const source = `doctype html
html
  head
    title Hello`

      const result = parseFrontmatter(source)

      expect(result.hasFrontmatter).toBe(false)
      expect(result.data).toEqual({})
      expect(result.content).toBe(source)
    })

    it('should handle empty frontmatter', () => {
      const source = `---
---
h1 Hello`

      const result = parseFrontmatter(source)

      expect(result.hasFrontmatter).toBe(true)
      expect(result.data).toEqual({})
      expect(result.content).toBe('h1 Hello')
    })

    it('should handle complex YAML data', () => {
      const source = `---
title: My Page
meta:
  description: A test page
  keywords:
    - test
    - page
navigation:
  - label: Home
    url: /
  - label: About
    url: /about
---
h1= title`

      const result = parseFrontmatter(source)

      expect(result.hasFrontmatter).toBe(true)
      expect(result.data).toHaveProperty('title', 'My Page')
      expect(result.data).toHaveProperty('meta')
      expect(result.data).toHaveProperty('navigation')

      const meta = result.data.meta as Record<string, unknown>
      expect(meta.description).toBe('A test page')

      const navigation = result.data.navigation as Array<unknown>
      expect(navigation).toHaveLength(2)
    })

    it('should handle frontmatter with only opening delimiter', () => {
      const source = `---
title: My Page
h1 Hello`

      const result = parseFrontmatter(source)

      expect(result.hasFrontmatter).toBe(false)
      expect(result.data).toEqual({})
      expect(result.content).toBe(source)
    })

    it('should throw error for invalid YAML', () => {
      const source = `---
title: My Page
  invalid: yaml: structure
---
h1 Hello`

      expect(() => parseFrontmatter(source)).toThrow(
        'Failed to parse frontmatter YAML',
      )
    })

    it('should handle frontmatter with trailing whitespace', () => {
      const source = `---
title: My Page
year: 2025
---
h1 Hello`

      const result = parseFrontmatter(source)

      expect(result.hasFrontmatter).toBe(true)
      expect(result.data).toEqual({
        title: 'My Page',
        year: 2025,
      })
    })

    it('should preserve indentation in content', () => {
      const source = `---
title: Test
---
doctype html
html
  body
    h1= title
    p Indented content`

      const result = parseFrontmatter(source)

      expect(result.content).toContain('  body')
      expect(result.content).toContain('    h1= title')
      expect(result.content).toContain('    p Indented content')
    })

    it('should handle numeric and boolean values', () => {
      const source = `---
port: 3000
enabled: true
ratio: 1.5
disabled: false
---
h1 Test`

      const result = parseFrontmatter(source)

      expect(result.data).toEqual({
        port: 3000,
        enabled: true,
        ratio: 1.5,
        disabled: false,
      })
    })
  })
})
