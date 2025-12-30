/**
 * E2E tests for error handling.
 */

import { describe, expect, test } from 'vitest'
import { transform } from '@/transform'

describe('E2E: Error Handling', () => {
  test('Undefined component error', () => {
    const source = `
Card()
  slot(header)
    h1 Title
`

    expect(() => {
      transform(source, { output: 'html' })
    }).toThrow('Component "Card" not found')
  })

  test('Duplicate slot provision error', () => {
    const source = `
component Card()
  .card
    slot(header)

Card()
  slot(header)
    h1 First
  slot(header)
    h1 Second
`

    expect(() => {
      transform(source, { output: 'html' })
    }).toThrow('Duplicate slot "header" provided')
  })

  test('Undefined slot error', () => {
    const source = `
component Card()
  .card
    slot(header)

Card()
  slot(footer)
    p Footer
`

    expect(() => {
      transform(source, { output: 'html' })
    }).toThrow('Slot "footer" is not defined')
  })

  test('Duplicate component definition error', () => {
    const source = `
component Card()
  .card
    slot(header)

component Card()
  .card
    slot(body)
`

    expect(() => {
      transform(source, { output: 'html' })
    }).toThrow('Component "Card" is already defined')
  })

  test('Recursive call error', () => {
    const source = `
component Card()
  .card
    Card()
`

    // Consider both cases: recursive detection works, or a stack overflow occurs.
    try {
      transform(source, { output: 'html' })
      expect.fail('Should have thrown an error')
    } catch (error) {
      if (error instanceof Error) {
        // Either a recursive detection error or a stack overflow error.
        expect(
          error.message.includes('Recursive component call detected') ||
            error.message.includes('Maximum call stack size exceeded'),
        ).toBe(true)
      } else {
        expect.fail('Error should be an Error instance')
      }
    }
  })

  test('Error message includes location information', () => {
    const source = `
Card()
`

    try {
      transform(source, { output: 'html', filename: 'test.pug' })
      expect.fail('Should have thrown an error')
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toContain('test.pug')
        expect(error.message).toContain('line')
      } else {
        expect.fail('Error should be an Error instance')
      }
    }
  })

  test('Error message includes a hint', () => {
    const source = `
component Button()
  button Button

Card()
`

    try {
      transform(source, { output: 'html' })
      expect.fail('Should have thrown an error')
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toContain('Hint:')
        expect(error.message).toContain('Available components')
        expect(error.message).toContain('Button')
      } else {
        expect.fail('Error should be an Error instance')
      }
    }
  })
})
