#!/usr/bin/env node
/**
 * pug-tail CLI
 *
 * An interface for using pug-tail from the command line.
 */

import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findConfigFile, loadConfig } from './cli/config/loader.js'
import { loadData, mergeData } from './cli/dataLoader.js'
import { FileProcessor } from './cli/fileProcessor.js'
import { parseFrontmatter } from './cli/frontmatterParser.js'
import { Watcher } from './cli/watcher.js'
import { type TransformOptions, transform } from './transform.js'

/**
 * CLI options.
 */
interface CLIOptions {
  /** Input files/directories/patterns. */
  inputs: string[]

  /** Output directory or file. */
  output?: string

  /** Data to inject (JSON string or file path). */
  obj?: string

  /** Base directory for absolute includes. */
  basedir?: string

  /** Output format. */
  format?: 'html' | 'ast' | 'pug-code'

  /** Output file extension. */
  extension?: string

  /** Pretty print HTML. */
  pretty?: boolean

  /** Doctype to use. */
  doctype?: string

  /** Enable debug output. */
  debug?: boolean

  /** Silent mode (no log output). */
  silent?: boolean

  /** Show help. */
  help?: boolean

  /** Show version. */
  version?: boolean

  /** Watch mode. */
  watch?: boolean

  /** Config file path. */
  config?: string
}

/**
 * Displays the help message.
 */
function showHelp(): void {
  console.log(`
pug-tail - A transpiler that statically expands component DSL with slot syntax on Pug AST

Usage:
  pug-tail [options] [files...]

Arguments:
  files...                    Input files, directories, or glob patterns

Options:
  Output:
    -o, --out <dir>           Output directory (or file for single input)
    -E, --extension <ext>     Output file extension (default: .html)

  Data:
    -O, --obj <str|path>      Data to inject (JSON string or file path)

  Pug:
    -b, --basedir <path>      Base directory for absolute includes
    --doctype <str>           Specify doctype (e.g., html, xml, transitional)

  Formatting:
    -P, --pretty              Pretty print HTML output
    -f, --format <format>     Output format: html, ast, pug-code (default: html)

  Config:
    -c, --config <path>       Path to config file (default: auto-detect)

  Other:
    -d, --debug               Enable debug output
    -s, --silent              Silent mode (no log output)
    -w, --watch               Watch mode (recompile on file changes)
    -h, --help                Show this help message
    -v, --version             Show version number

Examples:
  # Single file
  pug-tail src/index.pug -o dist/

  # Multiple files
  pug-tail src/index.pug src/about.pug -o dist/

  # Glob pattern
  pug-tail "src/**/*.pug" -o dist/

  # Directory (recursive)
  pug-tail src/ -o dist/

  # With data injection (JSON string)
  pug-tail src/ -o dist/ -O '{"title": "My Site", "year": 2025}'

  # With data injection (JSON file)
  pug-tail src/ -o dist/ -O data.json

  # With basedir for absolute includes
  pug-tail src/pages/ -o dist/ -b src/

  # Pretty print
  pug-tail src/ -o dist/ -P

  # Debug mode
  pug-tail src/ -o dist/ -d

For more information, visit: https://github.com/megurock/pug-tail
`)
}

/**
 * Displays the version number.
 */
function showVersion(): void {
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
  const options: CLIOptions = {
    inputs: [],
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '-h' || arg === '--help') {
      options.help = true
    } else if (arg === '-v' || arg === '--version') {
      options.version = true
    } else if (arg === '-d' || arg === '--debug') {
      options.debug = true
    } else if (arg === '-s' || arg === '--silent') {
      options.silent = true
    } else if (arg === '-P' || arg === '--pretty') {
      options.pretty = true
    } else if (arg === '-w' || arg === '--watch') {
      options.watch = true
    } else if (arg === '-O' || arg === '--obj') {
      const next = args[i + 1]
      if (!next || next.startsWith('-')) {
        console.error('Error: --obj requires a JSON string or file path')
        process.exit(1)
      }
      options.obj = next
      i++
    } else if (arg === '-b' || arg === '--basedir') {
      const next = args[i + 1]
      if (!next || next.startsWith('-')) {
        console.error('Error: --basedir requires a path')
        process.exit(1)
      }
      options.basedir = next
      i++
    } else if (arg === '--doctype') {
      const next = args[i + 1]
      if (!next || next.startsWith('-')) {
        console.error('Error: --doctype requires a doctype string')
        process.exit(1)
      }
      options.doctype = next
      i++
    } else if (arg === '-o' || arg === '--out' || arg === '--output') {
      const next = args[i + 1]
      if (!next || next.startsWith('-')) {
        console.error('Error: --out requires a path')
        process.exit(1)
      }
      options.output = next
      i++
    } else if (arg === '-E' || arg === '--extension') {
      const next = args[i + 1]
      if (!next || next.startsWith('-')) {
        console.error('Error: --extension requires an extension')
        process.exit(1)
      }
      // Add leading dot if not present
      options.extension = next.startsWith('.') ? next : `.${next}`
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
    } else if (arg === '-c' || arg === '--config') {
      const next = args[i + 1]
      if (!next || next.startsWith('-')) {
        console.error('Error: --config requires a config file path')
        process.exit(1)
      }
      options.config = next
      i++
    } else if (arg && !arg.startsWith('-')) {
      // Input file/directory/pattern
      options.inputs.push(arg)
    }
  }

  return options
}

