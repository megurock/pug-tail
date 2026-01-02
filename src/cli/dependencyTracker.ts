/**
 * Dependency tracking for Pug files.
 *
 * Tracks include/extends relationships to enable smart recompilation.
 *
 * @module cli/dependencyTracker
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { resolveAbsolutePath } from './pathResolver.js'

/**
 * Dependency information for a file.
 */
export interface FileDependencies {
  /** Files that this file depends on (includes/extends) */
  dependencies: Set<string>
  /** Files that depend on this file */
  dependents: Set<string>
}

/**
 * Tracks dependencies between Pug files.
 */
export class DependencyTracker {
  /** Map of file path to its dependencies */
  private dependencyMap: Map<string, FileDependencies> = new Map()

  /** Base directory for resolving absolute paths */
  private basedir?: string

  constructor(basedir?: string) {
    this.basedir = basedir
  }

  /**
   * Analyzes a file and updates the dependency graph.
   *
   * @param filePath - Absolute path to the file to analyze
   * @returns Set of files that this file depends on
   */
  analyzeDependencies(filePath: string): Set<string> {
    const absolutePath = resolveAbsolutePath(filePath)
    const dependencies = new Set<string>()

    try {
      const content = readFileSync(absolutePath, 'utf-8')
      const fileDir = dirname(absolutePath)

      // Extract include/extends statements
      // Patterns: include path, extends path, include:markdown path
      const includeRegex = /^\s*(?:include|extends)(?::[\w-]+)?\s+(.+?)$/gm
      const matches = content.matchAll(includeRegex)

      for (const match of matches) {
        const rawPath = match[1]?.trim()
        if (!rawPath) continue

        try {
          // Resolve the dependency path
          const depPath = this.resolveDependencyPath(rawPath, fileDir)
          if (depPath) {
            dependencies.add(depPath)
          }
        } catch (_error) {
          // Ignore resolution errors (file might not exist yet)
          if (this.isDebug()) {
            console.log(
              `[dependency] Could not resolve: ${rawPath} from ${filePath}`,
            )
          }
        }
      }

      // Update dependency graph
      this.updateDependencyGraph(absolutePath, dependencies)
    } catch (_error) {
      // If file doesn't exist or can't be read, clear its dependencies
      this.clearFileDependencies(absolutePath)
    }

    return dependencies
  }

  /**
   * Gets all files that depend on the given file (directly or indirectly).
   *
   * @param filePath - Absolute path to the file
   * @returns Set of files that depend on this file
   */
  getDependents(filePath: string): Set<string> {
    const absolutePath = resolveAbsolutePath(filePath)
    const allDependents = new Set<string>()
    const visited = new Set<string>()

    const collectDependents = (path: string): void => {
      if (visited.has(path)) return
      visited.add(path)

      const deps = this.dependencyMap.get(path)
      if (!deps) return

      for (const dependent of deps.dependents) {
        allDependents.add(dependent)
        collectDependents(dependent)
      }
    }

    collectDependents(absolutePath)
    return allDependents
  }

  /**
   * Removes a file from the dependency graph.
   *
   * @param filePath - Absolute path to the file to remove
   */
  removeFile(filePath: string): void {
    const absolutePath = resolveAbsolutePath(filePath)
    this.clearFileDependencies(absolutePath)
    this.dependencyMap.delete(absolutePath)
  }

  /**
   * Checks if there is a circular dependency.
   *
   * @param filePath - Absolute path to the file to check
   * @returns True if a circular dependency is detected
   */
  hasCircularDependency(filePath: string): boolean {
    const absolutePath = resolveAbsolutePath(filePath)
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const detectCycle = (path: string): boolean => {
      if (recursionStack.has(path)) return true
      if (visited.has(path)) return false

      visited.add(path)
      recursionStack.add(path)

      const deps = this.dependencyMap.get(path)
      if (deps) {
        for (const dep of deps.dependencies) {
          if (detectCycle(dep)) return true
        }
      }

      recursionStack.delete(path)
      return false
    }

    return detectCycle(absolutePath)
  }

  /**
   * Resolves a dependency path (relative or absolute).
   *
   * @param rawPath - Raw path from include/extends statement
   * @param fileDir - Directory of the file containing the include/extends
   * @returns Absolute path to the dependency, or undefined if cannot resolve
   */
  private resolveDependencyPath(
    rawPath: string,
    fileDir: string,
  ): string | undefined {
    // Remove quotes if present
    const cleanPath = rawPath.replace(/['"]/g, '')

    // Absolute path (requires basedir)
    if (cleanPath.startsWith('/')) {
      if (!this.basedir) {
        return undefined
      }
      const resolved = resolve(this.basedir, cleanPath.slice(1))
      return this.addPugExtension(resolved)
    }

    // Relative path
    const resolved = resolve(fileDir, cleanPath)
    return this.addPugExtension(resolved)
  }

  /**
   * Adds .pug extension if not present.
   */
  private addPugExtension(path: string): string {
    if (path.endsWith('.pug')) {
      return path
    }
    return `${path}.pug`
  }

  /**
   * Updates the dependency graph for a file.
   */
  private updateDependencyGraph(
    filePath: string,
    newDependencies: Set<string>,
  ): void {
    // Get or create dependency info for this file
    let fileInfo = this.dependencyMap.get(filePath)
    if (!fileInfo) {
      fileInfo = {
        dependencies: new Set(),
        dependents: new Set(),
      }
      this.dependencyMap.set(filePath, fileInfo)
    }

    // Remove old dependencies
    for (const oldDep of fileInfo.dependencies) {
      const depInfo = this.dependencyMap.get(oldDep)
      if (depInfo) {
        depInfo.dependents.delete(filePath)
      }
    }

    // Add new dependencies
    fileInfo.dependencies = newDependencies
    for (const dep of newDependencies) {
      let depInfo = this.dependencyMap.get(dep)
      if (!depInfo) {
        depInfo = {
          dependencies: new Set(),
          dependents: new Set(),
        }
        this.dependencyMap.set(dep, depInfo)
      }
      depInfo.dependents.add(filePath)
    }
  }

  /**
   * Clears dependencies for a file.
   */
  private clearFileDependencies(filePath: string): void {
    const fileInfo = this.dependencyMap.get(filePath)
    if (!fileInfo) return

    // Remove this file from all its dependencies' dependents
    for (const dep of fileInfo.dependencies) {
      const depInfo = this.dependencyMap.get(dep)
      if (depInfo) {
        depInfo.dependents.delete(filePath)
      }
    }

    fileInfo.dependencies.clear()
  }

  /**
   * Debug mode check (can be enhanced later).
   */
  private isDebug(): boolean {
    return false // TODO: Make configurable
  }
}
