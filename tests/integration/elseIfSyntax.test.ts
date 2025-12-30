/**
 * Tests for Pug else if syntax with components
 * Verifying that nested else/if blocks work correctly with component expansion
 */

import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { transform } from '@/transform'
import { loadFixture } from '../helpers/loadFixture'

const FIXTURES_DIR_CONTROL = join(__dirname, '../fixtures/control-structures')

describe('Pug else if Syntax', () => {
  it('should handle else if syntax correctly', () => {
    const { pug, html: expected } = loadFixture(
      FIXTURES_DIR_CONTROL,
      'else-if-syntax',
    )

    const result = transform(pug, { output: 'html' })

    expect(result.html).toBeDefined()
    expect(expected).toBeDefined()
    expect(result.html?.trim()).toBe(expected?.trim())
  })

  it('should work with components inside else/if blocks', () => {
    const source = `
component Card()
  - const { type } = $props
  .card(class=type)= type

- const status = 'warning'

if status === 'success'
  Card(type='success')
else
  if status === 'warning'
    Card(type='warning')
  else
    Card(type='error')
`

    const result = transform(source, { output: 'html' })

    expect(result.html).toBeDefined()
    expect(result.html).toContain('<div class="card warning">warning</div>')
  })

  it('should handle multiple nested else/if clauses', () => {
    const source = `
component Badge()
  - const { level } = $props
  span.badge= level

- const priority = 3

if priority === 1
  Badge(level='critical')
else
  if priority === 2
    Badge(level='high')
  else
    if priority === 3
      Badge(level='medium')
    else
      if priority === 4
        Badge(level='low')
      else
        Badge(level='none')
`

    const result = transform(source, { output: 'html' })

    expect(result.html).toBeDefined()
    expect(result.html).toContain('<span class="badge">medium</span>')
  })

  it('should handle complex nesting with each and else/if', () => {
    const source = `
component Item()
  - const { name, status } = $props
  .item(class=status)= name

-
  const items = [
    { name: 'Item 1', priority: 1 },
    { name: 'Item 2', priority: 2 },
    { name: 'Item 3', priority: 3 }
  ]

each item in items
  if item.priority === 1
    Item(name=item.name status='high')
  else
    if item.priority === 2
      Item(name=item.name status='medium')
    else
      Item(name=item.name status='low')
`

    const result = transform(source, { output: 'html' })

    expect(result.html).toBeDefined()
    expect(result.html).toContain('<div class="item high">Item 1</div>')
    expect(result.html).toContain('<div class="item medium">Item 2</div>')
    expect(result.html).toContain('<div class="item low">Item 3</div>')
  })
})
