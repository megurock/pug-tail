/**
 * Tests for ComponentRegistry.ts.
 */

import { beforeEach, describe, expect, test } from 'vitest'
import { ComponentRegistry } from '@/core/componentRegistry'
import type { ComponentDefinition, SlotDefinition } from '@/types'
import type { Block, Tag } from '@/types/pug'

describe('ComponentRegistry', () => {
  let registry: ComponentRegistry

  // Dummy Block for testing.
  const dummyBlock: Block = {
    type: 'Block',
    nodes: [],
    line: 1,
  }

  // Dummy Tag for testing.
  const dummySlotTag: Tag = {
    type: 'Tag',
    name: 'slot',
    selfClosing: false,
    block: dummyBlock,
    attrs: [{ name: 'header', val: true, mustEscape: true }],
    attributeBlocks: [],
    isInline: false,
    line: 2,
    column: 3,
  }

  // Creates a ComponentDefinition for testing.
  function createComponentDefinition(
    name: string,
    line = 1,
    column = 1,
    filename?: string,
  ): ComponentDefinition {
    const slotDef: SlotDefinition = {
      name: 'header',
      placeholder: dummySlotTag,
      location: { line: 2, column: 3 },
    }

    return {
      name,
      body: dummyBlock,
      slots: new Map([['header', slotDef]]),
      location: { line, column, filename },
    }
  }

  beforeEach(() => {
    registry = new ComponentRegistry()
  })

  describe('register', () => {
    test('should be able to register a Component definition', () => {
      const definition = createComponentDefinition('Card')

      registry.register(definition)

      expect(registry.has('Card')).toBe(true)
      expect(registry.size()).toBe(1)
    })

    test('should be able to register multiple Components', () => {
      const card = createComponentDefinition('Card')
      const button = createComponentDefinition('Button')

      registry.register(card)
      registry.register(button)

      expect(registry.has('Card')).toBe(true)
      expect(registry.has('Button')).toBe(true)
      expect(registry.size()).toBe(2)
    })

    test('should throw an error for duplicate Component names', () => {
      const card1 = createComponentDefinition('Card', 1, 1)
      const card2 = createComponentDefinition('Card', 10, 5)

      registry.register(card1)

      expect(() => {
        registry.register(card2)
      }).toThrow('Component "Card" is already defined')
    })

    test('should include filename in duplicate error message', () => {
      const card1 = createComponentDefinition('Card', 1, 1, 'app.pug')
      const card2 = createComponentDefinition('Card', 10, 5, 'app.pug')

      registry.register(card1)

      expect(() => {
        registry.register(card2)
      }).toThrow('Component "Card" is already defined')
      expect(() => {
        registry.register(card2)
      }).toThrow('app.pug')
      expect(() => {
        registry.register(card2)
      }).toThrow('Previously defined at')
    })
  })

  describe('get', () => {
    test('should be able to retrieve a registered Component definition', () => {
      const definition = createComponentDefinition('Card')

      registry.register(definition)
      const retrieved = registry.get('Card')

      expect(retrieved).toBe(definition)
      expect(retrieved?.name).toBe('Card')
    })

    test('should return undefined for an unregistered Component', () => {
      const result = registry.get('NotExist')

      expect(result).toBeUndefined()
    })

    test('should correctly retrieve the content of a registered definition', () => {
      const definition = createComponentDefinition('Card')

      registry.register(definition)
      const retrieved = registry.get('Card')

      expect(retrieved?.name).toBe('Card')
      expect(retrieved?.body).toBe(dummyBlock)
      expect(retrieved?.slots.size).toBe(1)
      expect(retrieved?.slots.has('header')).toBe(true)
      expect(retrieved?.location.line).toBe(1)
    })
  })

  describe('has', () => {
    test('should return true for a registered Component', () => {
      const definition = createComponentDefinition('Card')

      registry.register(definition)

      expect(registry.has('Card')).toBe(true)
    })

    test('should return false for an unregistered Component', () => {
      expect(registry.has('NotExist')).toBe(false)
    })

    test('should return false for a Component that was deleted after registration', () => {
      const definition = createComponentDefinition('Card')

      registry.register(definition)
      registry.clear()

      expect(registry.has('Card')).toBe(false)
    })
  })

  describe('getNames', () => {
    test('should return an array of registered Component names', () => {
      const card = createComponentDefinition('Card')
      const button = createComponentDefinition('Button')
      const modal = createComponentDefinition('Modal')

      registry.register(card)
      registry.register(button)
      registry.register(modal)

      const names = registry.getNames()

      expect(names).toHaveLength(3)
      expect(names).toContain('Card')
      expect(names).toContain('Button')
      expect(names).toContain('Modal')
    })

    test('should return an empty array if no Components are registered', () => {
      const names = registry.getNames()

      expect(names).toEqual([])
    })
  })

  describe('size', () => {
    test('should return the number of registered Components', () => {
      expect(registry.size()).toBe(0)

      registry.register(createComponentDefinition('Card'))
      expect(registry.size()).toBe(1)

      registry.register(createComponentDefinition('Button'))
      expect(registry.size()).toBe(2)

      registry.register(createComponentDefinition('Modal'))
      expect(registry.size()).toBe(3)
    })

    test('should return 0 after clear', () => {
      registry.register(createComponentDefinition('Card'))
      registry.register(createComponentDefinition('Button'))

      expect(registry.size()).toBe(2)

      registry.clear()

      expect(registry.size()).toBe(0)
    })
  })

  describe('clear', () => {
    test('should clear all Component definitions', () => {
      registry.register(createComponentDefinition('Card'))
      registry.register(createComponentDefinition('Button'))
      registry.register(createComponentDefinition('Modal'))

      expect(registry.size()).toBe(3)

      registry.clear()

      expect(registry.size()).toBe(0)
      expect(registry.has('Card')).toBe(false)
      expect(registry.has('Button')).toBe(false)
      expect(registry.has('Modal')).toBe(false)
      expect(registry.getNames()).toEqual([])
    })

    test('should be able to register again after clearing', () => {
      const card1 = createComponentDefinition('Card', 1, 1)

      registry.register(card1)
      registry.clear()

      const card2 = createComponentDefinition('Card', 10, 5)

      // No duplicate error should occur.
      expect(() => {
        registry.register(card2)
      }).not.toThrow()

      expect(registry.has('Card')).toBe(true)
      expect(registry.get('Card')?.location.line).toBe(10)
    })
  })

  describe('location information format', () => {
    test('should format as filename + line + column', () => {
      const card1 = createComponentDefinition('Card', 1, 1, 'app.pug')
      const card2 = createComponentDefinition('Card', 10, 5, 'app.pug')

      registry.register(card1)

      expect(() => {
        registry.register(card2)
      }).toThrow('app.pug')
      expect(() => {
        registry.register(card2)
      }).toThrow('line 1')
      expect(() => {
        registry.register(card2)
      }).toThrow('column 1')
    })

    test('should format as line + column (no filename)', () => {
      const card1 = createComponentDefinition('Card', 1, 1)
      const card2 = createComponentDefinition('Card', 10, 5)

      registry.register(card1)

      expect(() => {
        registry.register(card2)
      }).toThrow('line 1')
      expect(() => {
        registry.register(card2)
      }).toThrow('column 1')
    })

    test('should format as line only (no column)', () => {
      const definition1: ComponentDefinition = {
        name: 'Card',
        body: dummyBlock,
        slots: new Map(),
        location: { line: 1 },
      }

      const definition2: ComponentDefinition = {
        name: 'Card',
        body: dummyBlock,
        slots: new Map(),
        location: { line: 10 },
      }

      registry.register(definition1)

      expect(() => {
        registry.register(definition2)
      }).toThrow('line 1')
      expect(() => {
        registry.register(definition2)
      }).toThrow('line 10')
    })
  })
})
