/**
 * Scope Isolation tests
 *
 * Tests component scope isolation feature that prevents external variable access.
 */

import { describe, expect, test, vi } from 'vitest'
import { transform } from '@/transform'

describe('Scope Isolation', () => {
  describe('Strict mode (default)', () => {
    test('should throw error on external variable access', () => {
      const source = `
- const external = 'test'

component MyComp()
  p= external

MyComp()
`
      // In strict mode by default (scopeIsolation: 'error'), an error should be thrown
      expect(() => transform(source)).toThrow('external variable')
      expect(() => transform(source)).toThrow('external')
    })

    test('should throw error with detailed message', () => {
      const source = `
- const message = 'Hello'

component Card()
  .card
    p= message

Card()
`
      try {
        transform(source)
        expect.fail('Should have thrown an error')
      } catch (error) {
        const errorMessage = (error as Error).message
        expect(errorMessage).toContain('Card')
        expect(errorMessage).toContain('message')
        expect(errorMessage).toContain('external variable')
      }
    })

    test('should allow variables from $props', () => {
      const source = `
- const external = 'test'

component MyComp()
  - const { title } = $props
  p= title

MyComp(title=external)
`
      // Variables obtained from $props are allowed
      expect(() => transform(source)).not.toThrow()
    })

    test('should allow local variables', () => {
      const source = `
- const external = 'test'

component MyComp()
  - const local = 'local value'
  p= local

MyComp()
`
      // Variables declared within the component are allowed
      expect(() => transform(source)).not.toThrow()
    })

    test('should allow standard JavaScript globals', () => {
      const source = `
component MyComp()
  - const now = Date.now()
  - console.log('test')
  p= JSON.stringify({ value: Math.random() })

MyComp()
`
      // Standard JavaScript globals are allowed
      expect(() => transform(source)).not.toThrow()
    })

    test('should allow Pug built-in variables', () => {
      const source = `
component MyComp()
  p&attributes(attributes)

MyComp(class='test')
`
      // Pug built-in variables are allowed
      expect(() => transform(source)).not.toThrow()
    })

    test('should detect multiple external variable references', () => {
      const source = `
- const external1 = 'test1'
- const external2 = 'test2'

component MyComp()
  p= external1
  p= external2

MyComp()
`
      try {
        transform(source)
        expect.fail('Should have thrown an error')
      } catch (error) {
        const errorMessage = (error as Error).message
        // Error is thrown for the first detected external variable
        expect(errorMessage).toMatch(/external1|external2/)
      }
    })
  })

  describe('Warn mode', () => {
    test('should warn but not throw on external variable access', () => {
      const source = `
- const external = 'test'

component MyComp()
  p= external

MyComp()
`
      const config = { validation: { scopeIsolation: 'warn' as const } }
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Warning is issued, but transformation succeeds
      expect(() => transform(source, config)).not.toThrow()
      expect(spy).toHaveBeenCalled()

      const warnings = spy.mock.calls.map((call) => call[0])
      const hasExternalWarning = warnings.some(
        (w) => typeof w === 'string' && w.includes('external'),
      )
      expect(hasExternalWarning).toBe(true)

      spy.mockRestore()
    })

    test('should generate valid output despite warnings', () => {
      const source = `
- const title = 'Hello'

component Card()
  .card
    h2= title

Card()
`
      const config = {
        output: 'html' as const,
        validation: { scopeIsolation: 'warn' as const },
      }
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = transform(source, config)

      expect(result.html).toBeDefined()
      expect(result.html).toContain('Hello')
      expect(spy).toHaveBeenCalled()

      spy.mockRestore()
    })
  })

  describe('Off mode', () => {
    test('should allow external variable access without warning', () => {
      const source = `
- const external = 'test'

component MyComp()
  p= external

MyComp()
`
      const config = { validation: { scopeIsolation: 'off' as const } }
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // No error or warning is issued
      expect(() => transform(source, config)).not.toThrow()
      expect(spy).not.toHaveBeenCalled()

      spy.mockRestore()
    })

    test('should work like legacy mode', () => {
      const source = `
- const title = 'Legacy Title'
- const content = 'Legacy Content'

component Card()
  .card
    h2= title
    p= content

Card()
`
      const config = {
        output: 'html' as const,
        validation: { scopeIsolation: 'off' as const },
      }

      const result = transform(source, config)

      expect(result.html).toBeDefined()
      expect(result.html).toContain('Legacy Title')
      expect(result.html).toContain('Legacy Content')
    })
  })

  describe('Custom allowed globals', () => {
    test('should allow custom globals in allowedGlobals config', () => {
      const source = `
component MyComp()
  p= myCustomGlobal

MyComp()
`
      const config = {
        validation: {
          scopeIsolation: 'error' as const,
          allowedGlobals: ['myCustomGlobal'],
        },
      }

      // No error because it's allowed as a custom global
      expect(() => transform(source, config)).not.toThrow()
    })

    test('should still error on non-allowed globals', () => {
      const source = `
component MyComp()
  p= notAllowed

MyComp()
`
      const config = {
        validation: {
          scopeIsolation: 'error' as const,
          allowedGlobals: ['myCustomGlobal'],
        },
      }

      // Non-allowed globals result in error
      expect(() => transform(source, config)).toThrow('external variable')
    })
  })

  describe('Complex scenarios', () => {
    test('should handle destructuring from $props', () => {
      const source = `
component MyComp()
  - const { title, content, author } = $props
  .card
    h2= title
    p= content
    small= author

MyComp(title='Test' content='Content' author='John')
`
      expect(() => transform(source)).not.toThrow()
    })

    test('should handle nested components with isolated scopes', () => {
      const source = `
- const outer = 'outer value'

component Outer()
  - const middle = 'middle value'
  .outer
    Inner()

component Inner()
  - const inner = 'inner value'
  .inner
    p= inner

Outer()
`
      // Inner component can only access variables within its own scope
      expect(() => transform(source)).not.toThrow()
    })

    test('should error when nested component tries to access parent scope', () => {
      const source = `
component Outer()
  - const middle = 'middle value'
  .outer
    Inner()

component Inner()
  .inner
    p= middle

Outer()
`
      // Inner component cannot access external scope
      expect(() => transform(source)).toThrow('external variable')
      expect(() => transform(source)).toThrow('middle')
    })
  })
})
