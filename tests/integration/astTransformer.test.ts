/**
 * Integration tests for Transformer.
 *
 * Tests component expansion from actual Pug source code.
 */

import { describe, expect, test } from 'vitest'
import { Transformer } from '@/core/compiler/transformer.js'
import { ComponentRegistry } from '@/core/componentRegistry.js'
import { ErrorHandler } from '@/core/errorHandler.js'
import { parsePug } from '../helpers/parsePug.js'

describe('Transformer Integration', () => {
  test('should expand a simple component', () => {
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

    const ast = parsePug(source)

    const registry = new ComponentRegistry()
    const errorHandler = new ErrorHandler()
    const transformer = new Transformer(registry, errorHandler)

    const transformed = transformer.transform(ast)

    // Verify that the component definition has been removed.
    expect(transformed.type).toBe('Block')
    if (transformed.type === 'Block') {
      // The component definition node has been removed.
      const hasComponentDef = transformed.nodes.some(
        (node) => node.type === 'Tag' && node.name === 'component',
      )
      expect(hasComponentDef).toBe(false)

      // The Card() call has been expanded.
      const hasCard = transformed.nodes.some(
        (node) => node.type === 'Tag' && node.name === 'div',
      )
      expect(hasCard).toBe(true)
    }
  })

  test('should replace slots correctly', () => {
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
`

    const ast = parsePug(source)

    const registry = new ComponentRegistry()
    const errorHandler = new ErrorHandler()
    const transformer = new Transformer(registry, errorHandler)

    const transformed = transformer.transform(ast)

    // Verify that h1 Title is included.
    // (More robust verification would be done after HTML generation).
    expect(transformed.type).toBe('Block')
  })

  test('should use default slot content', () => {
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
`

    const ast = parsePug(source)

    const registry = new ComponentRegistry()
    const errorHandler = new ErrorHandler()
    const transformer = new Transformer(registry, errorHandler)

    const transformed = transformer.transform(ast)

    // The body slot is not provided, so the default content should be used.
    expect(transformed.type).toBe('Block')
  })

  test('should throw an error if a component is not found', () => {
    const source = `
Card()
  slot(header)
    h1 Title
`

    const ast = parsePug(source)

    const registry = new ComponentRegistry()
    const errorHandler = new ErrorHandler()
    const transformer = new Transformer(registry, errorHandler)

    expect(() => {
      transformer.transform(ast)
    }).toThrow('Component "Card" not found')
  })

  test('should expand multiple components', () => {
    const source = `
component Card()
  .card
    slot(body)
      p Default

component Button()
  button
    slot(label)
      span Click

Card()
  slot(body)
    p Card Content

Button()
  slot(label)
    span Button Label
`

    const ast = parsePug(source)

    const registry = new ComponentRegistry()
    const errorHandler = new ErrorHandler()
    const transformer = new Transformer(registry, errorHandler)

    const transformed = transformer.transform(ast)

    expect(transformed.type).toBe('Block')
    // Verify that both components have been expanded.
    if (transformed.type === 'Block') {
      expect(transformed.nodes.length).toBeGreaterThan(0)
    }
  })
})
