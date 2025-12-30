/**
 * Tests for bug fixes in examples:
 * 1. else if syntax error
 * 2. require() not working in Pug templates
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { transform } from '@/transform'
import { loadFixture } from '../helpers/loadFixture'

const FIXTURES_DIR_CONTROL = join(__dirname, '../fixtures/control-structures')
const FIXTURES_DIR_JSON = join(__dirname, '../fixtures/json-data-loading')

describe('Bug Fixes for Examples', () => {
  describe('else if syntax', () => {
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

    it('should work with components inside else if blocks', () => {
      const source = `
component Card()
  - const { type } = $props
  .card(class=type)= type

- const status = 'warning'

if status === 'success'
  Card(type='success')
else if status === 'warning'
  Card(type='warning')
else
  Card(type='error')
`

      const result = transform(source, { output: 'html' })

      expect(result.html).toBeDefined()
      expect(result.html).toContain('<div class="card warning">warning</div>')
    })

    it('should handle multiple else if clauses', () => {
      const source = `
component Badge()
  - const { level } = $props
  span.badge= level

- const priority = 3

if priority === 1
  Badge(level='critical')
else if priority === 2
  Badge(level='high')
else if priority === 3
  Badge(level='medium')
else if priority === 4
  Badge(level='low')
else
  Badge(level='none')
`

      const result = transform(source, { output: 'html' })

      expect(result.html).toBeDefined()
      expect(result.html).toContain('<span class="badge">medium</span>')
    })
  })

  describe('JSON data loading', () => {
    it('should load data from JSON file via transform options', () => {
      const source = readFileSync(
        join(FIXTURES_DIR_JSON, 'with-json-data.pug'),
        'utf-8',
      )
      const expected = readFileSync(
        join(FIXTURES_DIR_JSON, 'with-json-data.html'),
        'utf-8',
      )
      const jsonData = JSON.parse(
        readFileSync(join(FIXTURES_DIR_JSON, 'data.json'), 'utf-8'),
      )

      const result = transform(source, {
        output: 'html',
        data: jsonData,
      })

      expect(result.html).toBeDefined()
      expect(result.html?.trim()).toBe(expected.trim())
    })

    it('should iterate over JSON array data', () => {
      const source = `
component Item()
  - const { name, value } = $props
  li= name + ': ' + value

ul
  each item in items
    Item(name=item.name value=item.value)
`

      const result = transform(source, {
        output: 'html',
        data: {
          items: [
            { name: 'Apple', value: 100 },
            { name: 'Banana', value: 50 },
            { name: 'Orange', value: 75 },
          ],
        },
      })

      expect(result.html).toBeDefined()
      expect(result.html).toContain('<li>Apple: 100</li>')
      expect(result.html).toContain('<li>Banana: 50</li>')
      expect(result.html).toContain('<li>Orange: 75</li>')
    })

    it('should handle nested JSON structures', () => {
      const source = `
component Section()
  - const { title, items } = $props
  section
    h2= title
    ul
      each item in items
        li= item

each section in sections
  Section(title=section.title items=section.items)
`

      const result = transform(source, {
        output: 'html',
        data: {
          sections: [
            {
              title: 'Fruits',
              items: ['Apple', 'Banana'],
            },
            {
              title: 'Vegetables',
              items: ['Carrot', 'Broccoli'],
            },
          ],
        },
      })

      expect(result.html).toBeDefined()
      expect(result.html).toContain('<h2>Fruits</h2>')
      expect(result.html).toContain('<li>Apple</li>')
      expect(result.html).toContain('<h2>Vegetables</h2>')
      expect(result.html).toContain('<li>Carrot</li>')
    })

    it('should merge multiple data sources', () => {
      const source = `
component Info()
  - const { site, page } = $props
  .info
    p= 'Site: ' + site
    p= 'Page: ' + page

Info(site=siteName page=pageTitle)
`

      const result = transform(source, {
        output: 'html',
        data: {
          siteName: 'My Website',
          pageTitle: 'Home Page',
        },
      })

      expect(result.html).toBeDefined()
      expect(result.html).toContain('<p>Site: My Website</p>')
      expect(result.html).toContain('<p>Page: Home Page</p>')
    })
  })

  describe('Examples directory use cases', () => {
    it('should demonstrate the correct pattern for examples/index.pug', () => {
      // この例は examples/index.pug の正しいパターンを示す
      const source = `
component Card()
  - const { title, description } = $props
  .card
    h3= title
    p= description

//- データは transform の data オプションから渡される
each demo in demos
  Card(title=demo.title description=demo.description)
`

      const result = transform(source, {
        output: 'html',
        data: {
          demos: [
            {
              title: 'Control Structures',
              description: 'See components expand in loops',
            },
            {
              title: 'Slots & Props',
              description: 'Learn about named slots',
            },
          ],
        },
      })

      expect(result.html).toBeDefined()
      expect(result.html).toContain('<h3>Control Structures</h3>')
      expect(result.html).toContain('<p>See components expand in loops</p>')
      expect(result.html).toContain('<h3>Slots &amp; Props</h3>')
    })

    it('should demonstrate correct pattern for control-structures.pug', () => {
      const source = `
component Card()
  - const { title, variant } = $props
  .card(class=variant)= title

each section in sections
  if section.type === 'each'
    each item in section.data
      Card(title=item variant='primary')
  else if section.type === 'conditional'
    if section.condition
      Card(title=section.ifCard.title variant=section.ifCard.variant)
    else
      Card(title=section.elseCard.title variant=section.elseCard.variant)
`

      const result = transform(source, {
        output: 'html',
        data: {
          sections: [
            {
              type: 'each',
              data: ['Item 1', 'Item 2'],
            },
            {
              type: 'conditional',
              condition: true,
              ifCard: { title: 'True Card', variant: 'success' },
              elseCard: { title: 'False Card', variant: 'warning' },
            },
          ],
        },
      })

      expect(result.html).toBeDefined()
      expect(result.html).toContain('<div class="card primary">Item 1</div>')
      expect(result.html).toContain('<div class="card primary">Item 2</div>')
      expect(result.html).toContain('<div class="card success">True Card</div>')
    })
  })
})
