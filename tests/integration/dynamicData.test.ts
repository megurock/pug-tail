/**
 * Tests for Phase 3.5: Dynamic data in component attributes
 *
 * These tests verify that variables from frontmatter, CLI data, and config
 * can be passed as component attributes, especially in nested component structures.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { transform } from '@/transform'

const FIXTURES_DIR = join(__dirname, '../fixtures/dynamic-data')

describe('Phase 3.5: Dynamic data in component attributes', () => {
  describe('Nested components with data', () => {
    it('should pass data through nested components', () => {
      const source = readFileSync(
        join(FIXTURES_DIR, 'nested-component-with-data.pug'),
        'utf-8',
      )

      const result = transform(source, {
        output: 'html',
        data: { myData: 'DataFromTest' },
      })

      expect(result.html).toBeDefined()
      expect(result.html).toContain('<p>DataFromTest</p>')
    })

    it('should pass data through nested components with slots', () => {
      const source = readFileSync(
        join(FIXTURES_DIR, 'nested-with-slot.pug'),
        'utf-8',
      )

      // Phase 4: TDZ issue is now resolved with IIFE wrapper
      // Same-name variable passing (navigation=navigation) now works
      const result = transform(source, {
        output: 'html',
        data: {
          navigation: [
            { label: 'Home', url: '/' },
            { label: 'About', url: '/about' },
          ],
        },
      })

      expect(result.html).toBeDefined()
      expect(result.html).toContain('<a href="/">')
      expect(result.html).toContain('Home')
    })

    it('should handle multiple levels of nesting', () => {
      const source = `
component Level3()
  - const { val } = $props
  span= val

component Level2()
  - const { data } = $props
  div
    Level3(val=data)

component Level1()
  - const { myData } = $props
  section
    Level2(data=myData)

Level1(myData=testValue)
`

      const result = transform(source, {
        output: 'html',
        data: { testValue: 'DeepNested' },
      })

      expect(result.html).toBeDefined()
      expect(result.html).toContain('<span>DeepNested</span>')
    })
  })

  describe('Variable detection', () => {
    it('should detect simple variable references', () => {
      const source = `
component Test()
  - const { data } = $props
  p= data

Test(data=myVar)
`

      const result = transform(source, {
        output: 'pug-code',
        data: { myVar: 'TestValue' },
      })

      // Verify that myVar is included as a function parameter
      expect(result.code).toContain('myVar')
      expect(result.code).toMatch(/function.*\bmyVar\b/)
    })

    it('should ignore literal values', () => {
      const source = `
component Test()
  - const { str, num, bool } = $props
  p= str

Test(str="literal" num=42 bool=true)
`

      const result = transform(source, {
        output: 'pug-code',
      })

      // Literals should not be added to function parameters
      expect(result.code).not.toMatch(/void\(/)
    })

    it('should handle mixed literals and variables', () => {
      const source = `
component Test()
  - const { str, data } = $props
  p= str
  p= data

Test(str="literal" data=myVar)
`

      const result = transform(source, {
        output: 'pug-code',
        data: { myVar: 'TestValue' },
      })

      // Phase 3.5: Variables should be in function parameters
      expect(result.code).toMatch(/function.*\bmyVar\b/)
      expect(result.code).toContain('const $props = ')
    })
  })
})
