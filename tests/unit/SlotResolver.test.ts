/**
 * Tests for SlotResolver.ts.
 */

import { beforeEach, describe, expect, test } from 'vitest'
import { SlotResolver } from '@/core/slotResolver'
import type { Block, Tag } from '@/types/pug'

describe('SlotResolver', () => {
  let resolver: SlotResolver

  beforeEach(() => {
    resolver = new SlotResolver()
  })

  describe('extractProvidedSlots', () => {
    test('should be able to extract slots from a component call', () => {
      const headerBlock: Block = {
        type: 'Block',
        nodes: [
          {
            type: 'Tag',
            name: 'h1',
            selfClosing: false,
            block: {
              type: 'Block',
              nodes: [],
              line: 1,
            },
            attrs: [],
            attributeBlocks: [],
            isInline: false,
            line: 1,
            column: 1,
          },
        ],
        line: 1,
      }

      const bodyBlock: Block = {
        type: 'Block',
        nodes: [
          {
            type: 'Tag',
            name: 'p',
            selfClosing: false,
            block: {
              type: 'Block',
              nodes: [],
              line: 2,
            },
            attrs: [],
            attributeBlocks: [],
            isInline: false,
            line: 2,
            column: 1,
          },
        ],
        line: 2,
      }

      const callNode: Tag = {
        type: 'Tag',
        name: 'Card',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [
            {
              type: 'Tag',
              name: 'slot',
              selfClosing: false,
              block: headerBlock,
              attrs: [
                {
                  name: 'header',
                  val: true,
                  mustEscape: true,
                  line: 1,
                  column: 1,
                },
              ],
              attributeBlocks: [],
              isInline: false,
              line: 1,
              column: 1,
            },
            {
              type: 'Tag',
              name: 'slot',
              selfClosing: false,
              block: bodyBlock,
              attrs: [
                {
                  name: 'body',
                  val: true,
                  mustEscape: true,
                  line: 2,
                  column: 1,
                },
              ],
              attributeBlocks: [],
              isInline: false,
              line: 2,
              column: 1,
            },
          ],
          line: 1,
        },
        attrs: [],
        attributeBlocks: [],
        isInline: false,
        line: 1,
        column: 1,
      }

      const slots = resolver.extractProvidedSlots(callNode)

      expect(slots.size).toBe(2)
      expect(slots.has('header')).toBe(true)
      expect(slots.has('body')).toBe(true)

      const headerSlot = slots.get('header')
      const bodySlot = slots.get('body')

      expect(headerSlot).toBeDefined()
      expect(bodySlot).toBeDefined()

      if (headerSlot && bodySlot) {
        expect(headerSlot.nodes).toHaveLength(1)
        expect(bodySlot.nodes).toHaveLength(1)
        if (headerSlot.nodes[0]?.type === 'Tag') {
          expect(headerSlot.nodes[0].name).toBe('h1')
        }
        if (bodySlot.nodes[0]?.type === 'Tag') {
          expect(bodySlot.nodes[0].name).toBe('p')
        }
      }
    })

    test('should be able to extract slot names from the slot(name="value") format', () => {
      const block: Block = {
        type: 'Block',
        nodes: [],
        line: 1,
      }

      const callNode: Tag = {
        type: 'Tag',
        name: 'Card',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [
            {
              type: 'Tag',
              name: 'slot',
              selfClosing: false,
              block,
              attrs: [
                {
                  name: 'name',
                  val: '"header"',
                  mustEscape: true,
                  line: 1,
                  column: 1,
                },
              ],
              attributeBlocks: [],
              isInline: false,
              line: 1,
              column: 1,
            },
          ],
          line: 1,
        },
        attrs: [],
        attributeBlocks: [],
        isInline: false,
        line: 1,
        column: 1,
      }

      const slots = resolver.extractProvidedSlots(callNode)

      expect(slots.size).toBe(1)
      expect(slots.has('header')).toBe(true)
    })

    test('should throw an error for duplicate slot names', () => {
      const block: Block = {
        type: 'Block',
        nodes: [],
        line: 1,
      }

      const callNode: Tag = {
        type: 'Tag',
        name: 'Card',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [
            {
              type: 'Tag',
              name: 'slot',
              selfClosing: false,
              block,
              attrs: [
                {
                  name: 'header',
                  val: true,
                  mustEscape: true,
                  line: 1,
                  column: 1,
                },
              ],
              attributeBlocks: [],
              isInline: false,
              line: 1,
              column: 1,
            },
            {
              type: 'Tag',
              name: 'slot',
              selfClosing: false,
              block,
              attrs: [
                {
                  name: 'header',
                  val: true,
                  mustEscape: true,
                  line: 2,
                  column: 1,
                },
              ],
              attributeBlocks: [],
              isInline: false,
              line: 2,
              column: 1,
            },
          ],
          line: 1,
        },
        attrs: [],
        attributeBlocks: [],
        isInline: false,
        line: 1,
        column: 1,
      }

      expect(() => {
        resolver.extractProvidedSlots(callNode)
      }).toThrow('Duplicate slot "header"')
    })

    test('should return an empty Map for a component call with an empty block', () => {
      const callNode: Tag = {
        type: 'Tag',
        name: 'Card',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [],
          line: 1,
        },
        attrs: [],
        attributeBlocks: [],
        isInline: false,
        line: 1,
        column: 1,
      }

      const slots = resolver.extractProvidedSlots(callNode)

      expect(slots.size).toBe(0)
    })

    test('should return an empty Map for a component call with no slots', () => {
      const callNode: Tag = {
        type: 'Tag',
        name: 'Card',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [],
          line: 1,
        },
        attrs: [],
        attributeBlocks: [],
        isInline: false,
        line: 1,
        column: 1,
      }

      const slots = resolver.extractProvidedSlots(callNode)

      expect(slots.size).toBe(0)
    })

    test('should save a slot without a block as an empty Block', () => {
      const callNode: Tag = {
        type: 'Tag',
        name: 'Card',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [
            {
              type: 'Tag',
              name: 'slot',
              selfClosing: false,
              block: {
                type: 'Block',
                nodes: [],
                line: 1,
              },
              attrs: [
                {
                  name: 'header',
                  val: true,
                  mustEscape: true,
                  line: 1,
                  column: 1,
                },
              ],
              attributeBlocks: [],
              isInline: false,
              line: 1,
              column: 1,
            },
          ],
          line: 1,
        },
        attrs: [],
        attributeBlocks: [],
        isInline: false,
        line: 1,
        column: 1,
      }

      const slots = resolver.extractProvidedSlots(callNode)

      expect(slots.size).toBe(1)
      const headerSlot = slots.get('header')
      expect(headerSlot).toBeDefined()
      if (headerSlot) {
        expect(headerSlot.nodes).toHaveLength(0)
      }
    })
  })

  describe('resolveSlot', () => {
    test('should return the provided slot with priority', () => {
      const providedBlock: Block = {
        type: 'Block',
        nodes: [],
        line: 1,
      }

      const defaultBlock: Block = {
        type: 'Block',
        nodes: [],
        line: 2,
      }

      const providedSlots = new Map<string, Block>([['header', providedBlock]])

      const result = resolver.resolveSlot('header', providedSlots, defaultBlock)

      expect(result).toBe(providedBlock)
    })

    test('should return the default if no slot is provided', () => {
      const defaultBlock: Block = {
        type: 'Block',
        nodes: [],
        line: 1,
      }

      const providedSlots = new Map<string, Block>()

      const result = resolver.resolveSlot('header', providedSlots, defaultBlock)

      expect(result).toBe(defaultBlock)
    })

    test('should return an empty Block if neither a provided slot nor a default exists', () => {
      const providedSlots = new Map<string, Block>()

      const result = resolver.resolveSlot('header', providedSlots, null)

      expect(result.type).toBe('Block')
      expect(result.nodes).toHaveLength(0)
    })
  })
})
