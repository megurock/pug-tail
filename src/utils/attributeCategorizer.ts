/**
 * Attribute categorization for Phase 3
 * Categorizes call-site attributes into props and attrs based on usage patterns
 */

import type { ComponentUsage } from '@/types'

/**
 * Categorizes call-site attributes into props and attrs based on component usage patterns
 *
 * @param callAttributes - Map of attribute names to values from the component call
 * @param usage - Component usage pattern (fromProps and fromAttrs)
 * @returns Object with categorized props and attrs Maps
 *
 * @example
 * const callAttrs = new Map([
 *   ['title', '"Hello"'],
 *   ['count', '5'],
 *   ['class', '"my-card"'],
 *   ['data-test', '"test"']
 * ])
 * const usage = {
 *   fromProps: ['title', 'count'],
 *   fromAttrs: ['class']
 * }
 *
 * categorizeAttributes(callAttrs, usage)
 * // → {
 * //   props: Map([['title', '"Hello"'], ['count', '5']]),
 * //   attrs: Map([['class', '"my-card"'], ['data-test', '"test"']])
 * // }
 */
export function categorizeAttributes(
  callAttributes: Map<string, string>,
  usage: ComponentUsage,
): { props: Map<string, string>; attrs: Map<string, string> } {
  const props = new Map<string, string>()
  const attrs = new Map<string, string>()

  for (const [key, value] of callAttributes) {
    if (usage.fromProps.includes(key)) {
      // Attribute is used from props identifier
      props.set(key, value)
    } else if (usage.fromAttrs.includes(key)) {
      // Attribute is used from attrs identifier
      attrs.set(key, value)
    } else {
      // Unexpected attribute: default to attrs (automatic fallthrough)
      attrs.set(key, value)
    }
  }

  return { props, attrs }
}
