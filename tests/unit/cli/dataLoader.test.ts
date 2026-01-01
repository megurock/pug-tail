/**
 * Tests for dataLoader utilities.
 */

import { describe, expect, it } from 'vitest'
import { loadData, mergeData } from '@/cli/dataLoader'

describe('dataLoader', () => {
  describe('loadData', () => {
    it('should parse JSON string', () => {
      const result = loadData('{"title": "Hello", "year": 2025}')
      expect(result).toEqual({ title: 'Hello', year: 2025 })
    })

    it('should load JSON file', () => {
      const result = loadData('tests/fixtures/cli-data/data.json')
      expect(result).toHaveProperty('siteName')
      expect(result).toHaveProperty('title')
      expect(result.siteName).toBe('Test Site')
    })

    it('should handle nested objects', () => {
      const result = loadData('{"user": {"name": "John", "age": 30}}')
      expect(result).toEqual({
        user: { name: 'John', age: 30 },
      })
    })

    it('should handle arrays', () => {
      const result = loadData('{"tags": ["tag1", "tag2", "tag3"]}')
      expect(result).toEqual({
        tags: ['tag1', 'tag2', 'tag3'],
      })
    })

    it('should throw error for invalid JSON', () => {
      expect(() => loadData('{invalid json}')).toThrow()
    })

    it('should throw error for non-existent file', () => {
      expect(() => loadData('non-existent-file.json')).toThrow()
    })
  })

  describe('mergeData', () => {
    it('should merge multiple objects', () => {
      const result = mergeData(
        { title: 'Default', year: 2025 },
        { title: 'Override' },
      )
      expect(result).toEqual({ title: 'Override', year: 2025 })
    })

    it('should handle undefined sources', () => {
      const result = mergeData({ title: 'Hello' }, undefined, { year: 2025 })
      expect(result).toEqual({ title: 'Hello', year: 2025 })
    })

    it('should return empty object for no sources', () => {
      const result = mergeData()
      expect(result).toEqual({})
    })

    it('should override in order', () => {
      const result = mergeData({ a: 1, b: 2 }, { b: 3, c: 4 }, { c: 5, d: 6 })
      expect(result).toEqual({ a: 1, b: 3, c: 5, d: 6 })
    })
  })
})
