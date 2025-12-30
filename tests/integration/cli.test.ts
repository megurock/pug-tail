/**
 * Integration tests for CLI functionality.
 *
 * These tests verify the CLI works correctly with real fixtures.
 */

import { execSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const CLI_PATH = join(process.cwd(), 'dist/cli.js')
const TEST_OUTPUT_DIR = join(process.cwd(), 'tmp/integration-test')

/**
 * Executes the CLI with the given arguments.
 */
function runCLI(args: string[]): {
  stdout: string
  stderr: string
  exitCode: number
} {
  try {
    const stdout = execSync(`node ${CLI_PATH} ${args.join(' ')}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { stdout, stderr: '', exitCode: 0 }
  } catch (error) {
    const execError = error as {
      stdout?: string
      stderr?: string
      status?: number
    }
    return {
      stdout: execError.stdout || '',
      stderr: execError.stderr || '',
      exitCode: execError.status || 1,
    }
  }
}

describe('CLI Integration Tests', () => {
  beforeEach(() => {
    // Clean up test output directory before each test
    if (existsSync(TEST_OUTPUT_DIR)) {
      rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true })
    }
    // Create fresh test output directory
    mkdirSync(TEST_OUTPUT_DIR, { recursive: true })
  })

  afterEach(() => {
    // Clean up test output directory
    if (existsSync(TEST_OUTPUT_DIR)) {
      rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true })
    }
  })

  describe('Single file processing', () => {
    it('should compile a single file', () => {
      const result = runCLI([
        'tests/fixtures/cli/index.pug',
        '-o',
        join(TEST_OUTPUT_DIR, 'index.html'),
      ])

      expect(result.exitCode).toBe(0)
      expect(existsSync(join(TEST_OUTPUT_DIR, 'index.html'))).toBe(true)

      const output = readFileSync(join(TEST_OUTPUT_DIR, 'index.html'), 'utf-8')
      expect(output).toContain('<!DOCTYPE html>')
      expect(output).toContain('Home Page')
      expect(output).toContain('Welcome to the home page')
    })

    it('should compile with pretty output', () => {
      const result = runCLI([
        'tests/fixtures/cli/index.pug',
        '-o',
        join(TEST_OUTPUT_DIR, 'index.html'),
        '-P',
      ])

      expect(result.exitCode).toBe(0)

      const output = readFileSync(join(TEST_OUTPUT_DIR, 'index.html'), 'utf-8')
      // Pretty output should have newlines and indentation
      expect(output).toMatch(/\n\s+</)
    })
  })

  describe('Multiple file processing', () => {
    it('should compile directory', () => {
      const result = runCLI(['tests/fixtures/cli/', '-o', TEST_OUTPUT_DIR])

      if (result.exitCode !== 0) {
        console.error('\n=== CLI FAILED ===')
        console.error('Exit code:', result.exitCode)
        console.error('\nSTDOUT:')
        console.error(result.stdout)
        console.error('\nSTDERR:')
        console.error(result.stderr)
        console.error('==================\n')
      }

      expect(result.exitCode).toBe(0)

      // Check that files were created (excluding _ prefixed files)
      expect(existsSync(join(TEST_OUTPUT_DIR, 'index.html'))).toBe(true)
      expect(existsSync(join(TEST_OUTPUT_DIR, 'about.html'))).toBe(true)
      expect(existsSync(join(TEST_OUTPUT_DIR, 'user_profile.html'))).toBe(true)

      // Check that _ prefixed files were ignored
      expect(existsSync(join(TEST_OUTPUT_DIR, '_layout.html'))).toBe(false)
    })

    it('should ignore _ prefixed files', () => {
      const result = runCLI(['tests/fixtures/cli/', '-o', TEST_OUTPUT_DIR])

      if (result.exitCode !== 0) {
        console.error('\n=== CLI FAILED (ignore _ files test) ===')
        console.error('Exit code:', result.exitCode)
        console.error('\nSTDOUT:', result.stdout)
        console.error('\nSTDERR:', result.stderr)
        console.error('==================\n')
      }

      expect(result.exitCode).toBe(0)

      // _layout.pug should be ignored
      expect(existsSync(join(TEST_OUTPUT_DIR, '_layout.html'))).toBe(false)

      // But user_profile.pug (snake_case) should be processed
      expect(existsSync(join(TEST_OUTPUT_DIR, 'user_profile.html'))).toBe(true)
    })
  })

  describe('Data injection', () => {
    it('should inject data from JSON (via temp file)', () => {
      // Use a temporary JSON file instead of shell string to avoid escaping issues
      const tempDataPath = join(TEST_OUTPUT_DIR, 'temp-data.json')
      const tempData = {
        title: 'Test Title',
        siteName: 'Test Site',
        year: 2025,
        description: 'Test',
        navigation: [],
      }
      writeFileSync(tempDataPath, JSON.stringify(tempData), 'utf-8')

      const result = runCLI([
        'tests/fixtures/cli-data-test/with-data.pug',
        '-o',
        join(TEST_OUTPUT_DIR, 'with-data.html'),
        '-O',
        tempDataPath,
      ])

      if (result.exitCode !== 0) {
        console.error('\n=== CLI FAILED (JSON data test) ===')
        console.error('Exit code:', result.exitCode)
        console.error('\nSTDOUT:', result.stdout)
        console.error('\nSTDERR:', result.stderr)
        console.error('==================\n')
      }

      expect(result.exitCode).toBe(0)

      const output = readFileSync(
        join(TEST_OUTPUT_DIR, 'with-data.html'),
        'utf-8',
      )
      expect(output).toContain('<title>Test Title</title>')
      expect(output).toContain('Welcome to Test Site')
      expect(output).toContain('© 2025 Test Site')
    })

    it('should inject data from JSON file', () => {
      const result = runCLI([
        'tests/fixtures/cli-data-test/with-data.pug',
        '-o',
        join(TEST_OUTPUT_DIR, 'with-data.html'),
        '-O',
        'tests/fixtures/cli-data/data.json',
      ])

      expect(result.exitCode).toBe(0)

      const output = readFileSync(
        join(TEST_OUTPUT_DIR, 'with-data.html'),
        'utf-8',
      )
      expect(output).toContain('<title>Test Page</title>')
      expect(output).toContain('Welcome to Test Site')
      expect(output).toContain('<a href="/">Home</a>')
      expect(output).toContain('<a href="/about">About</a>')
      expect(output).toContain('© 2025 Test Site')
    })

    it('should inject data into multiple files', () => {
      // Use a temporary JSON file instead of shell string to avoid escaping issues
      const tempDataPath = join(TEST_OUTPUT_DIR, 'temp-multi-data.json')
      const tempData = { customData: 'Injected' }
      writeFileSync(tempDataPath, JSON.stringify(tempData), 'utf-8')

      const result = runCLI([
        'tests/fixtures/cli/',
        '-o',
        TEST_OUTPUT_DIR,
        '-O',
        tempDataPath,
      ])

      if (result.exitCode !== 0) {
        console.error('\n=== CLI FAILED (inject data into multiple files) ===')
        console.error('Exit code:', result.exitCode)
        console.error('\nSTDOUT:', result.stdout)
        console.error('\nSTDERR:', result.stderr)
        console.error('==================\n')
      }

      expect(result.exitCode).toBe(0)
      // Just verify it doesn't crash with data injection
    })
  })

  describe('Inline data support', () => {
    it('should use inline Pug constants as data', () => {
      const result = runCLI([
        'tests/fixtures/cli-data-test/with-inline-data.pug',
        '-o',
        join(TEST_OUTPUT_DIR, 'with-inline-data.html'),
      ])

      expect(result.exitCode).toBe(0)

      const output = readFileSync(
        join(TEST_OUTPUT_DIR, 'with-inline-data.html'),
        'utf-8',
      )
      expect(output).toContain('<title>Frontmatter Test</title>')
      expect(output).toContain('Testing frontmatter parsing')
      expect(output).toContain('Test Author')
      expect(output).toContain('Year: 2025')
      expect(output).toContain('<li>test</li>')
      expect(output).toContain('<li>frontmatter</li>')
    })

    it('should merge inline data with CLI data', () => {
      // Create temp data
      const tempDataPath = join(TEST_OUTPUT_DIR, 'temp-conflict-data.json')
      const tempData = {
        siteName: 'Test Site',
        year: 2024,
      }
      writeFileSync(tempDataPath, JSON.stringify(tempData), 'utf-8')

      const result = runCLI([
        'tests/fixtures/cli-data-test/with-inline-data-override.pug',
        '-o',
        join(TEST_OUTPUT_DIR, 'with-override.html'),
        '-O',
        tempDataPath,
      ])

      expect(result.exitCode).toBe(0)

      const output = readFileSync(
        join(TEST_OUTPUT_DIR, 'with-override.html'),
        'utf-8',
      )
      // Pug inline constants
      expect(output).toContain('<title>Override Title</title>')
      expect(output).toContain('From frontmatter')
      // CLI data
      expect(output).toContain('Site: Test Site')
      expect(output).toContain('Year: 2024')
    })

    it('should load data from $dataFiles directive', () => {
      const result = runCLI([
        'tests/fixtures/cli-data-test/with-datafiles.pug',
        '-o',
        join(TEST_OUTPUT_DIR, 'with-datafiles.html'),
      ])

      expect(result.exitCode).toBe(0)

      const output = readFileSync(
        join(TEST_OUTPUT_DIR, 'with-datafiles.html'),
        'utf-8',
      )
      // From common.json
      expect(output).toContain('Test Site')
      expect(output).toContain('Common site data')
      expect(output).toContain('© 2025 Test Site')
      // From about.json
      expect(output).toContain('About Us Page')
      expect(output).toContain('page-specific data file')
    })

    it('should merge CLI data and $dataFiles correctly', () => {
      const tempDataPath = join(TEST_OUTPUT_DIR, 'temp-cli-data.json')
      const tempData = {
        cliValue: 'From CLI',
        overrideMe: 'CLI value',
      }
      writeFileSync(tempDataPath, JSON.stringify(tempData), 'utf-8')

      const result = runCLI([
        'tests/fixtures/cli-data-test/with-datafiles.pug',
        '-o',
        join(TEST_OUTPUT_DIR, 'with-merge.html'),
        '-O',
        tempDataPath,
      ])

      expect(result.exitCode).toBe(0)

      const output = readFileSync(
        join(TEST_OUTPUT_DIR, 'with-merge.html'),
        'utf-8',
      )
      // CLI and $dataFiles data should be available
      expect(output).toContain('Test Site') // $dataFiles
    })

    it('should load absolute path $dataFiles with basedir', () => {
      const result = runCLI([
        'tests/fixtures/cli-data-test/with-absolute-datafiles.pug',
        '-o',
        join(TEST_OUTPUT_DIR, 'with-absolute-datafiles.html'),
        '-b',
        'tests/fixtures/cli-data-test',
      ])

      expect(result.exitCode).toBe(0)

      const output = readFileSync(
        join(TEST_OUTPUT_DIR, 'with-absolute-datafiles.html'),
        'utf-8',
      )
      // From common.json
      expect(output).toContain('Test Site')
      expect(output).toContain('Common site data')
      expect(output).toContain('© 2025 Test Site')
      // From about.json
      expect(output).toContain('About Us Page')
      expect(output).toContain('page-specific data file')
    })
  })

  describe('Basedir support', () => {
    it('should resolve absolute includes with basedir', () => {
      const result = runCLI([
        'tests/fixtures/cli-with-basedir/pages/index.pug',
        '-o',
        join(TEST_OUTPUT_DIR, 'with-basedir.html'),
        '-b',
        'tests/fixtures/cli-with-basedir/',
      ])

      expect(result.exitCode).toBe(0)

      const output = readFileSync(
        join(TEST_OUTPUT_DIR, 'with-basedir.html'),
        'utf-8',
      )
      expect(output).toContain('<!DOCTYPE html>')
      expect(output).toContain('Site Header')
      expect(output).toContain('Welcome')
      expect(output).toContain('This page uses basedir')
      expect(output).toContain('© 2025 Test Site')
    })

    it('should fail without basedir for absolute includes', () => {
      const result = runCLI([
        'tests/fixtures/cli-with-basedir/pages/index.pug',
        '-o',
        join(TEST_OUTPUT_DIR, 'without-basedir.html'),
      ])

      // Should fail because it can't resolve /layouts/_base.pug
      expect(result.exitCode).not.toBe(0)
    })
  })

  describe('Output formats', () => {
    it('should output AST format', () => {
      const result = runCLI([
        'tests/fixtures/cli/index.pug',
        '-o',
        join(TEST_OUTPUT_DIR, 'ast.json'),
        '-f',
        'ast',
      ])

      expect(result.exitCode).toBe(0)

      const output = readFileSync(join(TEST_OUTPUT_DIR, 'ast.json'), 'utf-8')
      const ast = JSON.parse(output)
      expect(ast).toHaveProperty('type', 'Block')
      expect(ast).toHaveProperty('nodes')
    })

    it('should output pug-code format', () => {
      const result = runCLI([
        'tests/fixtures/cli/index.pug',
        '-o',
        join(TEST_OUTPUT_DIR, 'code.js'),
        '-f',
        'pug-code',
      ])

      expect(result.exitCode).toBe(0)

      const output = readFileSync(join(TEST_OUTPUT_DIR, 'code.js'), 'utf-8')
      expect(output).toContain('function template(')
    })
  })

  describe('Error handling', () => {
    it('should report error for non-existent file', () => {
      const result = runCLI([
        'tests/fixtures/cli/non-existent.pug',
        '-o',
        TEST_OUTPUT_DIR,
      ])

      expect(result.exitCode).not.toBe(0)
      expect(result.stderr || result.stdout).toContain('ENOENT')
    })

    it('should report error for invalid JSON data', () => {
      const result = runCLI([
        'tests/fixtures/cli/index.pug',
        '-o',
        join(TEST_OUTPUT_DIR, 'output.html'),
        '-O',
        '{invalid json}',
      ])

      expect(result.exitCode).not.toBe(0)
    })
  })

  describe('Combined options', () => {
    it('should work with multiple options combined', () => {
      const result = runCLI([
        'tests/fixtures/cli-data-test/with-data.pug',
        '-o',
        join(TEST_OUTPUT_DIR, 'combined.html'),
        '-O',
        'tests/fixtures/cli-data/data.json',
        '-P',
      ])

      expect(result.exitCode).toBe(0)

      const output = readFileSync(
        join(TEST_OUTPUT_DIR, 'combined.html'),
        'utf-8',
      )
      // Has data
      expect(output).toContain('Test Site')
      // Is pretty
      expect(output).toMatch(/\n\s+</)
    })
  })
})
