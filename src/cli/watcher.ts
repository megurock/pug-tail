/**
 * Watch mode implementation for CLI.
 *
 * @module cli/watcher
 */

import chokidar, { type FSWatcher } from 'chokidar'
import { glob } from 'glob'
import { DependencyTracker } from './dependencyTracker.js'
import { FileProcessor, type FileProcessorOptions } from './fileProcessor.js'
import { isPugFile, resolveAbsolutePath } from './pathResolver.js'

/**
 * Options for watch mode.
 */
export interface WatchOptions extends FileProcessorOptions {
  /** Paths to watch (files, directories, or glob patterns) */
  paths: string[]
  /** Debounce delay in milliseconds */
  debounce?: number
}

/**
 * Watcher for monitoring file changes and recompiling.
 */
export class Watcher {
  private options: WatchOptions
  private processor: FileProcessor
  private watcher?: FSWatcher
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map()
  private dependencyTracker: DependencyTracker

  constructor(options: WatchOptions) {
    this.options = {
      debounce: 100,
      ...options,
    }

    this.processor = new FileProcessor({
      outputDir: options.outputDir,
      extension: options.extension,
      transformOptions: options.transformOptions,
      data: options.data,
      dataKey: options.dataKey,
      silent: options.silent,
      debug: options.debug,
      config: options.config,
    })

    this.dependencyTracker = new DependencyTracker(
      options.transformOptions?.basedir,
    )
  }

  /**
   * Starts watching for file changes.
   */
  async start(): Promise<void> {
    const { paths, debug } = this.options

    if (!this.options.silent) {
      console.log('🔍 Watching for changes...')
      if (debug) {
        console.log('Watch paths:', paths)
      }
    }

    // Initial compilation
    if (!this.options.silent) {
      console.log('\n📦 Initial compilation...')
    }
    await this.processor.processInputs(paths)

    // Build dependency graph by analyzing ALL pug files (including ignored ones)
    if (debug) {
      console.log('[watch] Building dependency graph...')
    }

    // Convert paths to glob patterns
    const globPatterns = paths.map((p) => {
      if (p.includes('*')) return p // Already a glob pattern
      if (p.endsWith('.pug')) return p // Single file
      return `${p.replace(/\/$/, '')}/**/*.pug` // Directory -> glob
    })

    const allFiles = await glob(globPatterns, {
      ignore: ['node_modules/**', '.git/**'],
      nodir: true,
      absolute: true,
      posix: true, // Use forward slashes for cross-platform compatibility
    })

    if (debug) {
      console.log(`[watch] Found ${allFiles.length} pug files`)
    }

    for (const file of allFiles) {
      const deps = this.dependencyTracker.analyzeDependencies(file)
      if (debug && deps.size > 0) {
        console.log(`[watch] ${file} -> ${deps.size} dependencies`)
      }
    }

    // Start watching
    this.watcher = chokidar.watch(paths, {
      ignored: [
        /(^|[/\\])\../, // Ignore dotfiles
        /node_modules/, // Ignore node_modules
        /\.git/, // Ignore .git
      ],
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    })

    this.watcher
      .on('add', (path: string) => this.handleFileAdded(path))
      .on('change', (path: string) => this.handleFileChanged(path))
      .on('unlink', (path: string) => this.handleFileDeleted(path))
      .on('error', (error: unknown) => this.handleError(error as Error))

    if (!this.options.silent) {
      console.log('✅ Ready. Watching for changes...')
      console.log('💡 Press Ctrl+C to stop\n')
    }
  }

  /**
   * Stops watching.
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close()
      this.watcher = undefined
    }

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer)
    }
    this.debounceTimers.clear()

    if (!this.options.silent) {
      console.log('\n👋 Stopped watching')
    }
  }

  /**
   * Handles file addition.
   */
  private handleFileAdded(path: string): void {
    if (!isPugFile(path)) return

    if (this.options.debug) {
      console.log(`[watch] File added: ${path}`)
    }

    this.debounceProcess(path, 'added')
  }

  /**
   * Handles file change.
   */
  private handleFileChanged(path: string): void {
    if (!isPugFile(path)) return

    if (this.options.debug) {
      console.log(`[watch] File changed: ${path}`)
    }

    // Always analyze dependencies (even for partial files)
    this.dependencyTracker.analyzeDependencies(path)

    // Recompile all files that depend on this file
    const dependents = this.dependencyTracker.getDependents(path)
    if (dependents.size > 0) {
      if (this.options.debug) {
        console.log(
          `[watch] ${dependents.size} dependent(s) will be recompiled`,
        )
      }
      for (const dependent of dependents) {
        this.debounceProcess(dependent, 'changed')
      }
    } else {
      // Only recompile the file itself if it has no dependents
      this.debounceProcess(path, 'changed')
    }
  }

  /**
   * Handles file deletion.
   */
  private handleFileDeleted(path: string): void {
    if (!isPugFile(path)) return

    if (!this.options.silent) {
      console.log(`🗑️  Deleted: ${path}`)
    }

    // Remove from dependency tracker
    this.dependencyTracker.removeFile(path)

    // Recompile files that depended on this file
    const dependents = this.dependencyTracker.getDependents(path)
    for (const dependent of dependents) {
      this.debounceProcess(dependent, 'changed')
    }
  }

  /**
   * Handles errors.
   */
  private handleError(error: Error): void {
    console.error('❌ Watch error:', error.message)
    if (this.options.debug && error.stack) {
      console.error(error.stack)
    }
  }

  /**
   * Debounces file processing to avoid multiple rapid compilations.
   */
  private debounceProcess(path: string, action: 'added' | 'changed'): void {
    const absolutePath = resolveAbsolutePath(path)

    // Clear existing timer
    const existingTimer = this.debounceTimers.get(absolutePath)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Set new timer
    const timer = setTimeout(async () => {
      this.debounceTimers.delete(absolutePath)
      await this.processFile(absolutePath, action)
    }, this.options.debounce)

    this.debounceTimers.set(absolutePath, timer)
  }

  /**
   * Processes a single file.
   */
  private async processFile(
    path: string,
    action: 'added' | 'changed',
  ): Promise<void> {
    const startTime = Date.now()

    try {
      // Analyze dependencies before processing
      const dependencies = this.dependencyTracker.analyzeDependencies(path)

      // Check for circular dependencies
      if (this.dependencyTracker.hasCircularDependency(path)) {
        console.warn(`⚠️  Circular dependency detected in: ${path}`)
      }

      if (this.options.debug && dependencies.size > 0) {
        console.log(`[watch] ${path} depends on ${dependencies.size} file(s)`)
      }

      const result = await this.processor.processFile(path)

      if (result.success) {
        const duration = Date.now() - startTime
        const emoji = action === 'added' ? '✨' : '🔄'
        if (!this.options.silent) {
          console.log(
            `${emoji} ${action === 'added' ? 'Added' : 'Updated'}: ${path} (${duration}ms)`,
          )
        }
      } else if (result.error) {
        console.error(`❌ Failed to process ${path}:`, result.error)
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      console.error(`❌ Error processing ${path}:`, errorMessage)
      if (this.options.debug && error instanceof Error && error.stack) {
        console.error(error.stack)
      }
    }
  }
}