/**
 * Checks if we should use single-file mode.
 *
 * Single-file mode is used when:
 * - There is exactly one input
 * - The input is a file (not a directory or pattern)
 * - The output is specified and is not a directory
 *
 * @param options - CLI options
 * @returns True if single-file mode should be used
 */
function useSingleFileMode(options: CLIOptions): boolean {
  if (options.inputs.length !== 1) return false

  const input = options.inputs[0]
  if (!input) return false // Guard against undefined

  // Check if input contains glob characters
  if (input.includes('*') || input.includes('?') || input.includes('[')) {
    return false
  }

  // Check if input is a file
  try {
    const inputPath = resolve(process.cwd(), input)
    const stat = statSync(inputPath)
    if (!stat.isFile()) return false
  } catch {
    return false
  }

  // Check if output is specified and is not a directory
  if (options.output) {
    // If output ends with /, treat it as a directory
    if (options.output.endsWith('/') || options.output.endsWith('\\')) {
      return false
    }

    try {
      const outputPath = resolve(process.cwd(), options.output)
      const stat = statSync(outputPath)
      if (stat.isDirectory()) return false
    } catch {
      // Output doesn't exist yet
      // If it has an extension (.html, .htm, etc.), treat as file
      if (/\.\w+$/.test(options.output)) {
        return true
      }
      // No extension = treat as directory
      return false
    }
  }

  // No output specified, use stdout
  return true
}

/**
 * Processes files using the single-file mode (backward compatible).
 *
 * @param options - CLI options
 */
