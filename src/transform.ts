/**
 * Unified transform function
 *
 * Reads Pug source, expands components and slots,
 * and produces a plain Pug AST or HTML
 */

import generateCode from 'pug-code-gen'
import lex from 'pug-lexer'
import load from 'pug-load'
import parse from 'pug-parser'
import { dataLoader } from '@/cli/dataLoader.js'
import { ASTTransformer } from '@/core/astTransformer.js'
import { ComponentRegistry } from '@/core/componentRegistry.js'
import type { ErrorHandlerOptions } from '@/core/errorHandler.js'
import { SlotResolver } from '@/core/slotResolver.js'
import type { Block, Node } from '@/types/pug'
import {
  detectDataFiles,
  removeDataFilesDeclaration,
} from '@/utils/dataFilesDetector.js'

/**
 * Transform options
 */
export interface TransformOptions extends ErrorHandlerOptions {
  /** Enable debug output */
  debug?: boolean

  /** Output format */
  output?: 'ast' | 'html' | 'pug-code'

  /** Options for HTML generation */
  htmlOptions?: {
    /** Output pretty (formatted) HTML */
    pretty?: boolean
    /** Include compile-time debug info */
    compileDebug?: boolean
    /** Doctype to use */
    doctype?: string
  }

  /** Base directory for absolute includes (required for absolute paths) */
  basedir?: string

  /** Base path for resolving data files */
  basePath?: string

  /** Data to inject into the template (available as locals) */
  data?: Record<string, unknown>

  /** Key name for injected data (default: none, data injected directly) */
  dataKey?: string

  /** Validation configuration */
  validation?: {
    /** How to handle external variable references. Default: 'error' (strict mode). */
    scopeIsolation?: 'error' | 'warn' | 'off'
    /** Additional global variables to allow (beyond standard JavaScript globals). */
    allowedGlobals?: string[]
  }
}

/**
 * Transform result
 */
export interface TransformResult {
  /** Resulting AST (when output is 'ast') */
  ast?: Block

  /** Generated HTML (when output is 'html') */
  html?: string

  /** Generated Pug code (when output is 'pug-code') */
  code?: string
}

/**
 * Transform Pug source code
 *
 * @param source - Pug source code
 * @param options - transform options
 * @returns transform result
 *
 * @example
 * ```typescript
 * const result = transform(source, { output: 'html' })
 * console.log(result.html)
 * ```
 */
