# Configuration File Guide

## Overview

pug-tail supports configuration files for project-wide settings. Configuration files are automatically detected in the current directory or parent directories.

## Supported Config Files

pug-tail searches for configuration files in the following order:

1. `pugtail.config.js` - JavaScript (ES Module or CommonJS)
2. `pugtail.config.mjs` - JavaScript ES Module
3. `pugtail.config.json` - JSON format
4. `.pugtailrc.js` - JavaScript (ES Module or CommonJS)
5. `.pugtailrc.mjs` - JavaScript ES Module
6. `.pugtailrc.json` - JSON format
7. `.pugtailrc` - JSON format (without extension)

### Search Behavior

pug-tail searches for configuration files starting from the **current directory** (`process.cwd()`) and moves **upward through parent directories** until:

- A configuration file is found (first match wins)
- A project root is detected (`package.json` or `.git` directory)
- The filesystem root is reached

**Example:**
```
/home/user/project/          ← package.json (stops here)
  src/
    pages/                   ← Current directory
      index.pug
  pugtail.config.js          ← Found!
```

If you run `pug-tail` from `/home/user/project/src/pages/`, it will find `/home/user/project/pugtail.config.js`.

## Path Resolution Rules

### With Config File (Vite-style)

When a configuration file exists, **all paths in the config file are resolved relative to the config file's location**.

```javascript
// examples/pugtail.config.js
export default {
  files: {
    input: '**/*.pug',        // → examples/**/*.pug
    output: '../compiled',    // → compiled/ (parent directory)
  },
  basedir: '.',              // → examples/
  data: './data/global.json' // → examples/data/global.json
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
data: './data/global.json'

// Object
data: { title: 'My Site', author: 'John Doe' }
```

### `dataKey`

- **Type**: `string`
- **Default**: `undefined` (data injected directly as top-level variables)
- **Description**: Key name for injected global data. When specified, all data from the `data` option is wrapped in this key.

**Without `dataKey` (default behavior):**

```javascript
// pugtail.config.js
export default {
  data: './data/global.json'
  // No dataKey specified
}
```

```json
// global.json
{
  "siteName": "My Site",
  "navigation": [...]
}
```

```pug
// Direct access to data
p= siteName
each item in navigation
  a(href=item.url)= item.label
```

**With `dataKey` (recommended for strict mode):**

```javascript
// pugtail.config.js
export default {
  data: './data/global.json',
  dataKey: 'global',  // Wrap data in 'global' key
  
  validation: {
    scopeIsolation: 'error',
    allowedGlobals: ['$props', '$slots', 'global']  // Allow 'global' in components
  }
}
```

```json
// global.json
{
  "siteName": "My Site",
  "navigation": [...]
}
```

```pug
// Access via global key
p= global.siteName
each item in global.navigation
  a(href=item.url)= item.label

// In components
component Header()
  header
    a(href=global.siteUrl)= global.siteName  // ✓ OK with allowedGlobals
    each item in global.navigation
      a(href=item.url)= item.label
```

**Benefits of using `dataKey`:**

1. **Namespace isolation**: Prevents variable name collisions
2. **Explicit data access**: Clear distinction between global data and local variables
3. **Component scope control**: Works well with `scopeIsolation: 'error'` mode
4. **Easier debugging**: Know exactly where data comes from (`global.siteName` vs `siteName`)

**Recommended setup:**

```javascript
export default {
  data: './data/global.json',
  dataKey: 'global',  // Recommended: use a namespace
  
  validation: {
    scopeIsolation: 'error',  // Strict mode
    allowedGlobals: ['$props', '$slots', 'global']  // Allow global data access
  }
}
```

### Per-Page Data Files (`$dataFiles`)

In addition to global data (via the `data` option or `--obj` CLI flag), you can load page-specific data files using the `$dataFiles` directive in your **entry Pug files** (files that are directly compiled, not included/extended files).

#### Usage

```pug
// pages/index.pug (entry file)
- const $dataFiles = ['/data/navigation.json', '/data/footer.json']

// Data from these files is now available
header
  each item in navigation
    a(href=item.url)= item.label

footer
  p= footer.copyright
```

#### Path Resolution

- **Absolute paths** (starting with `/`): Resolved relative to `basedir`
  ```pug
  // If basedir is 'src', this resolves to 'src/data/navigation.json'
  - const $dataFiles = ['/data/navigation.json']
  ```

- **Relative paths**: Resolved relative to the entry file's directory
  ```pug
  // pages/index.pug
  // Resolves to 'pages/data/navigation.json'
  - const $dataFiles = ['./data/navigation.json']
  // Resolves to 'data/navigation.json' (parent directory)
  - const $dataFiles = ['../data/navigation.json']
  ```

#### Important Constraints

1. **Entry files only**: `$dataFiles` can only be used in entry files (files directly passed to the compiler)
   ```pug
   // ✓ OK - Entry file
   // pages/index.pug
   - const $dataFiles = ['/data/nav.json']
   ```

   ```pug
   // ✗ NOT ALLOWED - Included component
   // components/Header.pug
   - const $dataFiles = ['/data/nav.json']  // Will be ignored
   ```

2. **Data separation with `dataKey`**:
   - **Global data** (from `data` option): Wrapped in `dataKey` if specified
   - **Page data** (from `$dataFiles`): Always injected directly, never wrapped
   
   ```javascript
   // Config with dataKey
   export default {
     data: './data/global.json',
     dataKey: 'global'
   }
   ```
   
   ```pug
   // pages/index.pug
   - const $dataFiles = ['/data/index.json']
   
   // Global data: accessed via 'global' key
   p= global.siteName
   
   // Page data: accessed directly
   p= hero.title
   ```

