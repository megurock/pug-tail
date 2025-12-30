/**
 * ComponentRegistry
 *
 * A registry for registering and managing component definitions.
 */

import type { ComponentDefinition } from '@/types'
import { ErrorHandler, type ErrorHandlerOptions } from './errorHandler'

/**
 * A registry for component definitions.
 *
 * Used to register and retrieve component definitions within a single AST transformation process.
 * A new ComponentRegistry is created for each file transformation.
 *
 * @example
 * ```typescript
 * const registry = new ComponentRegistry()
 *
 * // Register a component definition.
 * registry.register(cardDefinition)
 *
 * // Get a component definition.
 * const def = registry.get('Card')
 * ```
 */
export class ComponentRegistry {
  private components: Map<string, ComponentDefinition> = new Map()
  private errorHandler: ErrorHandler

  constructor(options: ErrorHandlerOptions = {}) {
    this.errorHandler = new ErrorHandler(options)
  }

  /**
   * Registers a component definition.
   *
   * @param definition - The component definition to register.
   * @throws {ExtendedPugTailError} If a component with the same name is already registered.
   *
   * @example
   * ```typescript
   * registry.register({
   *   name: 'Card',
   *   body: cardBodyBlock,
   *   slots: new Map([['header', headerSlot]]),
   *   location: { line: 1, column: 1 }
   * })
   * ```
   */
  register(definition: ComponentDefinition): void {
    if (this.components.has(definition.name)) {
      const existing = this.components.get(definition.name)
      if (existing) {
        throw this.errorHandler.duplicateComponent(
          definition.name,
          existing.location,
          definition.location,
        )
      }
    }

    this.components.set(definition.name, definition)
  }

  /**
   * Gets a component definition.
   *
   * @param name - The name of the component.
   * @returns The component definition, or undefined if it does not exist.
   *
   * @example
   * ```typescript
   * const definition = registry.get('Card')
   * if (definition) {
   *   console.log(`Found ${definition.name}`)
   * }
   * ```
   */
  get(name: string): ComponentDefinition | undefined {
    return this.components.get(name)
  }

  /**
   * Checks if a component is registered.
   *
   * @param name - The name of the component.
   * @returns True if the component is registered.
   *
   * @example
   * ```typescript
   * if (registry.has('Card')) {
   *   console.log('Card component is registered')
   * }
   * ```
   */
  has(name: string): boolean {
    return this.components.has(name)
  }

  /**
   * Gets the names of all registered components.
   *
   * @returns An array of component names.
   *
   * @example
   * ```typescript
   * const names = registry.getNames()
   * console.log(`Registered: ${names.join(', ')}`)
   * ```
   */
  getNames(): string[] {
    return Array.from(this.components.keys())
  }

  /**
   * Gets the number of registered components.
   *
   * @returns The number of components.
   *
   * @example
   * ```typescript
   * console.log(`${registry.size()} components registered`)
   * ```
   */
  size(): number {
    return this.components.size
  }

  /**
   * Clears all component definitions.
   *
   * Mainly for testing purposes.
   */
  clear(): void {
    this.components.clear()
  }
}
