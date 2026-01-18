/**
 * Test to verify boolean attribute handling after mustEscape fix
 */

import { describe, expect, test } from 'vitest'
import { transform } from '@/transform'

describe('Boolean Attributes Fix', () => {
  test('should handle disabled=true correctly', () => {
    const source = `
component Button()
  - const { disabled } = $props
  button(disabled=disabled) Click

- const disabled = true
Button(disabled)
`

    const result = transform(source, { output: 'html' })
    console.log('=== disabled=true ===')
    console.log(result.html)

    // Should be <button disabled> or <button disabled="disabled">
    // NOT <button disabled="true">
    expect(result.html).not.toContain('disabled="true"')
  })

  test('should handle disabled=false correctly', () => {
    const source = `
component Button()
  - const { disabled } = $props
  button(disabled=disabled) Click

- const disabled = false
Button(disabled)
`

    const result = transform(source, { output: 'html' })
    console.log('=== disabled=false ===')
    console.log(result.html)

    // Should NOT have disabled attribute
    expect(result.html).not.toContain('disabled=')
  })

  test('should handle disabled=undefined correctly', () => {
    const source = `
component Button()
  - const { disabled } = $props
  button(disabled=disabled) Click

Button(disabled)
`

    const result = transform(source, { output: 'html' })
    console.log('=== disabled=undefined ===')
    console.log(result.html)

    // Should NOT have disabled attribute
    expect(result.html).not.toContain('disabled=')
  })

  test('should handle multiple boolean attributes', () => {
    const source = `
component Input()
  - const { required, disabled, readonly } = $props
  input(required=required, disabled=disabled, readonly=readonly)

- const required = true
- const disabled = false
Input(required, disabled, readonly)
`

    const result = transform(source, { output: 'html' })
    console.log('=== Multiple attributes ===')
    console.log(result.html)

    // required=true should be rendered
    expect(result.html).toMatch(/required/)
    expect(result.html).not.toContain('required="true"')

    // disabled=false should NOT be rendered
    expect(result.html).not.toContain('disabled')

    // readonly=undefined should NOT be rendered
    expect(result.html).not.toContain('readonly')
  })
})