3. **Merge order**: Data is merged in the following order (later sources override earlier ones):
   - Global data from config (`data` option)
   - Global data from CLI (`--obj` flag)
   - Page-specific data from `$dataFiles`

4. **Automatic removal**: The `$dataFiles` declaration is automatically removed from the output, so it won't appear in the compiled HTML

#### Example Workflow

**Project structure:**
```
project/
├── pugtail.config.js
├── src/
│   ├── data/
│   │   ├── global.json     # Global data
│   │   ├── navigation.json # Page-specific
│   │   └── footer.json     # Page-specific
│   └── pages/
│       ├── index.pug       # Entry file
│       └── about.pug       # Entry file
```

**Configuration:**
```javascript
// pugtail.config.js
export default {
  basedir: 'src',
  data: './data/global.json',  // Global data for all pages
  dataKey: 'global',           // Wrap global data in 'global' key
  files: {
    input: 'src/pages/**/*.pug',
    output: 'dist',
  },
  validation: {
    scopeIsolation: 'error',
    allowedGlobals: ['global']  // Allow components to access global.*
  }
}
```

**Entry file:**
```pug
// src/pages/index.pug
- const $dataFiles = ['/data/navigation.json', '/data/footer.json']

// Access global data (from global.json, via 'global' key)
p= global.siteName

// Access page-specific data (from $dataFiles, directly)
header
  each item in navigation
    a(href=item.url)= item.label

footer
  p= footer.copyright
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
- **Description**: Enable detailed debug output for troubleshooting compilation issues

When enabled, displays detailed information about:
- Component registration (name, slots, location)
- Slot replacements (provided slots vs defined slots)
- File processing steps (lexing, parsing, transformation)
- Data loading
- AST traversal for slot detection

**Useful for:**
- Debugging slot definition/usage issues
- Understanding component transformation flow
- Troubleshooting compilation errors
- Investigating missing or undetected slots

```javascript
debug: true
```

**CLI Usage:**
```bash
# Enable debug mode via CLI flag
pug-tail -d src/**/*.pug -o dist/

# Or with long form
pug-tail --debug src/**/*.pug -o dist/
```

**Example Debug Output:**
```
[pug-tail] Starting transformation...
[pug-tail] Lexed 398 tokens
[DEBUG] Registered component: Card
  - Slots: content, footer
  - Location: /path/to/Card.pug:1
[DEBUG] replaceSlots called:
  - Provided slots: content
  - Defined slots: content, footer
  - Call location: /path/to/about.pug:42
```

### `validation`

Validation and code quality settings.

#### `validation.scopeIsolation`

- **Type**: `'error' | 'warn' | 'off'`
- **Default**: `'error'`
- **Description**: Controls how external variable references in components are handled

**Modes:**

- **`'error'` (default, strict mode)**
  - Throws compilation errors when components reference external variables
  - Enforces complete scope isolation
  - Recommended for new projects
  - Follows Vue.js/React best practices

- **`'warn'`**
  - Logs warnings but allows compilation
  - Useful for gradual migration from legacy code
  - Helps identify scope issues without breaking builds

- **`'off'`**
  - Disables validation entirely
  - Components can access external variables (legacy Pug behavior)
  - Use only when necessary for backward compatibility

**Example:**

```javascript
// Strict mode (default, recommended)
validation: {
  scopeIsolation: 'error'  // Can be omitted (default)
}

// Gradual migration with warnings
validation: {
  scopeIsolation: 'warn'
}

// Legacy mode (disable validation)
validation: {
  scopeIsolation: 'off'
}
```

**Error Example:**

```pug
// This will throw an error in strict mode:
- const message = 'Hello'

component Card()
  p= message  // Error: Component "Card" references external variable "message"

Card()
```

**Correct Usage:**

```pug
// Pass via props:
- const message = 'Hello'

component Card()
  - const { text } = $props
  p= text

Card(text=message)  // ✓ OK
```

#### `validation.allowedGlobals`

- **Type**: `string[]`
- **Default**: `[]`
- **Description**: Additional global variables to allow in components (even in strict mode)

**Built-in allowed identifiers** (always permitted):
- JavaScript standard globals: `console`, `Math`, `Date`, `JSON`, `Object`, `Array`, `String`, `Number`, `Boolean`, `RegExp`, `Error`, `Promise`, `Set`, `Map`, etc.
- Pug built-ins: `attributes`, `block`
- pug-tail keywords: `$props`, `$attrs`

**Example:**

```javascript
validation: {
  scopeIsolation: 'error',
  allowedGlobals: ['myCustomHelper', 'APP_VERSION']
}
```

Now components can reference `myCustomHelper` and `APP_VERSION` without errors:

```pug
component Card()
  p= myCustomHelper('test')  // ✓ OK
  p Version: #{APP_VERSION}   // ✓ OK
```

## Complete Example

```javascript
// pugtail.config.js
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
  data: './data/global.json',
  dataKey: 'global',  // Wrap data in 'global' namespace
  watch: {
    enabled: false,
    debounce: 300,
  },
  validation: {
    scopeIsolation: 'error',
    allowedGlobals: ['global'],  // Allow global data access
  },
  silent: false,
  debug: false,
}
```

## Using ES Modules vs CommonJS

### ES Module (Recommended)

```javascript
// pugtail.config.js or .mjs
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
// pugtail.config.js
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
