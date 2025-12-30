/**
 * Tests for $dataFiles directive
 * Testing the correct usage pattern for loading external JSON data
 */

import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { transform } from '@/transform'

const FIXTURES_DIR_JSON = join(__dirname, '../fixtures/json-data-loading')

describe('$dataFiles Directive', () => {
  describe('basic usage', () => {
    it('should load data from JSON file via $dataFiles directive', () => {
      const source = `
- const $dataFiles = ['${join(FIXTURES_DIR_JSON, 'data.json')}']

component Feature()
  - const { icon, title, description } = $props
  .feature
    .icon= icon
    h3= title
    p= description

each feature in features
  Feature(
    icon=feature.icon
    title=feature.title
    description=feature.description
  )
`

      const result = transform(source, {
        output: 'html',
        basedir: FIXTURES_DIR_JSON,
      })

      expect(result.html).toBeDefined()
      expect(result.html).toContain('<div class="icon">🎯</div>')
      expect(result.html).toContain('<h3>Feature One</h3>')
      expect(result.html).toContain('<p>First feature description</p>')
      expect(result.html).toContain('<div class="icon">📦</div>')
      expect(result.html).toContain('<h3>Feature Two</h3>')
    })

    it('should iterate over JSON array data with components', () => {
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
  })

  describe('examples directory use cases', () => {
    it('should demonstrate the correct pattern for index.pug with $dataFiles', () => {
      const source = `
//- This is the recommended pattern
- const $dataFiles = ['/data/index.json']

component Card()
  - const { title, description } = $props
  .card
    h3= title
    p= description

each demo in demos
  Card(title=demo.title description=demo.description)
`

      const result = transform(source, {
        output: 'html',
        basedir: FIXTURES_DIR_JSON,
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
  })
})
