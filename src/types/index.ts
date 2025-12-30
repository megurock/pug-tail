import type { Block, Tag } from './pug'

/**
 * Node location information.
 */
export interface NodeLocation {
  line: number
  column?: number
  filename?: string
  /** Execution path in control flow (for duplicate slot detection). */
  path?: string
}

/**
 * Slot definition.
 */
export interface SlotDefinition {
  /** The slot name (e.g., 'header', 'body', 'footer'). */
  name: string

  /** The entire slot tag node (including default content). */
  placeholder: Tag

  /** Location information (for error reporting). */
  location: NodeLocation
}

/**
 * Component definition.
 */
export interface ComponentDefinition {
  /** The component name (e.g., 'Card', 'Button'). */
  name: string

  /** The component body (the overall structure including slots). */
  body: Block

  /** A Map of slot definitions (key: slot name, value: SlotDefinition). */
  slots: Map<string, SlotDefinition>

  /** Location information (for error reporting). */
  location: NodeLocation

  /** Usage pattern (Phase 3): which attributes are used from props/attrs. */
  usage?: ComponentUsage

  /** Scope analysis result (for scope isolation validation). */
  scopeAnalysis?: ScopeAnalysisResult
}

/**
 * Component usage pattern (Phase 3).
 * Represents which attributes are used from props/attrs in a component.
 */
export interface ComponentUsage {
  /** Properties used from 'props' identifier. */
  fromProps: string[]

  /** Properties used from 'attrs' identifier. */
  fromAttrs: string[]
}

/**
 * Scope analysis result.
 * Contains information about variables used in a component.
 */
export interface ScopeAnalysisResult {
  /** Variables declared with const/let/var in the component. */
  declaredVariables: Set<string>

  /** All variables referenced in the component. */
  referencedVariables: Set<string>

  /** Variables destructured from $props. */
  propsVariables: Set<string>

  /** Variables destructured from $attrs. */
  attrsVariables: Set<string>

  /** Variables received from scoped slots (future feature). */
  slotVariables: Set<string>

  /** Variables referenced but not declared (external references). */
  externalReferences: Set<string>
}

/**
 * Validation configuration for scope isolation.
 */
export interface ValidationConfig {
  /** How to handle external variable references. Default: 'error' (strict mode). */
  scopeIsolation?: 'error' | 'warn' | 'off'

  /** Additional global variables to allow (beyond standard JavaScript globals). */
  allowedGlobals?: string[]
}

/**
 * Error information.
 */
export interface PugTailError {
  message: string
  location?: NodeLocation
}
