import type { Block, Tag } from './pug'

/**
 * Node location information.
 */
export interface NodeLocation {
  line: number
  column?: number
  filename?: string
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
 * Error information.
 */
export interface PugTailError {
  message: string
  location?: NodeLocation
}
