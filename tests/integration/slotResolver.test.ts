/**
 * Integration tests for SlotResolver.
 *
 * Tests for extracting slots from the component call side from actual Pug source code.
 */

import walk from 'pug-walk'
import { describe, expect, test } from 'vitest'
import { SlotResolver } from '../../src/core/slotResolver.js'
import type { Node, Tag } from '../../src/types/pug.js'
import { isCapitalizedTag } from '../../src/utils/astHelpers.js'
import { parsePug } from '../helpers/parsePug.js'

describe('SlotResolver Integration', () => {
  test('should extract slots from the component call side from actual Pug source', () => {
    const source = `
Card()
  slot(header)
    h1 Title
  slot(body)
    p Content
  slot(footer)
    button OK
`

    const ast = parsePug(source)

    // Detect the component call node.
    let callNode: Tag | null = null

    walk(ast, (node: Node) => {
      if (isCapitalizedTag(node)) {
        callNode = node
      }
    })

    expect(callNode).not.toBeNull()

    if (callNode) {
      const resolver = new SlotResolver()
      const slots = resolver.extractProvidedSlots(callNode)

      expect(slots.size).toBe(3)
      expect(slots.has('header')).toBe(true)
      expect(slots.has('body')).toBe(true)
      expect(slots.has('footer')).toBe(true)

      // Check the content of the header slot.
      const headerSlot = slots.get('header')
      expect(headerSlot).toBeDefined()
      if (headerSlot) {
        expect(headerSlot.nodes.length).toBeGreaterThan(0)
        const firstNode = headerSlot.nodes[0]
        if (firstNode && firstNode.type === 'Tag') {
          expect(firstNode.name).toBe('h1')
        }
      }

      // Check the content of the body slot.
      const bodySlot = slots.get('body')
      expect(bodySlot).toBeDefined()
      if (bodySlot) {
        expect(bodySlot.nodes.length).toBeGreaterThan(0)
        const firstNode = bodySlot.nodes[0]
        if (firstNode && firstNode.type === 'Tag') {
          expect(firstNode.name).toBe('p')
        }
      }

      // Check the content of the footer slot.
      const footerSlot = slots.get('footer')
      expect(footerSlot).toBeDefined()
      if (footerSlot) {
        expect(footerSlot.nodes.length).toBeGreaterThan(0)
        const firstNode = footerSlot.nodes[0]
        if (firstNode && firstNode.type === 'Tag') {
          expect(firstNode.name).toBe('button')
        }
      }
    }
  })

  test('should be able to extract slot names from the slot(name="value") format', () => {
    const source = `
Card()
  slot(name="header")
    h1 Title
  slot(name="body")
    p Content
`

    const ast = parsePug(source)

    let callNode: Tag | null = null

    walk(ast, (node: Node) => {
      if (isCapitalizedTag(node)) {
        callNode = node
      }
    })

    expect(callNode).not.toBeNull()

    if (callNode) {
      const resolver = new SlotResolver()
      const slots = resolver.extractProvidedSlots(callNode)

      expect(slots.size).toBe(2)
      expect(slots.has('header')).toBe(true)
      expect(slots.has('body')).toBe(true)
    }
  })

  test('should throw an error for duplicate slot names', () => {
    const source = `
Card()
  slot(header)
    h1 Title 1
  slot(header)
    h1 Title 2
`

    const ast = parsePug(source)

    let callNode: Tag | null = null

    walk(ast, (node: Node) => {
      if (isCapitalizedTag(node)) {
        callNode = node
      }
    })

    expect(callNode).not.toBeNull()

    if (!callNode) {
      throw new Error('callNode should not be null')
    }

    const resolver = new SlotResolver()
    const node: Tag = callNode

    expect(() => {
      resolver.extractProvidedSlots(node)
    }).toThrow('Duplicate slot "header"')
  })

  test('should return an empty Map for a component call with no slots', () => {
    const source = `
Card()
`

    const ast = parsePug(source)

    let callNode: Tag | null = null

    walk(ast, (node: Node) => {
      if (isCapitalizedTag(node)) {
        callNode = node
      }
    })

    expect(callNode).not.toBeNull()

    if (callNode) {
      const resolver = new SlotResolver()
      const slots = resolver.extractProvidedSlots(callNode)

      expect(slots.size).toBe(0)
    }
  })

  test('should be able to extract multiple slots regardless of order', () => {
    const source = `
Card()
  slot(footer)
    button OK
  slot(header)
    h1 Title
  slot(body)
    p Content
`

    const ast = parsePug(source)

    let callNode: Tag | null = null

    walk(ast, (node: Node) => {
      if (isCapitalizedTag(node)) {
        callNode = node
      }
    })

    expect(callNode).not.toBeNull()

    if (callNode) {
      const resolver = new SlotResolver()
      const slots = resolver.extractProvidedSlots(callNode)

      // All slots are extracted, regardless of order.
      expect(slots.size).toBe(3)
      expect(slots.has('header')).toBe(true)
      expect(slots.has('body')).toBe(true)
      expect(slots.has('footer')).toBe(true)
    }
  })
})
