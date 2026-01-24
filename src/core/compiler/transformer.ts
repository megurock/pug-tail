/**
 * Transformer
 *
 * Main transformation pipeline that orchestrates all visitors.
 *
 * This class replaces the old ASTTransformer by using the visitor pattern.
 * It creates a pipeline of visitors and executes them in sequence.
 */

import type { Node } from '@/types/pug'
import type { ComponentRegistry } from '../componentRegistry'
import type { ErrorHandler, ErrorHandlerOptions } from '../errorHandler'
import {
  type ComponentDetectorOptions,
  ComponentDetectorVisitor,
} from '../visitors/componentDetector'
import {
  type ComponentExpanderOptions,
  ComponentExpanderVisitor,
} from '../visitors/componentExpander'
import { DefinitionRemoverVisitor } from '../visitors/definitionRemover'
import { IncludeFlattenerVisitor } from '../visitors/includeFlattener'
import type { Visitor } from '../visitors/visitor'
import { Traverser } from './traverser'

/**
 * Configuration options for Transformer.
 */
export interface TransformerOptions extends ErrorHandlerOptions {
  /** Validation configuration */
  validation?: {
    /** How to handle external variable references. Default: 'error' (strict mode). */
    scopeIsolation?: 'error' | 'warn' | 'off'
    /** Additional global variables to allow (beyond standard JavaScript globals). */
    allowedGlobals?: string[]
  }
  /** Enable debug output */
  debug?: boolean
}

/**
 * A class that transforms the AST using the visitor pattern.
 *
 * Processing flow:
 * 1. ComponentDetectorVisitor - Detect and register component definitions
 * 2. ComponentExpanderVisitor - Expand component calls
 * 3. DefinitionRemoverVisitor - Remove component definition nodes
 * 4. IncludeFlattenerVisitor - Flatten Include/Extends nodes
 *
 * @example
 * ```typescript
 * const registry = new ComponentRegistry()
 * const errorHandler = new ErrorHandler()
 * const transformer = new Transformer(registry, errorHandler)
 *
 * const transformedAst = transformer.transform(ast)
 * ```
 */
export class Transformer {
  private traverser: Traverser
  private config: TransformerOptions

  constructor(
    private registry: ComponentRegistry,
    private errorHandler: ErrorHandler,
    options: TransformerOptions = {},
  ) {
    this.traverser = new Traverser()
    this.config = options
  }

  /**
   * Transforms the AST.
   *
   * @param ast - The AST to transform.
   * @returns The transformed AST (a pure Pug AST with components and slots expanded).
   *
   * @example
   * ```typescript
   * const transformed = transformer.transform(ast)
   * ```
   */
  transform(ast: Node): Node {
    // Create the transformation pipeline
    const pipeline = this.createPipeline()

    // Execute each visitor in sequence
    let transformedAst = ast
    for (const visitor of pipeline) {
      transformedAst = this.traverser.traverse(transformedAst, visitor)
    }

    return transformedAst
  }

  /**
   * Creates the transformation pipeline.
   *
   * @returns Array of visitors to be executed in sequence
   */
  private createPipeline(): Visitor[] {
    // Create visitor options
    const detectorOptions: ComponentDetectorOptions = {
      validation: this.config.validation,
      debug: this.config.debug,
    }

    const expanderOptions: ComponentExpanderOptions = {
      debug: this.config.debug,
    }

    // Build the pipeline
    return [
      // Phase 1: Detect and register component definitions
      new ComponentDetectorVisitor(
        this.registry,
        this.errorHandler,
        detectorOptions,
      ) as unknown as Visitor,

      // Phase 2: Expand component calls
      new ComponentExpanderVisitor(
        this.registry,
        this.errorHandler,
        expanderOptions,
      ) as unknown as Visitor,

      // Phase 3: Remove component definition nodes
      new DefinitionRemoverVisitor(),

      // Phase 4: Flatten Include/Extends nodes
      new IncludeFlattenerVisitor(),
    ]
  }
}
