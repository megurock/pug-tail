/**
 * Tests for pathResolver utilities.
 */

import { describe, expect, it } from 'vitest'
import {
  isPugFile,
  resolveOutputPath,
  shouldIgnoreFile,
} from '@/cli/pathResolver'

describe('pathResolver', () => {
  describe('shouldIgnoreFile', () => {
    it('should not ignore normal files', () => {
      expect(shouldIgnoreFile('src/index.pug')).toBe(false)
      expect(shouldIgnoreFile('src/about.pug')).toBe(false)
      expect(shouldIgnoreFile('src/pages/blog.pug')).toBe(false)
    })

    it('should not ignore snake_case files', () => {
      expect(shouldIgnoreFile('src/my_component.pug')).toBe(false)
      expect(shouldIgnoreFile('src/user_profile.pug')).toBe(false)
      expect(shouldIgnoreFile('src/components/card_item.pug')).toBe(false)
    })

    it('should ignore files starting with _', () => {
      expect(shouldIgnoreFile('_layout.pug')).toBe(true)
      expect(shouldIgnoreFile('src/_layout.pug')).toBe(true)
      expect(shouldIgnoreFile('src/pages/_base.pug')).toBe(true)
    })

    it('should ignore files in directories starting with _', () => {
      expect(shouldIgnoreFile('_components/Card.pug')).toBe(true)
      expect(shouldIgnoreFile('src/_components/Card.pug')).toBe(true)
      expect(shouldIgnoreFile('src/_layouts/base.pug')).toBe(true)
    })

    it('should handle paths with both / and \\', () => {
      expect(shouldIgnoreFile('src/_components/Card.pug')).toBe(true)
      expect(shouldIgnoreFile('src\\_components\\Card.pug')).toBe(true)
    })
  })

  describe('isPugFile', () => {
    it('should identify .pug files', () => {
      expect(isPugFile('index.pug')).toBe(true)
      expect(isPugFile('src/pages/about.pug')).toBe(true)
    })

    it('should identify .jade files', () => {
      expect(isPugFile('index.jade')).toBe(true)
      expect(isPugFile('src/pages/about.jade')).toBe(true)
    })

    it('should not identify non-Pug files', () => {
      expect(isPugFile('index.html')).toBe(false)
      expect(isPugFile('style.css')).toBe(false)
      expect(isPugFile('script.js')).toBe(false)
      expect(isPugFile('data.json')).toBe(false)
    })
  })

  describe('resolveOutputPath', () => {
    it('should replace extension without output dir', () => {
      const result = resolveOutputPath('/project/src/index.pug')
      expect(result).toBe('/project/src/index.html')
    })

    it('should use custom extension', () => {
      const result = resolveOutputPath('/project/src/index.pug', {
        extension: '.htm',
      })
      expect(result).toBe('/project/src/index.htm')
    })

    it('should output to directory with basename only', () => {
      const result = resolveOutputPath('/project/src/index.pug', {
        outputDir: '/project/dist',
      })
      expect(result).toBe('/project/dist/index.html')
    })

    it('should maintain directory structure with rootPath', () => {
      const result = resolveOutputPath('/project/src/pages/about.pug', {
        outputDir: '/project/dist',
        rootPath: '/project/src',
      })
      expect(result).toBe('/project/dist/pages/about.html')
    })

    it('should handle nested directories', () => {
      const result = resolveOutputPath('/project/src/blog/2024/post.pug', {
        outputDir: '/project/dist',
        rootPath: '/project/src',
      })
      expect(result).toBe('/project/dist/blog/2024/post.html')
    })

    it('should handle .jade extension', () => {
      const result = resolveOutputPath('/project/src/index.jade', {
        outputDir: '/project/dist',
      })
      expect(result).toBe('/project/dist/index.html')
    })

    it('should not modify non-Pug files', () => {
      const result = resolveOutputPath('/project/src/style.css', {
        outputDir: '/project/dist',
      })
      expect(result).toBe('/project/dist/style.css')
    })
  })
})
