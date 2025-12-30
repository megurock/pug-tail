/**
 * Tests for component-detector.ts.
 */

import { describe, expect, test } from 'vitest'
import type { Block, Tag } from '@/types/pug'
import {
  extractComponentBody,
  extractComponentDefinition,
  extractComponentName,
  extractSlotDefinition,
  extractSlotDefinitions,
  extractSlotName,
  isComponentDefinitionNode,
  isSlotDefinitionNode,
} from '@/utils/componentDetector'

describe('component-detector', () => {
  describe('isComponentDefinitionNode', () => {
    test('should correctly identify a component tag', () => {
      const componentTag: Tag = {
        type: 'Tag',
        name: 'component',
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

      expect(isComponentDefinitionNode(componentTag)).toBe(true)
    })

    test('should return false for tags other than component', () => {
      const divTag: Tag = {
        type: 'Tag',
        name: 'div',
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

      expect(isComponentDefinitionNode(divTag)).toBe(false)
    })
  })

  describe('extractComponentName', () => {
    test('should extract Card from component Card()', () => {
      const componentTag: Tag = {
        type: 'Tag',
        name: 'component',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [
            {
              type: 'Text',
              val: 'Card()',
              line: 1,
              column: 11,
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

      expect(extractComponentName(componentTag)).toBe('Card')
    })

    test('should extract Button from component Button()', () => {
      const componentTag: Tag = {
        type: 'Tag',
        name: 'component',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [
            {
              type: 'Text',
              val: 'Button()',
              line: 1,
              column: 11,
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

      expect(extractComponentName(componentTag)).toBe('Button')
    })

    test('should throw an error if component name is not found', () => {
      const componentTag: Tag = {
        type: 'Tag',
        name: 'component',
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

      expect(() => extractComponentName(componentTag)).toThrow()
    })

    test('should throw an error for an invalid component name', () => {
      const componentTag: Tag = {
        type: 'Tag',
        name: 'component',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [
            {
              type: 'Text',
              val: 'invalid-name()',
              line: 1,
              column: 11,
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

      expect(() => extractComponentName(componentTag)).toThrow()
    })
  })

  describe('extractComponentBody', () => {
    test('should extract the body excluding the component name Text node', () => {
      const componentTag: Tag = {
        type: 'Tag',
        name: 'component',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [
            {
              type: 'Text',
              val: 'Card()',
              line: 1,
              column: 11,
            },
            {
              type: 'Tag',
              name: 'div',
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
          line: 1,
        },
        attrs: [],
        attributeBlocks: [],
        isInline: false,
        line: 1,
        column: 1,
      }

      const body = extractComponentBody(componentTag)

      expect(body.nodes).toHaveLength(1)
      const firstNode = body.nodes[0]
      expect(firstNode).toBeDefined()
      if (firstNode) {
        expect(firstNode.type).toBe('Tag')
        if (firstNode.type === 'Tag') {
          expect(firstNode.name).toBe('div')
        }
      }
    })
  })

  describe('isSlotDefinitionNode', () => {
    test('should correctly identify a slot tag', () => {
      const slotTag: Tag = {
        type: 'Tag',
        name: 'slot',
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

      expect(isSlotDefinitionNode(slotTag)).toBe(true)
    })

    test('should return false for tags other than slot', () => {
      const divTag: Tag = {
        type: 'Tag',
        name: 'div',
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

      expect(isSlotDefinitionNode(divTag)).toBe(false)
    })
  })

  describe('extractSlotName', () => {
    test('should extract header from slot(header)', () => {
      const slotTag: Tag = {
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
            column: 12,
          },
        ],
        attributeBlocks: [],
        isInline: false,
        line: 1,
        column: 7,
      }

      expect(extractSlotName(slotTag)).toBe('header')
    })

    test('should extract footer from slot(name="footer")', () => {
      const slotTag: Tag = {
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
            name: 'name',
            val: '"footer"',
            mustEscape: true,
            line: 1,
            column: 12,
          },
        ],
        attributeBlocks: [],
        isInline: false,
        line: 1,
        column: 7,
      }

      expect(extractSlotName(slotTag)).toBe('footer')
    })

    test('should return default if there are no attributes', () => {
      const slotTag: Tag = {
        type: 'Tag',
        name: 'slot',
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
        column: 7,
      }

      expect(extractSlotName(slotTag)).toBe('default')
    })
  })

  describe('extractSlotDefinition', () => {
    test('should correctly extract a slot definition', () => {
      const slotTag: Tag = {
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
            column: 12,
          },
        ],
        attributeBlocks: [],
        isInline: false,
        line: 1,
        column: 7,
        filename: 'test.pug',
      }

      const slotDef = extractSlotDefinition(slotTag)

      expect(slotDef.name).toBe('header')
      expect(slotDef.placeholder).toBe(slotTag)
      expect(slotDef.location.line).toBe(1)
      expect(slotDef.location.column).toBe(7)
      expect(slotDef.location.filename).toBe('test.pug')
    })
  })

  describe('extractSlotDefinitions', () => {
    test('should extract all slots within a Block', () => {
      const block: Block = {
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
                column: 12,
              },
            ],
            attributeBlocks: [],
            isInline: false,
            line: 1,
            column: 7,
          },
          {
            type: 'Tag',
            name: 'slot',
            selfClosing: false,
            block: {
              type: 'Block',
              nodes: [],
              line: 2,
            },
            attrs: [
              {
                name: 'body',
                val: true,
                mustEscape: true,
                line: 2,
                column: 12,
              },
            ],
            attributeBlocks: [],
            isInline: false,
            line: 2,
            column: 7,
          },
        ],
        line: 1,
      }

      const slots = extractSlotDefinitions(block)

      expect(slots.size).toBe(2)
      expect(slots.has('header')).toBe(true)
      expect(slots.has('body')).toBe(true)
      const headerSlot = slots.get('header')
      const bodySlot = slots.get('body')
      expect(headerSlot).toBeDefined()
      expect(bodySlot).toBeDefined()
      if (headerSlot && bodySlot) {
        expect(headerSlot.name).toBe('header')
        expect(bodySlot.name).toBe('body')
      }
    })

    test('should also extract nested slots', () => {
      const block: Block = {
        type: 'Block',
        nodes: [
          {
            type: 'Tag',
            name: 'div',
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
                    line: 2,
                  },
                  attrs: [
                    {
                      name: 'header',
                      val: true,
                      mustEscape: true,
                      line: 2,
                      column: 12,
                    },
                  ],
                  attributeBlocks: [],
                  isInline: false,
                  line: 2,
                  column: 7,
                },
              ],
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

      const slots = extractSlotDefinitions(block)

      expect(slots.size).toBe(1)
      expect(slots.has('header')).toBe(true)
    })

    test('should throw an error for duplicate slot names', () => {
      const block: Block = {
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
                column: 12,
              },
            ],
            attributeBlocks: [],
            isInline: false,
            line: 1,
            column: 7,
          },
          {
            type: 'Tag',
            name: 'slot',
            selfClosing: false,
            block: {
              type: 'Block',
              nodes: [],
              line: 2,
            },
            attrs: [
              {
                name: 'header',
                val: true,
                mustEscape: true,
                line: 2,
                column: 12,
              },
            ],
            attributeBlocks: [],
            isInline: false,
            line: 2,
            column: 7,
          },
        ],
        line: 1,
      }

      expect(() => extractSlotDefinitions(block)).toThrow('Duplicate slot')
    })
  })

  describe('extractComponentDefinition', () => {
    test('should extract a complete component definition', () => {
      const componentTag: Tag = {
        type: 'Tag',
        name: 'component',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [
            {
              type: 'Text',
              val: 'Card()',
              line: 1,
              column: 11,
            },
            {
              type: 'Tag',
              name: 'div',
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
                      line: 2,
                    },
                    attrs: [
                      {
                        name: 'header',
                        val: true,
                        mustEscape: true,
                        line: 2,
                        column: 12,
                      },
                    ],
                    attributeBlocks: [],
                    isInline: false,
                    line: 2,
                    column: 7,
                  },
                ],
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
        },
        attrs: [],
        attributeBlocks: [],
        isInline: false,
        line: 1,
        column: 1,
        filename: 'test.pug',
      }

      const definition = extractComponentDefinition(componentTag)

      expect(definition.name).toBe('Card')
      expect(definition.body.nodes).toHaveLength(1)
      expect(definition.slots.size).toBe(1)
      expect(definition.slots.has('header')).toBe(true)
      expect(definition.location.line).toBe(1)
      expect(definition.location.column).toBe(1)
      expect(definition.location.filename).toBe('test.pug')
    })
  })

  describe('InterpolatedTag support', () => {
    test('should extract slots inside InterpolatedTag', () => {
      const block: Block = {
        type: 'Block',
        nodes: [
          {
            type: 'InterpolatedTag',
            expr: 'tagName',
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
                    line: 2,
                  },
                  attrs: [
                    {
                      name: 'content',
                      val: true,
                      mustEscape: true,
                      line: 2,
                      column: 12,
                    },
                  ],
                  attributeBlocks: [],
                  isInline: false,
                  line: 2,
                  column: 7,
                },
              ],
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

      const slots = extractSlotDefinitions(block)

      expect(slots.size).toBe(1)
      expect(slots.has('content')).toBe(true)
    })

    test('should extract multiple slots inside InterpolatedTag', () => {
      const block: Block = {
        type: 'Block',
        nodes: [
          {
            type: 'InterpolatedTag',
            expr: 'href ? "a" : "div"',
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
                    line: 2,
                  },
                  attrs: [
                    {
                      name: 'content',
                      val: true,
                      mustEscape: true,
                      line: 2,
                      column: 12,
                    },
                  ],
                  attributeBlocks: [],
                  isInline: false,
                  line: 2,
                  column: 7,
                },
                {
                  type: 'Conditional',
                  test: 'hasFooter',
                  consequent: {
                    type: 'Block',
                    nodes: [
                      {
                        type: 'Tag',
                        name: 'slot',
                        selfClosing: false,
                        block: {
                          type: 'Block',
                          nodes: [],
                          line: 4,
                        },
                        attrs: [
                          {
                            name: 'footer',
                            val: true,
                            mustEscape: true,
                            line: 4,
                            column: 12,
                          },
                        ],
                        attributeBlocks: [],
                        isInline: false,
                        line: 4,
                        column: 9,
                      },
                    ],
                    line: 3,
                  },
                  alternate: null,
                  line: 3,
                  column: 5,
                },
              ],
              line: 1,
            },
            attrs: [
              {
                name: 'class',
                val: '"card"',
                mustEscape: true,
                line: 1,
                column: 20,
              },
            ],
            attributeBlocks: [],
            isInline: false,
            line: 1,
            column: 1,
          },
        ],
        line: 1,
      }

      const slots = extractSlotDefinitions(block)

      expect(slots.size).toBe(2)
      expect(slots.has('content')).toBe(true)
      expect(slots.has('footer')).toBe(true)
    })

    test('should extract component definition with InterpolatedTag', () => {
      const componentTag: Tag = {
        type: 'Tag',
        name: 'component',
        selfClosing: false,
        block: {
          type: 'Block',
          nodes: [
            {
              type: 'Text',
              val: 'Card()',
              line: 1,
              column: 11,
            },
            {
              type: 'InterpolatedTag',
              expr: 'tagName',
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
                      line: 2,
                    },
                    attrs: [
                      {
                        name: 'content',
                        val: true,
                        mustEscape: true,
                        line: 2,
                        column: 12,
                      },
                    ],
                    attributeBlocks: [],
                    isInline: false,
                    line: 2,
                    column: 7,
                  },
                ],
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
        },
        attrs: [],
        attributeBlocks: [],
        isInline: false,
        line: 1,
        column: 1,
        filename: 'test.pug',
      }

      const definition = extractComponentDefinition(componentTag)

      expect(definition.name).toBe('Card')
      expect(definition.body.nodes).toHaveLength(1)
      expect(definition.slots.size).toBe(1)
      expect(definition.slots.has('content')).toBe(true)
      expect(definition.location.line).toBe(1)
      expect(definition.location.column).toBe(1)
      expect(definition.location.filename).toBe('test.pug')
    })

    test('should handle nested InterpolatedTag with slots', () => {
      const block: Block = {
        type: 'Block',
        nodes: [
          {
            type: 'Tag',
            name: 'div',
            selfClosing: false,
            block: {
              type: 'Block',
              nodes: [
                {
                  type: 'InterpolatedTag',
                  expr: 'wrapperTag',
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
                          line: 3,
                        },
                        attrs: [
                          {
                            name: 'nested',
                            val: true,
                            mustEscape: true,
                            line: 3,
                            column: 12,
                          },
                        ],
                        attributeBlocks: [],
                        isInline: false,
                        line: 3,
                        column: 9,
                      },
                    ],
                    line: 2,
                  },
                  attrs: [],
                  attributeBlocks: [],
                  isInline: false,
                  line: 2,
                  column: 5,
                },
              ],
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

      const slots = extractSlotDefinitions(block)

      expect(slots.size).toBe(1)
      expect(slots.has('nested')).toBe(true)
    })
  })
})
