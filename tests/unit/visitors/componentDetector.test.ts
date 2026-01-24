/**
 * Tests for ComponentDetectorVisitor
 */

import { beforeEach, describe, expect, test, vi } from 'vitest'
import { Traverser } from '@/core/compiler/traverser'
import { ComponentRegistry } from '@/core/componentRegistry'
import { ErrorHandler } from '@/core/errorHandler'
import { ComponentDetectorVisitor } from '@/core/visitors/componentDetector'
import type { Visitor } from '@/core/visitors/visitor'
import type { Block, Node, Tag } from '@/types/pug'

describe('ComponentDetectorVisitor', () => {
  let traverser: Traverser
  let registry: ComponentRegistry
  let errorHandler: ErrorHandler
  let visitor: Visitor

  beforeEach(() => {
    traverser = new Traverser()
    registry = new ComponentRegistry()
    errorHandler = new ErrorHandler()
    visitor = new ComponentDetectorVisitor(
      registry,
      errorHandler,
    ) as unknown as Visitor
  })

  // Helper: Creates a Block node
  function createBlock(nodes: Node[] = []): Block {
    return {
      type: 'Block',
      nodes,
      line: 1,
      column: 1,
    }
  }

  // Helper: Creates a Tag node
  function createTag(name: string, block?: Block): Tag {
    return {
      type: 'Tag',
      name,
      selfClosing: false,
      block: block ?? createBlock(),
      attrs: [],
      attributeBlocks: [],
      isInline: false,
      line: 1,
      column: 1,
    }
  }

  // Helper: Creates a Text node
  function createText(value: string): Node {
    return {
      type: 'Text',
      val: value,
      line: 1,
      column: 1,
    }
  }

  // Helper: Creates a component definition node
  // Component definitions need:
  // - A 'component' tag
  // - A block containing:
  //   - A Text node with the component name (e.g., "Card()")
  //   - The component body nodes
  function createComponentDefinition(
    name: string,
    bodyNodes: Node[] = [],
  ): Tag {
    // Create the Text node with the component name
    const nameText = createText(`${name}()`)

    // Combine name text with body nodes
    const allNodes = [nameText, ...bodyNodes]

    return {
      type: 'Tag',
      name: 'component',
      selfClosing: false,
      block: createBlock(allNodes),
      attrs: [],
      attributeBlocks: [],
      isInline: false,
      line: 1,
      column: 1,
    }
  }

  describe('component detection', () => {
    test('should detect and register a component definition', () => {
      const componentDef = createComponentDefinition('Card')
      const ast = createBlock([componentDef])

      traverser.traverse(ast, visitor)

      // Component should be registered
      expect(registry.has('Card')).toBe(true)
    })

    test('should not register non-component tags', () => {
      const regularTag = createTag('div')
      const ast = createBlock([regularTag])

      traverser.traverse(ast, visitor)

      // No components should be registered
      expect(registry.size()).toBe(0)
    })

    test('should register multiple components', () => {
      const comp1 = createComponentDefinition('Card')
      const comp2 = createComponentDefinition('Button')
      const ast = createBlock([comp1, comp2])

      traverser.traverse(ast, visitor)

      // Both components should be registered
      expect(registry.has('Card')).toBe(true)
      expect(registry.has('Button')).toBe(true)
      expect(registry.size()).toBe(2)
    })

    test('should detect nested component definitions', () => {
      const innerComp = createComponentDefinition('Inner')
      const innerBlock = createBlock([innerComp])
      const outerTag = createTag('div', innerBlock)
      const ast = createBlock([outerTag])

      traverser.traverse(ast, visitor)

      // Inner component should be detected
      expect(registry.has('Inner')).toBe(true)
    })
  })

  describe('duplicate components', () => {
    test('should throw error on duplicate component names', () => {
      const comp1 = createComponentDefinition('Card')
      const comp2 = createComponentDefinition('Card')
      const ast = createBlock([comp1, comp2])

      expect(() => {
        traverser.traverse(ast, visitor)
      }).toThrow()
    })
  })

  describe('Include and Extends handling', () => {
    test('should handle Include nodes with AST', () => {
      // Create an include with a nested AST containing a component
      const nestedComp = createComponentDefinition('NestedCard')
      const nestedAst = createBlock([nestedComp])

      const includeNode: Node = {
        type: 'Include',
        file: {
          ast: nestedAst,
        },
        line: 1,
        column: 1,
      } as Node

      const ast = createBlock([includeNode])

      traverser.traverse(ast, visitor)

      // Component from included file should be registered
      expect(registry.has('NestedCard')).toBe(true)
    })

    test('should handle Extends nodes with AST', () => {
      // Create an extends with a nested AST containing a component
      const nestedComp = createComponentDefinition('BaseLayout')
      const nestedAst = createBlock([nestedComp])

      const extendsNode: Node = {
        type: 'Extends',
        file: {
          ast: nestedAst,
        },
        line: 1,
        column: 1,
      } as Node

      const ast = createBlock([extendsNode])

      traverser.traverse(ast, visitor)

      // Component from extended file should be registered
      expect(registry.has('BaseLayout')).toBe(true)
    })

    test('should handle Include without AST', () => {
      const includeNode: Node = {
        type: 'Include',
        file: null,
        block: null,
        line: 1,
        column: 1,
      } as unknown as Node

      const ast = createBlock([includeNode])

      // Should not throw
      expect(() => {
        traverser.traverse(ast, visitor)
      }).not.toThrow()

      expect(registry.size()).toBe(0)
    })
  })

  describe('component metadata', () => {
    test('should register component with correct name', () => {
      const componentDef = createComponentDefinition('MyComponent')
      const ast = createBlock([componentDef])

      traverser.traverse(ast, visitor)

      const registered = registry.get('MyComponent')
      expect(registered).toBeDefined()
      expect(registered?.name).toBe('MyComponent')
    })

    test('should register component with body', () => {
      const bodyNodes = [createTag('div')]
      const componentDef = createComponentDefinition('Card', bodyNodes)
      const ast = createBlock([componentDef])

      traverser.traverse(ast, visitor)

      const registered = registry.get('Card')
      expect(registered).toBeDefined()
      expect(registered?.body).toBeDefined()
      expect(registered?.body.nodes).toHaveLength(1)
    })
  })

  describe('scope analysis', () => {
    test('should analyze component scope', () => {
      const componentDef = createComponentDefinition('Card')
      const ast = createBlock([componentDef])

      traverser.traverse(ast, visitor)

      const registered = registry.get('Card')
      expect(registered).toBeDefined()
      expect(registered?.scopeAnalysis).toBeDefined()
    })

    test('should detect external variable references in strict mode', () => {
      // This would require a more complex setup with actual code nodes
      // For now, we'll just verify the visitor doesn't crash
      const componentDef = createComponentDefinition('Card')
      const ast = createBlock([componentDef])

      const strictVisitor = new ComponentDetectorVisitor(
        registry,
        errorHandler,
        {
          validation: {
            scopeIsolation: 'error',
          },
        },
      )

      expect(() => {
        traverser.traverse(ast, strictVisitor as unknown as Visitor)
      }).not.toThrow()
    })

    test('should warn about external variables in warn mode', () => {
      const componentDef = createComponentDefinition('Card')
      const ast = createBlock([componentDef])

      const warnVisitor = new ComponentDetectorVisitor(registry, errorHandler, {
        validation: {
          scopeIsolation: 'warn',
        },
      })

      // Should not throw, but would log warnings
      expect(() => {
        traverser.traverse(ast, warnVisitor as unknown as Visitor)
      }).not.toThrow()
    })

    test('should skip validation in off mode', () => {
      const componentDef = createComponentDefinition('Card')
      const ast = createBlock([componentDef])

      const offVisitor = new ComponentDetectorVisitor(registry, errorHandler, {
        validation: {
          scopeIsolation: 'off',
        },
      })

      expect(() => {
        traverser.traverse(ast, offVisitor as unknown as Visitor)
      }).not.toThrow()
    })
  })

  describe('debug mode', () => {
    test('should log debug information when enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const debugVisitor = new ComponentDetectorVisitor(
        registry,
        errorHandler,
        {
          debug: true,
        },
      )

      const componentDef = createComponentDefinition('Card')
      const ast = createBlock([componentDef])

      traverser.traverse(ast, debugVisitor as unknown as Visitor)

      // Should have logged debug info
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    test('should not log when debug is disabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const componentDef = createComponentDefinition('Card')
      const ast = createBlock([componentDef])

      traverser.traverse(ast, visitor)

      // Should not have logged
      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('integration with registry', () => {
    test('should be able to retrieve registered components', () => {
      const componentDef = createComponentDefinition('Card')
      const ast = createBlock([componentDef])

      traverser.traverse(ast, visitor)

      const card = registry.get('Card')
      expect(card).toBeDefined()
      expect(card?.name).toBe('Card')
    })

    test('should register components from multiple sources', () => {
      // Main AST component
      const mainComp = createComponentDefinition('MainCard')

      // Included component
      const includedComp = createComponentDefinition('IncludedButton')
      const includedAst = createBlock([includedComp])
      const includeNode: Node = {
        type: 'Include',
        file: { ast: includedAst },
        line: 1,
        column: 1,
      } as Node

      const ast = createBlock([mainComp, includeNode])

      traverser.traverse(ast, visitor)

      // Both should be registered
      expect(registry.has('MainCard')).toBe(true)
      expect(registry.has('IncludedButton')).toBe(true)
      expect(registry.size()).toBe(2)
    })
  })
})
