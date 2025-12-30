/**
 * E2E tests for the CLI.
 *
 * Verifies the CLI's behavior using actual Pug files.
 */

import { existsSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { transform } from '@/transform'

describe('E2E: CLI Integration Tests', () => {
  const testDir = resolve(__dirname, '../fixtures')

  afterEach(() => {
    // Clean up temporary files created during tests.
    const tempFiles = [
      resolve(testDir, 'output.html'),
      resolve(testDir, 'output.json'),
      resolve(testDir, 'output.js'),
    ]
    for (const file of tempFiles) {
      if (existsSync(file)) {
        unlinkSync(file)
      }
    }
  })

  test('Complex case with multiple components', () => {
    const source = `
component Container()
  .container
    slot(header)
      h1 Default Header
    slot(content)
      p Default Content
    slot(footer)
      p Default Footer

component Card()
  .card
    slot(title)
      h2 Default Title
    slot(body)
      p Default Body

Container()
  slot(header)
    h1 Main Header
  slot(content)
    Card()
      slot(title)
        h2 Card Title
      slot(body)
        p Card Body
  slot(footer)
    p Main Footer
`

    const result = transform(source, { output: 'html' })

    expect(result.html).toBeDefined()
    expect(result.html).toContain('Main Header')
    expect(result.html).toContain('Card Title')
    expect(result.html).toContain('Card Body')
    expect(result.html).toContain('Main Footer')
    expect(result.html).not.toContain('component')
    expect(result.html).not.toContain('slot')
  })

  test('Nested component calls', () => {
    const source = `
component Outer()
  .outer
    slot(content)

component Inner()
  .inner
    slot(text)
      p Default Inner Text

Outer()
  slot(content)
    Inner()
      slot(text)
        p Custom Inner Text
`

    const result = transform(source, { output: 'html' })

    expect(result.html).toBeDefined()
    expect(result.html).toContain('Custom Inner Text')
    expect(result.html).toContain('outer')
    expect(result.html).toContain('inner')
  })

  test('Component with multiple slots', () => {
    const source = `
component Layout()
  .layout
    header
      slot(header)
    main
      slot(main)
    aside
      slot(sidebar)
    footer
      slot(footer)

Layout()
  slot(header)
    h1 Site Title
  slot(main)
    article
      h2 Article Title
      p Article content
  slot(sidebar)
    nav
      ul
        li Link 1
        li Link 2
  slot(footer)
    p Copyright 2024
`

    const result = transform(source, { output: 'html' })

    expect(result.html).toBeDefined()
    expect(result.html).toContain('Site Title')
    expect(result.html).toContain('Article Title')
    expect(result.html).toContain('Article content')
    expect(result.html).toContain('Link 1')
    expect(result.html).toContain('Link 2')
    expect(result.html).toContain('Copyright 2024')
  })

  test('Using only default slot content', () => {
    const source = `
component Alert()
  .alert
    slot(message)
      p No message provided

Alert()
`

    const result = transform(source, { output: 'html' })

    expect(result.html).toBeDefined()
    expect(result.html).toContain('No message provided')
  })

  test('Empty component definition', () => {
    const source = `
component Empty()
  .empty

Empty()
`

    const result = transform(source, { output: 'html' })

    expect(result.html).toBeDefined()
    expect(result.html).toContain('empty')
  })

  test('AST output format', () => {
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
    // Verify that the AST does not contain 'component' or 'slot'.
    const astStr = JSON.stringify(result.ast)
    expect(astStr).not.toContain('"name":"component"')
    expect(astStr).not.toContain('"name":"slot"')
  })

  test('Pug code output format', () => {
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
    expect(typeof result.code).toBe('string')
    // Verify that the generated code does not contain 'component' or 'slot'.
    expect(result.code).not.toContain('component')
    expect(result.code).not.toContain('slot(')
  })
})