export function transform(
  source: string,
  options: TransformOptions = {},
): TransformResult {
  const {
    debug = false,
    output = 'ast',
    htmlOptions = {},
    basePath,
    ...errorHandlerOptions
  } = options

  if (debug) {
    console.log('[pug-tail] Starting transformation...')
  }

  // 1. Lexing (tokenization)
  let tokens: ReturnType<typeof lex>
  try {
    tokens = errorHandlerOptions.filename
      ? lex(source, { filename: errorHandlerOptions.filename })
      : lex(source)
    if (debug) {
      console.log(`[pug-tail] Lexed ${tokens.length} tokens`)
    }
  } catch (error) {
    throw new Error(
      `Lexing failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  // 2. Parsing (syntax analysis)
  let ast: Node
  try {
    ast = errorHandlerOptions.filename
      ? parse(tokens as unknown as Parameters<typeof parse>[0], {
          filename: errorHandlerOptions.filename,
        })
      : parse(tokens as unknown as Parameters<typeof parse>[0])
    if (debug) {
      console.log('[pug-tail] Parsed AST:', JSON.stringify(ast, null, 2))
    }
  } catch (error) {
    throw new Error(
      `Parsing failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  // 2.5. Load includes and extends (resolve dependencies)
  try {
    ast = load(ast, {
      lex,
      parse,
      basedir: options.basedir,
      filename: errorHandlerOptions.filename,
    })
    if (debug) {
      console.log('[pug-tail] Loaded includes/extends')
    }
  } catch (error) {
    throw new Error(
      `Loading includes/extends failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  // 2.7. Detect and load $dataFiles
  const globalData = options.data || {}
  let pageData = {}
  try {
    const dataFilePaths = detectDataFiles(ast as Block)
    if (dataFilePaths.length > 0) {
      if (debug) {
        console.log('[pug-tail] Detected $dataFiles:', dataFilePaths)
        console.log('[pug-tail] basePath:', basePath)
        console.log('[pug-tail] basedir:', options.basedir)
      }
      pageData = dataLoader.loadDataFiles(
        dataFilePaths,
        basePath,
        options.basedir,
      )
      if (debug) {
        console.log('[pug-tail] Loaded data from files:', pageData)
      }
      // Remove $dataFiles declaration from AST
      removeDataFilesDeclaration(ast as Block)
      if (debug) {
        console.log('[pug-tail] Loaded and removed $dataFiles declaration')
      }
    }
  } catch (error) {
    throw new Error(
      `Loading $dataFiles failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  // 3. Transformation (expand components and slots)
  const registry = new ComponentRegistry(errorHandlerOptions)
  const resolver = new SlotResolver(errorHandlerOptions)
  const transformer = new ASTTransformer(registry, resolver, {
    ...errorHandlerOptions,
    validation: options.validation,
    debug,
  })

  // No try-catch needed because ErrorHandler will throw errors directly
  const transformedAst = transformer.transform(ast)
  if (debug) {
    console.log(
      '[pug-tail] Transformed AST:',
      JSON.stringify(transformedAst, null, 2),
    )
  }

  // 4. Output generation
  const result: TransformResult = {}

  if (output === 'ast') {
    if (transformedAst.type !== 'Block') {
      throw new Error('Expected Block node after transformation')
    }
    result.ast = transformedAst as Block
  } else if (output === 'html') {
    // Merge data for HTML generation
    // If dataKey is not specified, merge globalData and pageData for backward compatibility
    const mergedGlobalData = options.dataKey
      ? globalData
      : { ...globalData, ...pageData }
    const mergedPageData = options.dataKey ? pageData : {}

    result.html = generateHTML(transformedAst as Block, {
      pretty: htmlOptions.pretty ?? true,
      compileDebug: htmlOptions.compileDebug ?? false,
      doctype: htmlOptions.doctype,
      globalData: mergedGlobalData,
      pageData: mergedPageData,
      dataKey: options.dataKey,
    })
    if (debug) {
      console.log('[pug-tail] Generated HTML:', result.html)
    }
  } else if (output === 'pug-code') {
    result.code = generateCode(transformedAst as Block, {
      compileDebug: htmlOptions.compileDebug ?? false,
      pretty: htmlOptions.pretty ?? true,
    })
    if (debug) {
      console.log('[pug-tail] Generated code:', result.code)
    }
  }

  if (debug) {
    console.log('[pug-tail] Transformation completed')
  }

  return result
}

/**
 * Simple implementation of a Pug runtime
 *
 * Required to execute code generated by pug-code-gen
 */
function createPugRuntime() {
  return {
    attr: (key: string, val: unknown, escaped: boolean) => {
      if (val === true) return ` ${key}`
      if (val === false || val == null) return ''
      return escaped
        ? ` ${key}="${String(val).replace(/"/g, '&quot;')}"`
        : ` ${key}="${val}"`
    },
    attrs: (attrs: Record<string, unknown>) => {
      const result: string[] = []
      for (const [key, val] of Object.entries(attrs)) {
        if (val === true) result.push(` ${key}`)
        else if (val !== false && val != null)
          result.push(` ${key}="${String(val).replace(/"/g, '&quot;')}"`)
      }
      return result.join('')
    },
    escape: (str: string) =>
      String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;'),
    rethrow: (err: Error) => {
      throw err
    },
    // classes function used to generate class attribute
    classes: (classes: unknown) => {
      if (Array.isArray(classes)) {
        return classes.filter(Boolean).join(' ')
      }
      if (typeof classes === 'object' && classes !== null) {
        return Object.entries(classes)
          .filter(([, val]) => val)
          .map(([key]) => key)
          .join(' ')
      }
      return String(classes)
    },
    // merge function used by &attributes
    merge: (...args: unknown[]) => {
      // If the first argument is an array, treat it as the sources list
      const sources: Record<string, unknown>[] =
        args.length === 1 && Array.isArray(args[0])
          ? args[0]
          : (args as Record<string, unknown>[])

      const base: Record<string, unknown> = {}

      for (const source of sources) {
        if (!source || typeof source !== 'object') continue

        for (const [key, val] of Object.entries(
          source as Record<string, unknown>,
        )) {
          if (key === 'class') {
            // Treat 'class' specially: combine arrays or space-separated strings
            const baseClass = base.class
            const sourceClass = val

            if (baseClass && sourceClass) {
              const baseClasses = Array.isArray(baseClass)
                ? baseClass
                : String(baseClass).split(' ')
              const sourceClasses = Array.isArray(sourceClass)
                ? sourceClass
                : String(sourceClass).split(' ')

              base.class = [...baseClasses, ...sourceClasses]
                .filter(Boolean)
                .join(' ')
            } else {
              base.class = sourceClass || baseClass
            }
          } else {
            // Other attributes are overwritten
            base[key] = val
          }
        }
      }
      return base
    },
  }
}

/**
 * Generate HTML from AST
 *
 * @param ast - transformed AST
 * @param options - HTML generation options
 * @returns generated HTML
 */
function generateHTML(
  ast: Block,
  options: {
    pretty?: boolean
    compileDebug?: boolean
    doctype?: string
    globalData?: Record<string, unknown>
    pageData?: Record<string, unknown>
    dataKey?: string
  },
): string {
  try {
    const generatedCode = generateCode(ast, {
      compileDebug: options.compileDebug ?? false,
      pretty: options.pretty ?? true,
      doctype: options.doctype,
    })

    const pugRuntime = createPugRuntime()

    // Code generated by pug-code-gen is in the form `function template(locals)`
    // eslint-disable-next-line no-new-func
    const templateFn = new Function(
      'pug',
      `
      ${generatedCode}
      return template;
      `,
    )

    // Get the template function
    const template = templateFn(pugRuntime)

    if (typeof template !== 'function') {
      throw new Error('Template function was not returned from generated code')
    }

    // Build locals: wrap globalData in dataKey, merge with pageData
    let locals: Record<string, unknown> = {}

    // Add global data (wrapped in dataKey if specified)
    const globalData = options.globalData || {}
    if (Object.keys(globalData).length > 0) {
      if (options.dataKey) {
        locals[options.dataKey] = globalData
      } else {
        locals = { ...locals, ...globalData }
      }
    }

    // Add page data (always directly, never wrapped)
    const pageData = options.pageData || {}
    if (Object.keys(pageData).length > 0) {
      locals = { ...locals, ...pageData }
    }

    // Pass data as locals to the template
    const html = template(locals)

    // Return an empty string if html is undefined or null
    if (html == null) {
      return ''
    }

    return String(html)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`HTML generation failed: ${error.message}`)
    }
    throw error
  }
}
