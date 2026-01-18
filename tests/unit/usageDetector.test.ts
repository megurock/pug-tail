/**
 * Unit tests for createPropsCode and createAttrsCode
 */

import { describe, expect, test } from 'vitest'
import { createPropsCode, isVariableReference } from '@/utils/usageDetector'

describe('createPropsCode', () => {
  test('should create props code with shorthand variables', () => {
    const props = new Map([
      ['title', 'title'],
      ['count', 'count'],
    ])

    const codes = createPropsCode(props)

    expect(codes).toHaveLength(1)
    expect(codes[0]?.val).toBe(
      'const $props = {"title": title, "count": count}',
    )
  })

  test('should create props code with explicit values', () => {
    const props = new Map([
      ['title', '"Hello"'],
      ['count', '5'],
    ])

    const codes = createPropsCode(props)

    expect(codes).toHaveLength(1)
    expect(codes[0]?.val).toBe('const $props = {"title": "Hello", "count": 5}')
  })

  test('should create props code with mixed shorthand and explicit', () => {
    const props = new Map([
      ['title', 'title'],
      ['count', '5'],
    ])

    const codes = createPropsCode(props)

    expect(codes).toHaveLength(1)
    expect(codes[0]?.val).toBe('const $props = {"title": title, "count": 5}')
  })

  test('should handle paramPrefix for TDZ avoidance', () => {
    const props = new Map([
      ['title', 'title'],
      ['count', 'count'],
    ])

    const codes = createPropsCode(props, '__pug_arg_')

    expect(codes).toHaveLength(1)
    expect(codes[0]?.val).toBe(
      'const $props = {"title": __pug_arg_title, "count": __pug_arg_count}',
    )
  })
})

describe('isVariableReference', () => {
  test('should identify variable references', () => {
    expect(isVariableReference('title')).toBe(true)
    expect(isVariableReference('count')).toBe(true)
    expect(isVariableReference('myVar')).toBe(true)
    expect(isVariableReference('_privateVar')).toBe(true)
    expect(isVariableReference('$dollarVar')).toBe(true)
  })

  test('should reject boolean literals', () => {
    expect(isVariableReference('true')).toBe(false)
    expect(isVariableReference('false')).toBe(false)
  })

  test('should reject null and undefined', () => {
    expect(isVariableReference('null')).toBe(false)
    expect(isVariableReference('undefined')).toBe(false)
  })

  test('should reject numeric literals', () => {
    expect(isVariableReference('5')).toBe(false)
    expect(isVariableReference('123')).toBe(false)
    expect(isVariableReference('3.14')).toBe(false)
    expect(isVariableReference('-42')).toBe(false)
  })

  test('should reject string literals', () => {
    expect(isVariableReference('"Hello"')).toBe(false)
    expect(isVariableReference("'World'")).toBe(false)
    expect(isVariableReference('`template`')).toBe(false)
  })

  test('should reject reserved identifiers', () => {
    expect(isVariableReference('$props')).toBe(false)
    expect(isVariableReference('$attrs')).toBe(false)
  })
})
