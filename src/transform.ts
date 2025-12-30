/**
 * 統合変換関数
 *
 * Pug ソースコードを読み込み、component と slot を展開して
 * 純粋な Pug AST または HTML を生成する
 */

import generateCode from 'pug-code-gen'
import lex from 'pug-lexer'
import parse from 'pug-parser'
import { ASTTransformer } from '@/core/astTransformer.js'
import { ComponentRegistry } from '@/core/componentRegistry.js'
import type { ErrorHandlerOptions } from '@/core/errorHandler.js'
import { SlotResolver } from '@/core/slotResolver.js'
import type { Block, Node } from '@/types/pug'

/**
 * 変換オプション
 */
export interface TransformOptions extends ErrorHandlerOptions {
  /** デバッグ出力を有効にする */
  debug?: boolean

  /** 出力形式 */
  output?: 'ast' | 'html' | 'pug-code'

  /** HTML 生成時のオプション */
  htmlOptions?: {
    /** 整形された HTML を出力 */
    pretty?: boolean
    /** コンパイル時のデバッグ情報を含める */
    compileDebug?: boolean
  }
}

/**
 * 変換結果
 */
export interface TransformResult {
  /** 変換後の AST（output が 'ast' の場合） */
  ast?: Block

  /** 生成された HTML（output が 'html' の場合） */
  html?: string

  /** 生成された Pug コード（output が 'pug-code' の場合） */
  code?: string
}

/**
 * Pug ソースコードを変換
 *
 * @param source - Pug ソースコード
 * @param options - 変換オプション
 * @returns 変換結果
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
    ...errorHandlerOptions
  } = options

  if (debug) {
    console.log('[pug-tail] Starting transformation...')
  }

  // 1. Lexing（字句解析）
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

  // 2. Parsing（構文解析）
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

  // 3. Transformation（component と slot の展開）
  const registry = new ComponentRegistry(errorHandlerOptions)
  const resolver = new SlotResolver(errorHandlerOptions)
  const transformer = new ASTTransformer(
    registry,
    resolver,
    errorHandlerOptions,
  )

  // ErrorHandler が生成したエラーをそのまま投げるため、try-catch は不要
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
    result.html = generateHTML(transformedAst as Block, {
      pretty: htmlOptions.pretty ?? true,
      compileDebug: htmlOptions.compileDebug ?? false,
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
 * Pug runtime の簡易実装
 *
 * pug-code-gen が生成したコードを実行するために必要
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
  }
}

/**
 * AST から HTML を生成
 *
 * @param ast - 変換後の AST
 * @param options - HTML 生成オプション
 * @returns 生成された HTML
 */
function generateHTML(
  ast: Block,
  options: { pretty?: boolean; compileDebug?: boolean },
): string {
  try {
    const generatedCode = generateCode(ast, {
      compileDebug: options.compileDebug ?? false,
      pretty: options.pretty ?? true,
    })

    const pugRuntime = createPugRuntime()

    // pug-code-gen が生成するコードは function template(locals) の形式
    // eslint-disable-next-line no-new-func
    const templateFn = new Function(
      'pug',
      `
      ${generatedCode}
      return template;
      `,
    )

    // template 関数を取得
    const template = templateFn(pugRuntime)

    if (typeof template !== 'function') {
      throw new Error('Template function was not returned from generated code')
    }

    // locals として空オブジェクトを渡す
    const html = template({})

    // html が undefined や null の場合は空文字列を返す
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
