/**
 * ErrorHandler
 *
 * A class responsible for error handling and reporting in pug-tail.
 * It provides clear error messages and location information.
 */

import type { NodeLocation, PugTailError } from '@/types'

/**
 * Options for the ErrorHandler.
 */
export interface ErrorHandlerOptions {
  /** The source filename (displayed in error messages). */
  filename?: string
}

/**
 * Extended error information.
 */
export interface ExtendedPugTailError extends Error, PugTailError {
  /** The error code. */
  code: string

  /** The location information. */
  location?: NodeLocation

  /** A hint (e.g., available component names). */
  hint?: string
}

/**
 * A class responsible for error handling and reporting.
 *
 * @example
 * ```typescript
 * const errorHandler = new ErrorHandler({ filename: 'index.pug' })
 * throw errorHandler.componentNotFound('Card', location, ['Button', 'Layout'])
 * ```
 */
export class ErrorHandler {
  private filename?: string

  constructor(options: ErrorHandlerOptions = {}) {
    this.filename = options.filename
  }

  /**
   * Creates a "Component not found" error.
   *
   * @param name - The name of the component that was not found.
   * @param location - The location where the error occurred.
   * @param availableComponents - A list of available component names.
   * @returns A formatted error.
   */
  componentNotFound(
    name: string,
    location: NodeLocation,
    availableComponents: string[],
  ): ExtendedPugTailError {
    const error = new Error(
      `Component "${name}" not found`,
    ) as ExtendedPugTailError
    error.code = 'COMPONENT_NOT_FOUND'
    error.location = location
    error.hint =
      availableComponents.length > 0
        ? `Available components: ${availableComponents.join(', ')}`
        : 'No components are defined. Make sure to define components before use.'

    return this.formatError(error)
  }

  /**
   * Creates a "Duplicate component definition" error.
   *
   * @param name - The name of the duplicate component.
   * @param existingLocation - The location of the existing definition.
   * @param newLocation - The location of the new definition.
   * @returns A formatted error.
   */
  duplicateComponent(
    name: string,
    existingLocation: NodeLocation,
    newLocation: NodeLocation,
  ): ExtendedPugTailError {
    const error = new Error(
      `Component "${name}" is already defined`,
    ) as ExtendedPugTailError
    error.code = 'DUPLICATE_COMPONENT'
    error.location = newLocation
    error.hint = `Previously defined at ${this.formatLocation(existingLocation)}`

    return this.formatError(error)
  }

  /**
   * Creates a "Duplicate slot provided" error (at component call site).
   *
   * @param slotName - The name of the duplicate slot.
   * @param location - The location where the error occurred.
   * @returns A formatted error.
   */
  duplicateSlotProvided(
    slotName: string,
    location: NodeLocation,
  ): ExtendedPugTailError {
    const error = new Error(
      `Duplicate slot "${slotName}" provided`,
    ) as ExtendedPugTailError
    error.code = 'DUPLICATE_SLOT_PROVIDED'
    error.location = location
    error.hint = 'Each slot name can only be provided once in a component call.'

    return this.formatError(error)
  }

  /**
   * Creates a "Duplicate slot definition" error (in component definition).
   *
   * @param slotName - The name of the duplicate slot.
   * @param location - The location where the error occurred.
   * @returns A formatted error.
   */
  duplicateSlotDefinition(
    slotName: string,
    location: NodeLocation,
  ): ExtendedPugTailError {
    const error = new Error(
      `Duplicate slot "${slotName}" defined in component`,
    ) as ExtendedPugTailError
    error.code = 'DUPLICATE_SLOT_DEFINITION'
    error.location = location
    error.hint =
      'Each slot name can only be defined once in a component definition.'

    return this.formatError(error)
  }

