// pugtail.config.js
//
// Path Resolution Rules:
//
// 1. If a configuration file exists (Vite style):
//    - Paths within this configuration file are interpreted as relative to the file's location.
//    - Example: Since this file is in `examples/`,
//          `input: '**/*.pug'` means `examples/**/*.pug`.
//          `output: '../compiled'` means `examples/../compiled`, which resolves to `compiled`.
//
// 2. If no configuration file exists (Webpack/ESLint style):
//    - CLI option paths are relative to `process.cwd()` (the directory where the command is executed).
//    - Via `npm run`: The location of `package.json` is the base.
//    - Direct execution: The shell's current directory is the base.
//
export default {
  // File-related settings
  files: {
    // Input files, directories, or glob patterns
    // Can be a string or an array
    // input: 'src/pages',
    // input: ['src/pages', 'src/templates'],
    input: '**/*.pug',

    // Output directory (for multiple files) or filename (for a single file)
    output: '../demo',

    // Root for output paths (base path for maintaining directory structure)
    // If not specified, it's automatically inferred from the input pattern.
    // Example: `root: 'pages'` treats `pages` as the root.
    //     `pages/index.pug` → `compiled/index.html` (`pages` is the root)
    root: 'pages',

    // File entry pattern
    // Controls which `.pug` files are output as `.html`.
    // Supports glob patterns and negation patterns (`!`).
    // Default: ['**/*.pug', '!**/_*.pug', '!**/*.component.pug', '!**/components/**/*.pug']
    entry: [
      '**/*.pug', // All .pug files
      '!**/_*.pug', // Exclude files starting with _ (Pug standard)
      '!**/*.component.pug', // Exclude components based on naming convention
      '!**/components/**/*.pug', // Exclude the components directory
    ],
  },

  // Output file extension (default: .html)
  extension: '.html',

  // Base directory for absolute includes
  basedir: '.',

  // The doctype to use
  doctype: 'html',

  // Pretty-print the output HTML
  pretty: true,

  // Output format: 'html' | 'ast' | 'pug-code'
  format: 'html',

  // Data to be injected
  // Can be a JSON string, file path, or an object
  // data: '{"title": "My Site"}',
  // data: './data.json',
  // data: { title: 'My Site', author: 'John Doe' },
  data: './data/global.json',

  // Key name for injected data (default: none, data injected directly)
  // When specified, data is available as: global.siteName, global.navigation, etc.
  //
  // ⚠️ Important: This enables components to access global data
  // Example: component Header() can access global.siteName
  // Note: This pattern should be used sparingly. Prefer passing data via props.
  dataKey: 'global',

  // Watch mode settings
  watch: {
    enabled: false, // Set to true to enable watch mode
    debounce: 300, // Debounce delay in milliseconds
  },

  // Validation and code quality settings
  validation: {
    // Controls how external variable references in components are handled.
    // - 'error': (Default) Throws an error for external references. Enforces strict scope isolation.
    // - 'warn':  Logs a warning but allows compilation.
    // - 'off':   Disables validation. (Legacy behavior)
    scopeIsolation: 'error',

    // Additional global variables to allow in components even in strict mode.
    // Built-in globals like `Math`, `console`, etc., are always allowed.
    // PugTail special variables: $props and $slots
    //
    // Global data is available via the dataKey (e.g., 'global')
    // By adding 'global' to allowedGlobals, components can access global.siteName, etc.
    //
    // ⚠️ Note: This is convenient but creates implicit dependencies.
    // Best practice: Pass data explicitly via props whenever possible.
    // Use global data access only for truly global values (site name, navigation, etc.)
    allowedGlobals: ['$props', '$slots', 'global'],
  },

  // Silent mode (no log output)
  silent: false,

  // Enable debug output
  debug: false,
}
