/**
 * Tests for scopeAnalyzer.ts
 *
 * Unit tests for scope analysis functionality that detects external variable references.
 */

import { describe, expect, test } from 'vitest'
import type { ValidationConfig } from '@/types'
import type { Block, Code } from '@/types/pug'
import {
  analyzeComponentScope,
  isAllowedIdentifier,
} from '@/utils/scopeAnalyzer'

describe('Scope Analyzer', () => {
  describe('analyzeComponentScope', () => {
    test('should detect external variable reference', () => {
      const componentBody: Block = {
        type: 'Block',
        nodes: [
          {
            type: 'Code',
            val: 'external',
            buffer: true,
            mustEscape: true,
            isInline: false,
            line: 1,
          } as Code,
        ],
        line: 1,
      }

      const result = analyzeComponentScope(componentBody)

      expect(result.externalReferences.has('external')).toBe(true)
      expect(result.declaredVariables.has('external')).toBe(false)
    })

    test('should recognize $props destructuring', () => {
      const componentBody: Block = {
        type: 'Block',
        nodes: [
          {
            type: 'Code',
            val: 'const { message, title } = $props',
            buffer: false,
            mustEscape: false,
            isInline: false,
            line: 1,
          } as Code,
          {
            type: 'Code',
            val: 'message',
            buffer: true,
            mustEscape: true,
            isInline: false,
            line: 2,
          } as Code,
        ],
        line: 1,
      }

      const result = analyzeComponentScope(componentBody)

      expect(result.propsVariables.has('message')).toBe(true)
      expect(result.propsVariables.has('title')).toBe(true)
      expect(result.externalReferences.has('message')).toBe(false)
    })

    test('should recognize $attrs destructuring', () => {
      const componentBody: Block = {
        type: 'Block',
        nodes: [
          {
            type: 'Code',
            val: 'const { class: className } = $attrs',
            buffer: false,
            mustEscape: false,
            isInline: false,
            line: 1,
          } as Code,
          {
            type: 'Code',
            val: 'className',
            buffer: true,
            mustEscape: true,
            isInline: false,
            line: 2,
          } as Code,
        ],
        line: 1,
      }

      const result = analyzeComponentScope(componentBody)

      expect(result.attrsVariables.has('className')).toBe(true)
      expect(result.externalReferences.has('className')).toBe(false)
    })

    test('should recognize local variable declarations', () => {
      const componentBody: Block = {
        type: 'Block',
        nodes: [
          {
            type: 'Code',
            val: 'const local = "test"',
            buffer: false,
            mustEscape: false,
            isInline: false,
            line: 1,
          } as Code,
          {
            type: 'Code',
            val: 'local',
            buffer: true,
            mustEscape: true,
            isInline: false,
            line: 2,
          } as Code,
        ],
        line: 1,
      }

      const result = analyzeComponentScope(componentBody)

      expect(result.declaredVariables.has('local')).toBe(true)
      expect(result.externalReferences.has('local')).toBe(false)
    })

    test('should handle multiple variable declarations', () => {
      const componentBody: Block = {
        type: 'Block',
        nodes: [
          {
            type: 'Code',
            val: 'const a = 1, b = 2',
            buffer: false,
            mustEscape: false,
            isInline: false,
            line: 1,
          } as Code,
        ],
        line: 1,
      }

      const result = analyzeComponentScope(componentBody)

      expect(result.declaredVariables.has('a')).toBe(true)
      expect(result.declaredVariables.has('b')).toBe(true)
    })

    test('should detect reference to undeclared variable', () => {
      const componentBody: Block = {
        type: 'Block',
        nodes: [
          {
            type: 'Code',
            val: 'const local = external',
            buffer: false,
            mustEscape: false,
            isInline: false,
            line: 1,
          } as Code,
        ],
        line: 1,
      }

      const result = analyzeComponentScope(componentBody)

      expect(result.declaredVariables.has('local')).toBe(true)
      expect(result.externalReferences.has('external')).toBe(true)
    })

    test('should not flag JavaScript globals as external', () => {
      const componentBody: Block = {
        type: 'Block',
        nodes: [
          {
            type: 'Code',
            val: 'const now = Date.now()',
            buffer: false,
            mustEscape: false,
            isInline: false,
            line: 1,
          } as Code,
          {
            type: 'Code',
            val: 'console.log("test")',
            buffer: false,
            mustEscape: false,
            isInline: false,
            line: 2,
          } as Code,
        ],
        line: 1,
      }

      const result = analyzeComponentScope(componentBody)

      expect(result.externalReferences.has('Date')).toBe(false)
      expect(result.externalReferences.has('console')).toBe(false)
    })
  })

  describe('isAllowedIdentifier', () => {
    test('should allow JavaScript standard globals', () => {
      const scopeAnalysis = {
        declaredVariables: new Set<string>(),
        referencedVariables: new Set<string>(),
        propsVariables: new Set<string>(),
        attrsVariables: new Set<string>(),
        slotVariables: new Set<string>(),
        externalReferences: new Set<string>(),
      }

      const emptyConfig: ValidationConfig = {}

      expect(isAllowedIdentifier('console', scopeAnalysis, emptyConfig)).toBe(
        true,
      )
      expect(isAllowedIdentifier('Math', scopeAnalysis, emptyConfig)).toBe(true)
      expect(isAllowedIdentifier('Date', scopeAnalysis, emptyConfig)).toBe(true)
      expect(isAllowedIdentifier('JSON', scopeAnalysis, emptyConfig)).toBe(true)
      expect(isAllowedIdentifier('Array', scopeAnalysis, emptyConfig)).toBe(
        true,
      )
      expect(isAllowedIdentifier('Object', scopeAnalysis, emptyConfig)).toBe(
        true,
      )
    })

    test('should allow Pug built-in variables', () => {
      const scopeAnalysis = {
        declaredVariables: new Set<string>(),
        referencedVariables: new Set<string>(),
        propsVariables: new Set<string>(),
        attrsVariables: new Set<string>(),
        slotVariables: new Set<string>(),
        externalReferences: new Set<string>(),
      }

      const emptyConfig: ValidationConfig = {}

      expect(
        isAllowedIdentifier('attributes', scopeAnalysis, emptyConfig),
      ).toBe(true)
      expect(isAllowedIdentifier('block', scopeAnalysis, emptyConfig)).toBe(
        true,
      )
    })

    test('should allow declared variables', () => {
      const scopeAnalysis = {
        declaredVariables: new Set(['local']),
        referencedVariables: new Set<string>(),
        propsVariables: new Set<string>(),
        attrsVariables: new Set<string>(),
        slotVariables: new Set<string>(),
        externalReferences: new Set<string>(),
      }

      const emptyConfig: ValidationConfig = {}

      expect(isAllowedIdentifier('local', scopeAnalysis, emptyConfig)).toBe(
        true,
      )
    })

    test('should allow props variables', () => {
      const scopeAnalysis = {
        declaredVariables: new Set<string>(),
        referencedVariables: new Set<string>(),
        propsVariables: new Set(['message']),
        attrsVariables: new Set<string>(),
        slotVariables: new Set<string>(),
        externalReferences: new Set<string>(),
      }

      const emptyConfig: ValidationConfig = {}

      expect(isAllowedIdentifier('message', scopeAnalysis, emptyConfig)).toBe(
        true,
      )
    })

    test('should allow attrs variables', () => {
      const scopeAnalysis = {
        declaredVariables: new Set<string>(),
        referencedVariables: new Set<string>(),
        propsVariables: new Set<string>(),
        attrsVariables: new Set(['className']),
        slotVariables: new Set<string>(),
        externalReferences: new Set<string>(),
      }

      const emptyConfig: ValidationConfig = {}

      expect(isAllowedIdentifier('className', scopeAnalysis, emptyConfig)).toBe(
        true,
      )
    })

    test('should allow custom globals from config', () => {
      const scopeAnalysis = {
        declaredVariables: new Set<string>(),
        referencedVariables: new Set<string>(),
        propsVariables: new Set<string>(),
        attrsVariables: new Set<string>(),
        slotVariables: new Set<string>(),
        externalReferences: new Set<string>(),
      }

      const config: ValidationConfig = {
        allowedGlobals: ['myGlobal'],
      }

      expect(isAllowedIdentifier('myGlobal', scopeAnalysis, config)).toBe(true)
    })

    test('should not allow undeclared variables', () => {
      const scopeAnalysis = {
        declaredVariables: new Set<string>(),
        referencedVariables: new Set<string>(),
        propsVariables: new Set<string>(),
        attrsVariables: new Set<string>(),
        slotVariables: new Set<string>(),
        externalReferences: new Set<string>(),
      }

      const emptyConfig: ValidationConfig = {}

      expect(isAllowedIdentifier('external', scopeAnalysis, emptyConfig)).toBe(
        false,
      )
    })
  })
})