function processSingleFile(options: CLIOptions): void {
  const input = options.inputs[0]
  if (!input) {
    console.error('Error: No input file specified')
    process.exit(1)
  }

  // Load data if provided
  let data: Record<string, unknown> | undefined
  if (options.obj) {
    try {
      data = loadData(options.obj)
      if (options.debug) {
        console.log('[pug-tail] Loaded data:', JSON.stringify(data, null, 2))
      }
    } catch (error) {
      console.error(
        `Error: Failed to load data: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
      process.exit(1)
    }
  }

  let source: string
  try {
    const inputPath = resolve(process.cwd(), input)
    source = readFileSync(inputPath, 'utf-8')
  } catch (error) {
    console.error(
      `Error: Failed to read input file "${input}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    process.exit(1)
  }

  // Parse frontmatter
  const { data: frontmatterData, content, dataFiles } = parseFrontmatter(source)

  // Load data from "@dataFiles" directive
  let dataFilesData: Record<string, unknown> = {}
  if (dataFiles.length > 0) {
    for (const dataFile of dataFiles) {
      try {
        // Resolve path: absolute (from basedir) or relative (from input file)
        let dataFilePath: string
        if (dataFile.startsWith('/')) {
          // Absolute path from basedir
          if (options.basedir) {
            dataFilePath = resolve(options.basedir, dataFile.slice(1))
          } else {
            console.error(
              `Error: Absolute path "${dataFile}" requires basedir option (-b, --basedir)`,
            )
            process.exit(1)
          }
        } else {
          // Relative path from input file
          const inputDir = dirname(resolve(process.cwd(), input))
          dataFilePath = resolve(inputDir, dataFile)
        }

        const fileData = JSON.parse(readFileSync(dataFilePath, 'utf-8'))
        dataFilesData = mergeData(dataFilesData, fileData)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        console.error(`Error loading data file "${dataFile}":`, errorMessage)
        process.exit(1)
      }
    }
  }

  // Merge data: CLI -O → @dataFiles → frontmatter direct
  const mergedData = mergeData(data, dataFilesData, frontmatterData)

  const transformOptions: TransformOptions = {
    filename: input,
    debug: options.debug ?? false,
    output: options.format ?? 'html',
    htmlOptions: {
      pretty: options.pretty ?? false,
      compileDebug: false,
      doctype: options.doctype,
    },
    data: mergedData,
    basedir: options.basedir,
  }

  try {
    // Transform using cleaned content (without frontmatter)
    const result = transform(content, transformOptions)

    let output: string
    if (options.format === 'ast') {
      if (!result.ast) {
        console.error('Error: AST output is not available')
        process.exit(1)
      }
      output = JSON.stringify(result.ast, null, 2)
    } else if (options.format === 'pug-code') {
      output = result.code ?? ''
    } else {
      if (!result.html) {
        console.error('Error: HTML output is not available')
        process.exit(1)
      }
      output = result.html
    }

    if (options.output) {
      try {
        const outputPath = resolve(process.cwd(), options.output)

        // Create output directory if it doesn't exist
        const outputDir = dirname(outputPath)
        mkdirSync(outputDir, { recursive: true })

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
      console.log(output)
    }
  } catch (error) {
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

/**
 * Processes files using the multi-file mode.
 *
 * @param options - CLI options
 * @param config - Configuration from file
 */
async function processMultipleFiles(
  options: CLIOptions,
  config?: Awaited<ReturnType<typeof loadConfig>>,
): Promise<void> {
  // Load data if provided
  let data: Record<string, unknown> | undefined
  if (options.obj) {
    try {
      data = loadData(options.obj)
      if (options.debug) {
        console.log('[pug-tail] Loaded data:', JSON.stringify(data, null, 2))
      }
    } catch (error) {
      console.error(
        `Error: Failed to load data: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
      process.exit(1)
    }
  }

  const processor = new FileProcessor({
    outputDir: options.output,
    extension: options.extension,
    transformOptions: {
      debug: options.debug ?? false,
      output: options.format ?? 'html',
      htmlOptions: {
        pretty: options.pretty ?? false,
        compileDebug: false,
        doctype: options.doctype,
      },
      basedir: options.basedir,
    },
    data,
    silent: options.silent,
    debug: options.debug,
    config,
  })

  const results = await processor.processInputs(options.inputs)

  // Count successes and failures (exclude ignored files)
  const processedResults = results.filter((r) => !r.ignored)
  const successful = processedResults.filter((r) => r.success).length
  const failed = processedResults.filter((r) => !r.success).length

  if (!options.silent && processedResults.length > 0) {
    console.log()
    console.log(`Processed ${successful} file(s) successfully`)
    if (failed > 0) {
      console.log(`Failed to process ${failed} file(s)`)
    }
  }

  // Exit with error code if any files failed
  if (failed > 0) {
    process.exit(1)
  }
}

/**
 * The main process.
 */
async function main(): Promise<void> {
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

  if (options.inputs.length === 0) {
    console.error('Error: No input files specified')
    console.error('Use --help for usage information')
    process.exit(1)
  }

  // Load configuration file
  const config = await loadConfig(options.config)

  if (options.debug && config && Object.keys(config).length > 0) {
    const configPath = options.config || findConfigFile()
    console.log(
      `[pug-tail] Loaded config${configPath ? ` from ${configPath}` : ''}:`,
      JSON.stringify(config, null, 2),
    )
  }

  // Determine mode and process
  if (options.watch) {
    // Watch mode requires output directory
    if (!options.output) {
      console.error('Error: Watch mode requires output directory (-o, --out)')
      process.exit(1)
    }

    // Watch mode
    // Load data if provided
    let data: Record<string, unknown> | undefined
    if (options.obj) {
      try {
        data = loadData(options.obj)
        if (options.debug) {
          console.log('[pug-tail] Loaded data:', JSON.stringify(data, null, 2))
        }
      } catch (error) {
        console.error(
          `Error: Failed to load data: ${
            error instanceof Error ? error.message : String(error)
          }`,
        )
        process.exit(1)
      }
    }

    const watcher = new Watcher({
      paths: options.inputs,
      outputDir: options.output,
      extension: options.extension,
      transformOptions: {
        debug: options.debug ?? false,
        output: options.format ?? 'html',
        htmlOptions: {
          pretty: options.pretty ?? false,
          compileDebug: false,
          doctype: options.doctype,
        },
        basedir: options.basedir,
      },
      data,
      silent: options.silent,
      debug: options.debug,
      config,
    })

    await watcher.start()

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await watcher.stop()
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      await watcher.stop()
      process.exit(0)
    })

    // Keep process running
    await new Promise(() => {})
  } else if (useSingleFileMode(options)) {
    processSingleFile(options)
  } else {
    await processMultipleFiles(options, config)
  }
}

// Run main only when executed as a CLI.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}
