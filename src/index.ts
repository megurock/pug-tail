/**
 * pug-tail - A transpiler that statically expands component DSL with slot syntax on Pug AST
 *
 * @module pug-tail
 */

export const version = '0.1.0-alpha.0'

export { ASTTransformer } from '@/core/astTransformer'
// Core modules
export { ComponentRegistry } from '@/core/componentRegistry'
export type { ExtendedPugTailError } from '@/core/errorHandler'
export { ErrorHandler, type ErrorHandlerOptions } from '@/core/errorHandler'
export { SlotResolver } from '@/core/slotResolver'
export {
  type TransformOptions,
  type TransformResult,
  transform,
} from './transform'
// Types
export type {
  ComponentDefinition,
  NodeLocation,
  PugTailError,
  SlotDefinition,
} from './types'
// Utilities
export {
  extractComponentBody,
  extractComponentDefinition,
  extractComponentName,
  extractSlotDefinition,
  extractSlotDefinitions,
  extractSlotName,
  isComponentDefinitionNode,
  isSlotDefinitionNode,
} from './utils/componentDetector'
