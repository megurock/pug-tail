#!/usr/bin/env node
/**
 * pug-tail CLI
 *
 * An interface for using pug-tail from the command line.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type TransformOptions, transform } from './transform.js'

/**
 * CLI options.
 */
interface CLIOptions {
  /** Input file. */
  input?: string

  /** Output file. */
  output?: string

  /** Output format. */
  format?: 'html' | 'ast' | 'pug-code'

  /** Enable debug output. */
  debug?: boolean

  /** Show help. */
  help?: boolean

  /** Show version. */
  version?: boolean
}

/**
 * Displays the help message.
 */
function showHelp(): void {
  console.log(`
pug-tail - A transpiler that statically expands component DSL with slot syntax on Pug AST

Usage:
  pug-tail [options] <input-file>

Options:
  -o, --output <file>    Output file path (default: stdout)
  -f, --format <format>  Output format: html, ast, pug-code (default: html)
  -d, --debug            Enable debug output
  -h, --help             Show this help message
  -v, --version          Show version number

Examples:
  pug-tail input.pug -o output.html
  pug-tail input.pug -f html -o output.html
  pug-tail input.pug -f ast -o output.json
  pug-tail input.pug --debug

For more information, visit: https://github.com/megurock/pug-tail
`)
}

/**
 * Displays the version number.
 */
function showVersion(): void {
  // Read the version from package.json.
  try {
    const packagePath = resolve(
      fileURLToPath(import.meta.url),
      '../../package.json',
    )
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))
    console.log(packageJson.version)
  } catch {
    console.log('1.0.0')
  }
}

/**
 * Parses command line arguments.
 *
 * @param args - The command line arguments.
 * @returns The parsed options.
 */
function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '-h' || arg === '--help') {
      options.help = true
    } else if (arg === '-v' || arg === '--version') {
      options.version = true
    } else if (arg === '-d' || arg === '--debug') {
      options.debug = true
    } else if (arg === '-o' || arg === '--output') {
      const next = args[i + 1]
      if (!next || next.startsWith('-')) {
        console.error('Error: --output requires a file path')
        process.exit(1)
      }
      options.output = next
      i++
    } else if (arg === '-f' || arg === '--format') {
      const next = args[i + 1]
      if (!next || next.startsWith('-')) {
        console.error('Error: --format requires a format (html, ast, pug-code)')
        process.exit(1)
      }
      if (next !== 'html' && next !== 'ast' && next !== 'pug-code') {
        console.error('Error: --format must be one of: html, ast, pug-code')
        process.exit(1)
      }
      options.format = next
      i++
    } else if (arg && !arg.startsWith('-')) {
      // Input file.
      if (options.input) {
        console.error('Error: Multiple input files are not supported')
        process.exit(1)
      }
      options.input = arg
    }
  }

  return options
}

/**
 * The main process.
 */
function main(): void {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    showHelp()
    process.exit(0)
  }

  const options = parseArgs(args)

  if (options.help) {
    showHelp()
    process.exit(0)
  }

  if (options.version) {
    showVersion()
    process.exit(0)
  }

  if (!options.input) {
    console.error('Error: Input file is required')
    console.error('Use --help for usage information')
    process.exit(1)
  }

  // Read the input file.
  let source: string
  try {
    const inputPath = resolve(process.cwd(), options.input)
    source = readFileSync(inputPath, 'utf-8')
  } catch (error) {
    console.error(
      `Error: Failed to read input file "${options.input}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    process.exit(1)
  }

  // Transformation options.
  const transformOptions: TransformOptions = {
    filename: options.input,
    debug: options.debug ?? false,
    output: options.format ?? 'html',
    htmlOptions: {
      pretty: true,
      compileDebug: false,
    },
  }

  // Execute the transformation.
  try {
    const result = transform(source, transformOptions)

    // Output.
    let output: string
    if (options.format === 'ast') {
      // If the format is AST, output in JSON format.
      if (!result.ast) {
        console.error('Error: AST output is not available')
        process.exit(1)
      }
      output = JSON.stringify(result.ast, null, 2)
    } else if (options.format === 'pug-code') {
      output = result.code ?? ''
    } else {
      // If the format is HTML, output as is (default).
      if (!result.html) {
        console.error('Error: HTML output is not available')
        process.exit(1)
      }
      output = result.html
    }

    if (options.output) {
      // Output to a file.
      try {
        const outputPath = resolve(process.cwd(), options.output)
        writeFileSync(outputPath, output, 'utf-8')
        if (options.debug) {
          console.log(`[pug-tail] Output written to: ${outputPath}`)
        }
      } catch (error) {
        console.error(
          `Error: Failed to write output file "${options.output}": ${
            error instanceof Error ? error.message : String(error)
          }`,
        )
        process.exit(1)
      }
    } else {
      // Output to stdout.
      console.log(output)
    }
  } catch (error) {
    // Display the error.
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`)
      if (error.stack && options.debug) {
        console.error(error.stack)
      }
    } else {
      console.error(`Error: ${String(error)}`)
    }
    process.exit(1)
  }
}

// Run main only when executed as a CLI.
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
