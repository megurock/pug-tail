/**
 * Integration tests for component detection.
 *
 * Tests for detecting component definitions from actual Pug source code.
 */

import walk from 'pug-walk'
import { describe, expect, test } from 'vitest'
import type { Node, Tag } from '../../src/types/pug.js'
import {
  extractComponentDefinition,
  isComponentDefinitionNode,
} from '../../src/utils/componentDetector.js'
import { parsePug } from '../helpers/parsePug.js'

describe('Component Detection Integration', () => {
  test('should detect a component definition from actual Pug source', () => {
    const source = `
component Card()
  .card
    .card-header
      slot(header)
        p default header
    .card-body
      slot(body)
        p default body
    .card-footer
      slot(footer)
        p default footer
`

    const ast = parsePug(source)

    // Detect the component definition node.
    let componentNode: Tag | null = null

    walk(ast, (node: Node) => {
      if (isComponentDefinitionNode(node)) {
        componentNode = node
      }
    })

    expect(componentNode).not.toBeNull()

    if (componentNode) {
      const definition = extractComponentDefinition(componentNode)

      expect(definition.name).toBe('Card')
      expect(definition.slots.size).toBe(3)
      expect(definition.slots.has('header')).toBe(true)
      expect(definition.slots.has('body')).toBe(true)
      expect(definition.slots.has('footer')).toBe(true)

      // Check the default content of the slot.
      const headerSlot = definition.slots.get('header')
      expect(headerSlot).toBeDefined()
      if (headerSlot) {
        expect(headerSlot.placeholder.block?.nodes.length).toBeGreaterThan(0)
      }
    }
  })

  test('should detect multiple component definitions', () => {
    const source = `
component Card()
  .card
    slot(body)
      p default

component Button()
  button
    slot(label)
      span Click
`

    const ast = parsePug(source)

    const components: Tag[] = []

    walk(ast, (node: Node) => {
      if (isComponentDefinitionNode(node)) {
        components.push(node)
      }
    })

    expect(components).toHaveLength(2)

    const cardComponent = components[0]
    const buttonComponent = components[1]

    expect(cardComponent).toBeDefined()
    expect(buttonComponent).toBeDefined()

    if (cardComponent && buttonComponent) {
      const cardDef = extractComponentDefinition(cardComponent)
      const buttonDef = extractComponentDefinition(buttonComponent)

      expect(cardDef.name).toBe('Card')
      expect(buttonDef.name).toBe('Button')
      expect(cardDef.slots.size).toBe(1)
      expect(buttonDef.slots.size).toBe(1)
    }
  })

  test('should extract slot names from the slot(name="value") format', () => {
    const source = `
component Card()
  .card
    slot(name="header")
      p Header
    slot(name="body")
      p Body
`

    const ast = parsePug(source)

    let componentNode: Tag | null = null

    walk(ast, (node: Node) => {
      if (isComponentDefinitionNode(node)) {
        componentNode = node
      }
    })

    expect(componentNode).not.toBeNull()

    if (componentNode) {
      const definition = extractComponentDefinition(componentNode)

      expect(definition.slots.has('header')).toBe(true)
      expect(definition.slots.has('body')).toBe(true)
    }
  })

  test('should detect nested slots', () => {
    const source = `
component Layout()
  .layout
    .header
      slot(header)
        p Default header
    .content
      .sidebar
        slot(sidebar)
          p Default sidebar
      .main
        slot(main)
          p Default main
`

    const ast = parsePug(source)

    let componentNode: Tag | null = null

    walk(ast, (node: Node) => {
      if (isComponentDefinitionNode(node)) {
        componentNode = node
      }
    })

    expect(componentNode).not.toBeNull()

    if (componentNode) {
      const definition = extractComponentDefinition(componentNode)

      expect(definition.slots.size).toBe(3)
      expect(definition.slots.has('header')).toBe(true)
      expect(definition.slots.has('sidebar')).toBe(true)
      expect(definition.slots.has('main')).toBe(true)
    }
  })
})
