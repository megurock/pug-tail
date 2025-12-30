/**
 * Configuration file loader
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { PugTailConfig } from './types.js'

/**
 * Config file names to search for (in order of priority)
 */
const CONFIG_FILE_NAMES = [
  'pugtail.config.js',
  'pugtail.config.mjs',
  'pugtail.config.json',
  '.pugtailrc.js',
  '.pugtailrc.mjs',
  '.pugtailrc.json',
  '.pugtailrc',
]

/**
 * Find config file in current directory or parent directories
 *
 * @param startDir - Directory to start searching from
 * @returns Config file path or null if not found
 */
export function findConfigFile(
  startDir: string = process.cwd(),
): string | null {
  let currentDir = resolve(startDir)
  const root = dirname(currentDir)

  while (currentDir !== root) {
    // Check for config files
    for (const filename of CONFIG_FILE_NAMES) {
      const configPath = join(currentDir, filename)
      if (existsSync(configPath)) {
        return configPath
      }
    }

    // Check for project root markers
    if (
      existsSync(join(currentDir, 'package.json')) ||
      existsSync(join(currentDir, '.git'))
    ) {
      break
    }

    currentDir = dirname(currentDir)
  }

  return null
}

/**
 * Load configuration from file
 *
 * @param configPath - Path to config file
 * @returns Loaded configuration
 */
export async function loadConfigFile(
  configPath: string,
): Promise<PugTailConfig> {
  const ext = configPath.split('.').pop()

  try {
    if (ext === 'json' || configPath.endsWith('.pugtailrc')) {
      // JSON config
      const content = readFileSync(configPath, 'utf-8')
      return JSON.parse(content) as PugTailConfig
    } else {
      // JavaScript/ES Module config
      const fileUrl = pathToFileURL(configPath).href
      const module = await import(fileUrl)
      return (module.default || module) as PugTailConfig
    }
  } catch (error) {
    throw new Error(
      `Failed to load config file "${configPath}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }
}

/**
 * Load configuration from file or return default
 *
 * @param configPath - Optional explicit config file path
 * @returns Tuple of [loaded configuration, config directory]
 */
export async function loadConfig(
  configPath?: string,
): Promise<{ config: PugTailConfig; configDir: string | null }> {
  // Explicit config path provided
  if (configPath) {
    if (!existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`)
    }
    const config = await loadConfigFile(configPath)
    return { config, configDir: dirname(resolve(configPath)) }
  }

  // Search for config file
  const foundConfig = findConfigFile()
  if (foundConfig) {
    const config = await loadConfigFile(foundConfig)
    return { config, configDir: dirname(resolve(foundConfig)) }
  }

  // No config file found
  return { config: {}, configDir: null }
}

/**
 * Merge CLI options with config file
 * Priority: CLI options > Config file > Defaults
 *
 * @param config - Config from file
 * @param cliOptions - Options from CLI
 * @returns Merged configuration
 */
export function mergeConfig(
  config: PugTailConfig,
  cliOptions: Partial<PugTailConfig>,
): PugTailConfig {
  return {
    ...config,
    ...cliOptions,
    // Merge nested objects
    files: {
      ...config.files,
      ...cliOptions.files,
      // Merge each property (CLI takes precedence)
      input: cliOptions.files?.input || config.files?.input,
      output: cliOptions.files?.output || config.files?.output,
      // If CLI explicitly sets render to undefined, use undefined (not config value)
      // Otherwise, use CLI value if set, or config value
      render:
        cliOptions.files?.render === undefined && cliOptions.files?.input
          ? undefined
          : cliOptions.files?.render || config.files?.render,
    },
    watch: {
      ...config.watch,
      ...cliOptions.watch,
    },
  }
}