  /**
   * Creates a "Slot not defined" error (when a provided slot does not exist in the component definition).
   *
   * @param slotName - The name of the undefined slot.
   * @param location - The location where the error occurred.
   * @param availableSlots - A list of available slot names.
   * @returns A formatted error.
   */
  slotNotDefined(
    slotName: string,
    location: NodeLocation,
    availableSlots: string[],
  ): ExtendedPugTailError {
    const error = new Error(
      `Slot "${slotName}" is not defined in this component`,
    ) as ExtendedPugTailError
    error.code = 'SLOT_NOT_DEFINED'
    error.location = location
    error.hint =
      availableSlots.length > 0
        ? `Available slots: ${availableSlots.join(', ')}`
        : 'This component does not define any slots.'

    return this.formatError(error)
  }

  /**
   * Creates a "Recursive component call" error.
   *
   * @param componentName - The name of the recursively called component.
   * @param callStack - The call stack (an array of component names).
   * @param location - The location where the error occurred.
   * @returns A formatted error.
   */
  recursiveComponentCall(
    componentName: string,
    callStack: string[],
    location: NodeLocation,
  ): ExtendedPugTailError {
    const fullStack = callStack.concat(componentName)
    const stackStr = fullStack.join(' -> ')

    const error = new Error(
      `Recursive component call detected: ${stackStr}`,
    ) as ExtendedPugTailError
    error.code = 'RECURSIVE_COMPONENT_CALL'
    error.location = location
    error.hint =
      'Components cannot call themselves directly or indirectly. ' +
      'Review the component structure to break the circular dependency.'

    return this.formatError(error)
  }

  /**
   * Creates an "Unexpected node type" error.
   *
   * @param expectedType - The expected node type.
   * @param actualType - The actual node type.
   * @param location - The location where the error occurred.
   * @returns A formatted error.
   */
  unexpectedNodeType(
    expectedType: string,
    actualType: string,
    location: NodeLocation,
  ): ExtendedPugTailError {
    const error = new Error(
      `Expected ${expectedType} node, but got ${actualType}`,
    ) as ExtendedPugTailError
    error.code = 'UNEXPECTED_NODE_TYPE'
    error.location = location
    error.hint = 'This may indicate a syntax error in the Pug source.'

    return this.formatError(error)
  }

  /**
   * Creates an "External variable reference" error.
   *
   * @param variableName - The name of the external variable.
   * @param componentName - The name of the component.
   * @param location - The location where the error occurred.
   * @returns A formatted error.
   */
  externalVariableReference(
    variableName: string,
    componentName: string,
    location: NodeLocation,
  ): ExtendedPugTailError {
    const error = new Error(
      `Component "${componentName}" references external variable "${variableName}"`,
    ) as ExtendedPugTailError
    error.code = 'EXTERNAL_VARIABLE_REFERENCE'
    error.location = location
    error.hint =
      'Components must be scope-isolated. External variable access is not allowed.\n\n' +
      'Suggestions:\n' +
      `1. Pass as a prop: ${componentName}(${variableName}=${variableName})\n` +
      `2. Declare inside component: const ${variableName} = ...\n` +
      "3. Disable strict mode: Set validation.scopeIsolation to 'warn' or 'off'"

    return this.formatError(error)
  }

  /**
   * Formats an error message.
   *
   * Generates a clear error message including location information, hints,
   * and the relevant line of source code.
   *
   * @param error - The error to format.
   * @returns The formatted error.
   */
  private formatError(error: ExtendedPugTailError): ExtendedPugTailError {
    // Add location information to the error message.
    if (error.location) {
      const locationStr = this.formatLocation(error.location)
      error.message = `${error.message} at ${locationStr}`
    }

    // Add a hint.
    if (error.hint) {
      error.message = `${error.message}\n\nHint: ${error.hint}`
    }

    return error
  }

  /**
   * Formats location information into a string.
   *
   * @param location - The location information.
   * @returns A formatted location string.
   */
  private formatLocation(location: NodeLocation): string {
    const parts: string[] = []

    if (location.filename) {
      parts.push(location.filename)
    } else if (this.filename) {
      parts.push(this.filename)
    }

    parts.push(`line ${location.line}`)

    if (location.column !== undefined) {
      parts.push(`column ${location.column}`)
    }

    return parts.join(':')
  }
}
