/**
 * Unit tests for ErrorHandler.
 */

import { describe, expect, test } from 'vitest'
import { ErrorHandler } from '@/core/errorHandler'

describe('ErrorHandler', () => {
  describe('componentNotFound', () => {
    test('should generate a "component not found" error', () => {
      const handler = new ErrorHandler()
      const error = handler.componentNotFound(
        'Card',
        { line: 10, column: 5, filename: 'app.pug' },
        ['Button', 'Layout'],
      )

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('Component "Card" not found')
      expect(error.code).toBe('COMPONENT_NOT_FOUND')
      expect(error.location).toEqual({
        line: 10,
        column: 5,
        filename: 'app.pug',
      })
      expect(error.hint).toContain('Available components: Button, Layout')
    })

    test('should provide a hint when no components are available', () => {
      const handler = new ErrorHandler()
      const error = handler.componentNotFound('Card', { line: 10 }, [])

      expect(error.hint).toContain('No components are defined')
    })
  })

  describe('duplicateComponent', () => {
    test('should generate a "duplicate component definition" error', () => {
      const handler = new ErrorHandler()
      const error = handler.duplicateComponent(
        'Card',
        { line: 1, column: 1, filename: 'app.pug' },
        { line: 10, column: 5, filename: 'app.pug' },
      )

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('Component "Card" is already defined')
      expect(error.code).toBe('DUPLICATE_COMPONENT')
      expect(error.location).toEqual({
        line: 10,
        column: 5,
        filename: 'app.pug',
      })
      expect(error.hint).toContain('Previously defined at')
    })
  })

  describe('duplicateSlotProvided', () => {
    test('should generate a "duplicate slot provided" error', () => {
      const handler = new ErrorHandler()
      const error = handler.duplicateSlotProvided('header', {
        line: 10,
        column: 5,
      })

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('Duplicate slot "header" provided')
      expect(error.code).toBe('DUPLICATE_SLOT_PROVIDED')
      expect(error.hint).toContain('Each slot name can only be provided once')
    })
  })

  describe('duplicateSlotDefinition', () => {
    test('should generate a "duplicate slot definition" error', () => {
      const handler = new ErrorHandler()
      const error = handler.duplicateSlotDefinition('header', {
        line: 10,
        column: 5,
      })

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('Duplicate slot "header" defined')
      expect(error.code).toBe('DUPLICATE_SLOT_DEFINITION')
      expect(error.hint).toContain('Each slot name can only be defined once')
    })
  })

  describe('slotNotDefined', () => {
    test('should generate an "undefined slot" error', () => {
      const handler = new ErrorHandler()
      const error = handler.slotNotDefined('footer', { line: 10, column: 5 }, [
        'header',
        'body',
      ])

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('Slot "footer" is not defined')
      expect(error.code).toBe('SLOT_NOT_DEFINED')
      expect(error.hint).toContain('Available slots: header, body')
    })

    test('should provide a hint when no slots are available', () => {
      const handler = new ErrorHandler()
      const error = handler.slotNotDefined('footer', { line: 10 }, [])

      expect(error.hint).toContain('This component does not define any slots')
    })
  })

  describe('recursiveComponentCall', () => {
    test('should generate a "recursive component call" error', () => {
      const handler = new ErrorHandler()
      const error = handler.recursiveComponentCall(
        'Card',
        ['Container', 'Card'],
        { line: 10, column: 5 },
      )

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('Recursive component call detected')
      expect(error.message).toContain('Container -> Card -> Card')
      expect(error.code).toBe('RECURSIVE_COMPONENT_CALL')
      expect(error.hint).toContain('Components cannot call themselves')
    })
  })

  describe('unexpectedNodeType', () => {
    test('should generate an "unexpected node type" error', () => {
      const handler = new ErrorHandler()
      const error = handler.unexpectedNodeType('Tag', 'Text', {
        line: 10,
        column: 5,
      })

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('Expected Tag node, but got Text')
      expect(error.code).toBe('UNEXPECTED_NODE_TYPE')
      expect(error.hint).toContain('This may indicate a syntax error')
    })
  })

  describe('error message formatting', () => {
    test('should include location information', () => {
      const handler = new ErrorHandler({ filename: 'app.pug' })
      const error = handler.componentNotFound(
        'Card',
        { line: 10, column: 5 },
        [],
      )

      expect(error.message).toContain('at app.pug:line 10:column 5')
    })

    test('should include a hint', () => {
      const handler = new ErrorHandler()
      const error = handler.componentNotFound('Card', { line: 10 }, ['Button'])

      expect(error.message).toContain('Hint:')
      expect(error.message).toContain('Available components')
    })
  })
})
