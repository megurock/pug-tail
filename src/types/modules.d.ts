/**
 * Module declaration for pug-lexer
 */
declare module 'pug-lexer' {
  import type { Token, LexerOptions } from '@/types/pug'

  function lex(src: string, options?: LexerOptions): Token[]

  // CommonJS default export
  export default lex
  export = lex
}

/**
 * Module declaration for pug-parser
 */
declare module 'pug-parser' {
  import type { Block, ParserOptions, Token } from '@/types/pug'

  function parse(tokens: Token[], options?: ParserOptions): Block

  // CommonJS default export
  export default parse
  export = parse
}

/**
 * Module declaration for pug-walk
 */
declare module 'pug-walk' {
  import type { Node } from '@/types/pug'

  type WalkCallback = (node: Node, replace: (newNode: Node) => void) => void

  function walk(ast: Node, callback: WalkCallback, options?: unknown): Node

  // CommonJS default export
  export default walk
  export = walk
}

/**
 * Module declaration for pug-code-gen
 */
declare module 'pug-code-gen' {
  import type { Block } from '@/types/pug'

  interface CodeGenOptions {
    compileDebug?: boolean
    pretty?: boolean
    inlineRuntimeFunctions?: boolean
    templateName?: string
  }

  function generateCode(ast: Block, options?: CodeGenOptions): string

  // CommonJS default export
  export default generateCode
  export = generateCode
}
