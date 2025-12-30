/**
 * Type definitions for the Pug AST.
 * Defined independently as official type definitions do not exist.
 */

export interface Location {
  line: number
  column: number
  filename?: string
}

export interface BaseNode {
  type: string
  line: number
  column?: number
  filename?: string
}

export interface Block {
  type: 'Block'
  nodes: Node[]
  line: number
  column?: number
  filename?: string
}

export interface Tag extends BaseNode {
  type: 'Tag'
  name: string
  selfClosing: boolean
  block: Block
  attrs: Attribute[]
  attributeBlocks: AttributeBlock[]
  isInline: boolean
}

export interface Attribute {
  name: string
  val: string | boolean
  mustEscape: boolean
  line?: number
  column?: number
}

export interface AttributeBlock {
  type: 'AttributeBlock'
  val: string
  line?: number
  column?: number
  filename?: string
}

export interface Text extends BaseNode {
  type: 'Text'
  val: string
}

export interface Comment extends BaseNode {
  type: 'Comment'
  val: string
  buffer: boolean
}

export interface Code extends BaseNode {
  type: 'Code'
  val: string
  buffer: boolean
  mustEscape: boolean
  isInline: boolean
}

export interface Mixin extends BaseNode {
  type: 'Mixin'
  name: string
  args: string | null
  block: Block
  call: boolean
}

export interface Conditional extends BaseNode {
  type: 'Conditional'
  test: string
  consequent: Block
  alternate: Block | Conditional | null
}

export interface Each extends BaseNode {
  type: 'Each'
  obj: string
  val: string
  key: string | null
  block: Block
  alternate: Block | null
}

export interface While extends BaseNode {
  type: 'While'
  test: string
  block: Block
}

export interface Case extends BaseNode {
  type: 'Case'
  expr: string
  block: Block
}

export interface When extends BaseNode {
  type: 'When'
  expr: string
  block: Block
  debug: boolean
}

export interface FileReference {
  type: 'FileReference'
  path: string
  filename?: string
  fullPath?: string
  str?: string
  raw?: Buffer
  ast?: Block
}

export interface Include extends BaseNode {
  type: 'Include'
  file: FileReference
  block: Block | null
}

export interface Extends extends BaseNode {
  type: 'Extends'
  file: FileReference
  block: Block
}

export interface RawInclude extends BaseNode {
  type: 'RawInclude'
  file: FileReference
  filters: unknown[]
}

export interface InterpolatedTag extends BaseNode {
  type: 'InterpolatedTag'
  expr: string
  selfClosing: boolean
  block: Block
  attrs: Attribute[]
  attributeBlocks: AttributeBlock[]
  isInline: boolean
}

// Union of all Node types.
export type Node =
  | Block
  | Tag
  | Text
  | Comment
  | Code
  | Mixin
  | Conditional
  | Each
  | While
  | Case
  | When
  | Include
  | Extends
  | RawInclude
  | InterpolatedTag

/**
 * Token type for pug-lexer.
 */
export interface Token {
  type: string
  line: number
  col: number
  val?: string
  name?: string
  mustEscape?: boolean
  buffer?: boolean
}

/**
 * Function signature for pug-lexer.
 */
export function lex(src: string, options?: LexerOptions): Token[]

export interface LexerOptions {
  filename?: string
  plugins?: unknown[]
}

/**
 * Function signature for pug-parser.
 */
export function parse(tokens: Token[], options?: ParserOptions): Block

export interface ParserOptions {
  filename?: string
  src?: string
  plugins?: unknown[]
}
