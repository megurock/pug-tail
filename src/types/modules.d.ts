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
 * Module declaration for pug-load
 */
declare module 'pug-load' {
  import type { Node } from '@/types/pug'
  import type lex from 'pug-lexer'
  import type parse from 'pug-parser'

  interface LoadOptions {
    /** Lexer function (required) */
    lex: typeof lex
    /** Parser function (required) */
    parse: typeof parse
    /** Custom resolve function (optional, defaults to load.resolve) */
    resolve?: (filename: string, source: string, options: LoadOptions) => string
    /** Custom read function (optional, defaults to load.read) */
    read?: (filename: string, options?: LoadOptions) => Buffer
    /** Base directory for absolute includes (optional) */
    basedir?: string
    /** Filename of the source file (optional) */
    filename?: string
    /** Source code (used internally by load.string) */
    src?: string
  }

  interface LoadFunction {
    /**
     * Load dependencies of a Pug AST
     * Adds fullPath and str properties to Include and Extends nodes
     * Also adds ast property to Include and Extends nodes for Pug files
     */
    (ast: Node, options: LoadOptions): Node

    /**
     * Load dependencies from a Pug source string
     */
    string(src: string, options: LoadOptions): Node

    /**
     * Load dependencies from a Pug file
     */
    file(filename: string, options: LoadOptions): Node

    /**
     * Resolve the full path of an included or extended file
     * @param filename - The included file path
     * @param source - The parent file path
     * @param options - Load options
     */
    resolve(filename: string, source: string, options: LoadOptions): string

    /**
     * Read the contents of a file
     * @param filename - The file path to read
     * @param options - Load options
     */
    read(filename: string, options?: LoadOptions): Buffer

    /**
     * Validate load options
     * @param options - Options to validate
     */
    validateOptions(options: unknown): void
  }

  const load: LoadFunction

  // CommonJS default export
  export default load
  export = load
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
    doctype?: string
  }

  function generateCode(ast: Block, options?: CodeGenOptions): string

  // CommonJS default export
  export default generateCode
  export = generateCode
}
