# Configuration File Guide

## Overview

pug-tail supports configuration files for project-wide settings. Configuration files are automatically detected in the current directory or parent directories.

## Supported Config Files

pug-tail searches for configuration files in the following order:

1. `pug-tail.config.js`
2. `pug-tail.config.mjs`
3. `pug-tail.config.json`
4. `.pugtailrc.js`
5. `.pugtailrc.mjs`
6. `.pugtailrc.json`
7. `.pugtailrc`

## Path Resolution Rules

### With Config File (Vite-style)

When a configuration file exists, **all paths in the config file are resolved relative to the config file's location**.

```javascript
// examples/pug-tail.config.js
export default {
  files: {
    input: '**/*.pug',        // → examples/**/*.pug
    output: '../compiled',    // → compiled/ (parent directory)
  },
  basedir: '.',              // → examples/
  data: './data/shared.json' // → examples/data/shared.json
}
```

### Without Config File (Webpack/ESLint-style)

When no configuration file exists, paths are resolved relative to `process.cwd()`:

- **Via npm scripts**: Relative to `package.json` location
- **Direct execution**: Relative to shell's current directory

```bash
# Via npm run (always uses package.json location)
npm run pug-tail -- -o dist src/**/*.pug

# Direct execution (uses current directory)
cd /path/to/project
pug-tail -o dist src/**/*.pug
```

## Configuration Options

### `files`

File-related settings.

#### `files.input`

- **Type**: `string | string[]`
- **Default**: (none, required via CLI or config)
- **Description**: Input files, directories, or glob patterns

```javascript
// Single pattern
input: 'src/**/*.pug'

// Multiple patterns
input: ['src/pages/**/*.pug', 'src/templates/**/*.pug']

// Directory
input: 'src/pages'
```

#### `files.output`

- **Type**: `string`
- **Default**: (none, required)
- **Description**: Output directory (for multiple files) or file path (for single file)

```javascript
// Output directory
output: 'dist'

// Single file output
output: 'dist/index.html'
```

#### `files.root`

- **Type**: `string`
- **Default**: Auto-detected from input pattern
- **Description**: Root path for maintaining directory structure in output

```javascript
// Without root: examples/pages/index.pug → compiled/pages/index.html
// With root:    examples/pages/index.pug → compiled/index.html
root: 'examples/pages'
```

#### `files.render`

- **Type**: `string[]`
- **Default**: `['**/*.pug', '!**/_*.pug', '!**/*.component.pug', '!**/components/**/*.pug']`
- **Description**: Patterns determining which .pug files to compile. Supports negation with `!`

```javascript
render: [
  '**/*.pug',                    // All .pug files
  '!**/_*.pug',                  // Exclude files starting with _ (Pug standard)
  '!**/*.component.pug',         // Exclude component files by naming convention
  '!**/components/**/*.pug',     // Exclude components directory
]
```

### `extension`

- **Type**: `string`
- **Default**: `'.html'`
- **Description**: Output file extension

```javascript
extension: '.html'
```

### `basedir`

- **Type**: `string`
- **Default**: `undefined`
- **Description**: Base directory for absolute includes (paths starting with `/`)

```javascript
// In Pug: include /layouts/base.pug
// Resolves to: <basedir>/layouts/base.pug
basedir: 'src'
```

### `doctype`

- **Type**: `string`
- **Default**: `undefined` (uses Pug's default)
- **Description**: Doctype to use in generated HTML

```javascript
doctype: 'html'  // <!DOCTYPE html>
```

### `pretty`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Pretty-print HTML output with indentation

```javascript
pretty: true
```

### `format`

- **Type**: `'html' | 'ast' | 'pug-code'`
- **Default**: `'html'`
- **Description**: Output format

```javascript
format: 'html'      // Standard HTML output
format: 'ast'       // Output transformed AST as JSON
format: 'pug-code'  // Output transformed Pug code
```

### `data`

- **Type**: `string | Record<string, unknown>`
- **Default**: `undefined`
- **Description**: Global data to inject into all templates

```javascript
// JSON string
data: '{"title": "My Site"}'

// File path (relative to config file)
data: './data/shared.json'

// Object
data: { title: 'My Site', author: 'John Doe' }
```

### `watch`

- **Type**: `object`
- **Default**: `{ enabled: false, debounce: 300 }`
- **Description**: Watch mode settings

#### `watch.enabled`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Enable watch mode

```javascript
watch: {
  enabled: true
}
```

#### `watch.debounce`

- **Type**: `number`
- **Default**: `300`
- **Description**: Debounce delay in milliseconds

```javascript
watch: {
  enabled: true,
  debounce: 500  // Wait 500ms after last change
}
```

### `silent`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Suppress all log output (except errors)

```javascript
silent: true
```

### `debug`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Enable debug output for troubleshooting

```javascript
debug: true
```

## Complete Example

```javascript
// pug-tail.config.js
export default {
  files: {
    input: ['src/pages/**/*.pug', 'src/templates/**/*.pug'],
    output: 'dist',
    root: 'src/pages',
    render: [
      '**/*.pug',
      '!**/_*.pug',
      '!**/*.component.pug',
      '!**/components/**/*.pug',
    ],
  },
  extension: '.html',
  basedir: 'src',
  doctype: 'html',
  pretty: true,
  format: 'html',
  data: './data/shared.json',
  watch: {
    enabled: false,
    debounce: 300,
  },
  silent: false,
  debug: false,
}
```

## Using ES Modules vs CommonJS

### ES Module (Recommended)

```javascript
// pug-tail.config.js or .mjs
export default {
  files: {
    input: 'src/**/*.pug',
    output: 'dist',
  },
  pretty: true,
}
```

### CommonJS

```javascript
// pug-tail.config.js
module.exports = {
  files: {
    input: 'src/**/*.pug',
    output: 'dist',
  },
  pretty: true,
}
```

### JSON

```json
{
  "files": {
    "input": "src/**/*.pug",
    "output": "dist"
  },
  "pretty": true
}
```

## CLI Override

CLI options always take precedence over configuration file settings:

```bash
# Config file has pretty: false
# This command will use pretty: true
pug-tail -c config.js --pretty
```

## Configuration File Location

You can specify a custom configuration file path:

```bash
pug-tail -c path/to/custom-config.js
```

Without the `-c` option, pug-tail will automatically search for configuration files starting from the current directory and moving up to parent directories until it finds one or reaches the project root (detected by `package.json` or `.git`).
