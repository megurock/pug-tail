/**
 * Tests for the integrated transform function.
 */

import { describe, expect, test, vi } from 'vitest'
import { transform } from '@/transform'

describe('transform', () => {
  test('should transform a simple component into HTML', () => {
    const source = `
component Card()
  .card
    slot(header)
      p Default Header
    slot(body)
      p Default Body

Card()
  slot(header)
    h1 Title
  slot(body)
    p Content
`

    const result = transform(source, { output: 'html' })

    expect(result.html).toBeDefined()
    expect(result.html).toContain('<h1>Title</h1>')
    expect(result.html).toContain('<p>Content</p>')
    expect(result.html).not.toContain('component')
    expect(result.html).not.toContain('slot')
  })

  test('should use default slot content', () => {
    const source = `
component Card()
  .card
    slot(header)
      p Default Header

Card()
`

    const result = transform(source, { output: 'html' })

    expect(result.html).toBeDefined()
    expect(result.html).toContain('<p>Default Header</p>')
  })

  test('should output an AST', () => {
    const source = `
component Card()
  .card
    slot(header)

Card()
  slot(header)
    h1 Title
`

    const result = transform(source, { output: 'ast' })

    expect(result.ast).toBeDefined()
    expect(result.ast?.type).toBe('Block')
    expect(result.ast?.nodes.length).toBeGreaterThan(0)
  })

  test('should output Pug code', () => {
    const source = `
component Card()
  .card
    slot(header)

Card()
  slot(header)
    h1 Title
`

    const result = transform(source, { output: 'pug-code' })

    expect(result.code).toBeDefined()
    if (result.code) {
      expect(typeof result.code).toBe('string')
      expect(result.code.length).toBeGreaterThan(0)
    }
  })

  test('should transform multiple components', () => {
    const source = `
component Card()
  .card
    slot(header)

component Button()
  button.button
    slot(default)
      span Click me

Card()
  slot(header)
    h1 Title
    Button()
`

    const result = transform(source, { output: 'html' })

    expect(result.html).toBeDefined()
    expect(result.html).toContain('<h1>Title</h1>')
    expect(result.html).toContain('button')
  })

  test('should pass the filename option', () => {
    const source = `
component Card()
  .card
    slot(header)

Card()
  slot(header)
    h1 Title
`

    const result = transform(source, {
      output: 'html',
      filename: 'test.pug',
    })

    expect(result.html).toBeDefined()
  })

  test('should work in debug mode', () => {
    const source = `
component Card()
  .card
    slot(header)

Card()
  slot(header)
    h1 Title
`

    // Mock console.log to suppress debug output during tests
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    try {
      // Verify that no errors occur in debug mode.
      const result = transform(source, {
        output: 'html',
        debug: true,
      })

      expect(result.html).toBeDefined()
      // Verify that debug output was called
      expect(consoleLogSpy).toHaveBeenCalled()
    } finally {
      // Restore console.log
      consoleLogSpy.mockRestore()
    }
  })
})
