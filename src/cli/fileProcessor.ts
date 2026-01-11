/**
 * File processor for handling multiple files and directories.
 *
 * @module cli/fileProcessor
 */

import {
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { resolve } from 'node:path'
import { glob } from 'glob'
import type { TransformOptions } from '../transform.js'
import { transform } from '../transform.js'
import {
  getDefaultOutputPatterns,
  shouldIncludeFile,
} from './config/matcher.js'
import type { PugTailConfig } from './config/types.js'
import {
  getDirectory,
  isPugFile,
  type PathResolverOptions,
  resolveAbsolutePath,
  resolveOutputPath,
} from './pathResolver.js'

/**
 * Options for file processing.
 */
export interface FileProcessorOptions {
  /** Output directory */
  outputDir?: string
  /** Output file extension */
  extension?: string
  /** Transform options */
  transformOptions?: Omit<TransformOptions, 'filename'>
  /** Global data to inject into all files */
  data?: Record<string, unknown>
  /** Key name for injected data */
  dataKey?: string
  /** Silent mode (no log output) */
  silent?: boolean
  /** Debug mode (detailed log output) */
  debug?: boolean
  /** Configuration (for file includes patterns) */
  config?: PugTailConfig
}

/**
 * Result of file processing.
 */
export interface ProcessResult {
  /** Input file path */
  input: string
  /** Output file path */
  output: string
  /** Whether the file was successfully processed */
  success: boolean
  /** Whether the file was ignored (excluded by config) */
  ignored?: boolean
  /** Error message if failed */
  error?: string
}

/**
 * File processor for handling multiple files and directories.
 *
 * @example
 * ```typescript
 * const processor = new FileProcessor({
 *   outputDir: 'dist',
 *   extension: '.html',
 *   transformOptions: {
 *     output: 'html',
 *     htmlOptions: { pretty: true }
 *   }
 * })
 *
 * // Process single file
 * await processor.processFile('src/index.pug')
 *
 * // Process multiple files
 * await processor.processFiles(['src/index.pug', 'src/about.pug'])
 *
 * // Process with glob pattern
 * await processor.processPattern('src/**\/*.pug')
 *
 * // Process directory
 * await processor.processDirectory('src')
 * ```
 */
export class FileProcessor {
  private options: FileProcessorOptions
  private rootPath?: string

  constructor(options: FileProcessorOptions = {}) {
    this.options = options
    if (options.config?.files?.root) {
      this.rootPath = resolveAbsolutePath(options.config.files.root)
    }
  }

  /**
   * Processes a single file.
   *
   * @param inputPath - Path to the input file (can be relative)
   * @param rootPath - Optional root path for maintaining directory structure
   * @returns Process result
   */
  async processFile(
    inputPath: string,
    rootPath?: string,
  ): Promise<ProcessResult> {
    const absoluteInput = resolveAbsolutePath(inputPath)

    try {
      // Check if file should be processed based on config patterns
      // Note: files.root is for output path structure, not for filtering
      // Use process.cwd() as basePath for pattern matching
      const basePath = process.cwd()
      const patterns =
        this.options.config?.files?.render || getDefaultOutputPatterns()

      if (this.options.debug) {
        this.log(
          `Checking file: ${inputPath}\n  Absolute: ${absoluteInput}\n  BasePath: ${basePath}\n  Patterns: ${JSON.stringify(patterns)}`,
        )
      }

      if (!shouldIncludeFile(absoluteInput, patterns, basePath)) {
        if (this.options.debug) {
          this.log(`Ignored: ${inputPath}`)
        }
        return {
          input: inputPath,
          output: '',
          success: true, // Not an error, just ignored
          ignored: true,
        }
      }

      // Check if file is a Pug file
      if (!isPugFile(absoluteInput)) {
        return {
          input: inputPath,
          output: '',
          success: false,
          error: 'Not a Pug file',
        }
      }

      // Read input file
      const source = readFileSync(absoluteInput, 'utf-8')

      if (this.options.debug) {
        this.log(
          `Read source (${source.length} chars):\n${source.substring(0, 200)}...`,
        )
      }

      // Resolve base path for $dataFiles (relative to input file)
      const inputDir = getDirectory(absoluteInput)
      const dataFilesBasePath = inputDir

      // Resolve output path
      // Priority: parameter rootPath > instance rootPath
      // Note: config files.root is only for config file's input, not CLI arguments
      const effectiveRootPath = rootPath || this.rootPath

      const pathOptions: PathResolverOptions = {
        outputDir: this.options.outputDir,
        extension: this.options.extension,
        rootPath: effectiveRootPath,
      }
      const outputPath = resolveOutputPath(absoluteInput, pathOptions)

      // Transform (with basePath for $dataFiles resolution)
      const result = transform(source, {
        filename: absoluteInput,
        ...this.options.transformOptions,
        basePath: dataFilesBasePath,
        data: this.options.data,
        dataKey: this.options.dataKey,
      })

      // Get output content
      let output: string
      if (this.options.transformOptions?.output === 'ast') {
        if (!result.ast) {
          throw new Error('AST output is not available')
        }
        output = JSON.stringify(result.ast, null, 2)
      } else if (this.options.transformOptions?.output === 'pug-code') {
        if (!result.code) {
          throw new Error('Pug code output is not available')
        }
        output = result.code
      } else {
        if (!result.html) {
          throw new Error('HTML output is not available')
        }
        output = result.html
      }

      // Create output directory
      const outputDir = getDirectory(outputPath)
      mkdirSync(outputDir, { recursive: true })

      // Write output file
      writeFileSync(outputPath, output, 'utf-8')

      // Log success
      if (!this.options.silent) {
        this.log(`  rendered ${outputPath}`)
      }

      return {
        input: inputPath,
        output: outputPath,
        success: true,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)

      if (!this.options.silent) {
        console.error(`Error processing ${inputPath}:`, errorMessage)
      }

      return {
        input: inputPath,
        output: '',
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Processes multiple files.
   *
   * @param inputPaths - Array of input file paths
   * @param rootPath - Optional root path for maintaining directory structure
   * @returns Array of process results
   */
  async processFiles(
    inputPaths: string[],
    rootPath?: string,
  ): Promise<ProcessResult[]> {
    const results: ProcessResult[] = []

    for (const inputPath of inputPaths) {
      const result = await this.processFile(inputPath, rootPath)
      results.push(result)
    }

    return results
  }

  /**
   * Processes files matching a glob pattern.
   *
   * @param pattern - Glob pattern (e.g., 'src/**\/*.pug')
   * @param rootPath - Optional root path for maintaining directory structure
   * @returns Array of process results
   *
   * @example
   * ```typescript
   * // Process all .pug files in src directory
   * await processor.processPattern('src/**\/*.pug')
   *
   * // Process specific files
   * await processor.processPattern('src/{index,about}.pug')
   * ```
   */
  async processPattern(
    pattern: string,
    rootPath?: string,
  ): Promise<ProcessResult[]> {
    // Find files matching the pattern
    const files = await glob(pattern, {
      ignore: ['node_modules/**', '.git/**'],
      nodir: true,
      absolute: true,
      posix: true, // Use forward slashes for cross-platform compatibility
    })

    if (files.length === 0) {
      if (!this.options.silent) {
        console.warn(`No files found matching pattern: ${pattern}`)
      }
      return []
    }

    if (this.options.debug) {
      this.log(`Found ${files.length} files matching pattern: ${pattern}`)
    }

    // Process all files
    return this.processFiles(files, rootPath)
  }

  /**
   * Processes a directory recursively.
   *
   * @param dirPath - Path to the directory
   * @param rootPath - Root path for maintaining directory structure (optional)
   * @returns Array of process results
   *
   * @example
   * ```typescript
   * // Process all .pug files in src directory recursively
   * await processor.processDirectory('src')
   * ```
   */
  async processDirectory(
    dirPath: string,
    rootPath?: string,
  ): Promise<ProcessResult[]> {
    const absoluteDir = resolveAbsolutePath(dirPath)
    const results: ProcessResult[] = []

    // Priority: parameter rootPath > directory itself
    // Note: config files.root is only for config file's input, not CLI arguments
    const effectiveRootPath = rootPath || absoluteDir

    try {
      const stat = lstatSync(absoluteDir)

      if (!stat.isDirectory()) {
        // If it's a file, process it
        return [await this.processFile(absoluteDir, effectiveRootPath)]
      }

      // Read directory contents
      const entries = readdirSync(absoluteDir)

      for (const entry of entries) {
        const entryPath = resolve(absoluteDir, entry)
        const entryStat = lstatSync(entryPath)

        if (entryStat.isDirectory()) {
          // Recursively process subdirectory (use same rootPath)
          const subResults = await this.processDirectory(
            entryPath,
            effectiveRootPath,
          )
          results.push(...subResults)
        } else if (entryStat.isFile()) {
          // Process file (use same rootPath)
          const result = await this.processFile(entryPath, effectiveRootPath)
          results.push(result)
        }
      }

      return results
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)

      if (!this.options.silent) {
        console.error(`Error processing directory ${dirPath}:`, errorMessage)
      }

      return []
    }
  }

  /**
   * Processes input paths (files, directories, or glob patterns).
   *
   * This is the main entry point for processing multiple inputs.
   *
   * @param inputs - Array of input paths (files, directories, or glob patterns)
   * @returns Array of process results
   *
   * @example
   * ```typescript
   * // Mix of files, directories, and patterns
   * await processor.processInputs([
   *   'src/index.pug',
   *   'src/pages/',
   *   'src/blog/**\/*.pug'
   * ])
   * ```
   */
  async processInputs(inputs: string[]): Promise<ProcessResult[]> {
    const results: ProcessResult[] = []

    // Note: config files.root is only for config file's input, not CLI arguments
    // When processing CLI arguments, we don't use config files.root

    for (const input of inputs) {
      const absolutePath = resolveAbsolutePath(input)

      try {
        // Check if it's a glob pattern
        if (input.includes('*') || input.includes('?') || input.includes('[')) {
          // Extract root path from glob pattern for maintaining directory structure
          // For 'examples/**/*.pug', rootPath should be 'examples'
          // For 'src/pages/**/*.pug', rootPath should be 'src/pages'
          let rootPath: string | undefined = this.rootPath // Use instance rootPath if available
          if (!rootPath) {
            // Only infer from glob if not already set
            const globMatch = input.match(/^(.+?)(?:\*\*|\*)/)
            if (globMatch?.[1]) {
              // Remove trailing slashes
              const extractedRoot = globMatch[1].replace(/[/\\]+$/, '')
              if (extractedRoot) {
                rootPath = resolveAbsolutePath(extractedRoot)
              }
            }
          }
          const patternResults = await this.processPattern(input, rootPath)
          results.push(...patternResults)
          continue
        }

        // Check if it's a file or directory
        const stat = lstatSync(absolutePath)

        if (stat.isFile()) {
          // Use file's directory as root
          const rootPath = getDirectory(absolutePath)
          const result = await this.processFile(absolutePath, rootPath)
          results.push(result)
        } else if (stat.isDirectory()) {
          // Use the directory itself as root
          const rootPath = absolutePath
          const dirResults = await this.processDirectory(absolutePath, rootPath)
          results.push(...dirResults)
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)

        if (!this.options.silent) {
          console.error(`Error processing ${input}:`, errorMessage)
        }

        results.push({
          input,
          output: '',
          success: false,
          error: errorMessage,
        })
      }
    }

    return results
  }

  /**
   * Sets the root path for maintaining directory structure.
   *
   * @param rootPath - The root path
   */
  setRootPath(rootPath: string): void {
    this.rootPath = resolveAbsolutePath(rootPath)
  }

  /**
   * Logs a message (respects silent mode).
   *
   * @param message - The message to log
   */
  private log(message: string): void {
    if (!this.options.silent) {
      console.log(message)
    }
  }
}
